import { prisma } from "@/lib/prisma";
import { getAgent } from "@/lib/agents";
import { generateChatResponse, ChatMessage } from "./llm";
import { buildSystemPrompt } from "./prompt-builder";
import { getOrCreateState, computeStateDelta, applyDelta } from "./relationship";
import { checkStageProgression } from "./stage";
import { retrieveMemories, extractMemories } from "./memory";
import { updateMood } from "./mood";

export interface SendMessageParams {
  userId: string;
  agentId: string;
  message: string;
}

export interface SendMessageResult {
  reply: string;
  conversationId: string;
  stage: number;
  mood: string;
}

export async function sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
  const { userId, agentId, message } = params;

  const agent = getAgent(agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  // 1. Find or create conversation
  const conversation = await prisma.conversation.upsert({
    where: { userId_agentId: { userId, agentId } },
    update: { updatedAt: new Date() },
    create: { userId, agentId },
  });

  // 2. Get relationship state + update mood
  const state = await getOrCreateState(userId, agentId);
  const mood = await updateMood(userId, agentId, agent);

  // 3. Store user message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderRole: "user",
      content: message,
    },
  });

  // 4. Load context: last 15 messages (down from 30) + memories
  const [recentMessagesDesc, memories] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    retrieveMemories(userId, agentId, agent),
  ]);

  const recentMessages = recentMessagesDesc.reverse();

  const chatHistory: ChatMessage[] = recentMessages.map((msg) => ({
    role: msg.senderRole as "user" | "assistant",
    content: msg.content,
  }));

  // 5. Build system prompt with state + memories + last interaction time
  const stateWithMood = { ...state, currentMood: mood };
  const systemPrompt = buildSystemPrompt(agent, stateWithMood, memories, chatHistory);

  // 6. Generate reply — model selected by stage
  const reply = await generateChatResponse({
    systemPrompt,
    messages: chatHistory,
    stage: state.stage,
  });

  // 7. Store assistant message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderRole: "assistant",
      content: reply,
    },
  });

  // 8. Background tasks — batched: state deltas every 4 messages, memory every 10
  const messageCount = recentMessages.length;
  const allMessages = [...recentMessages.map((m) => ({ senderRole: m.senderRole, content: m.content })), { senderRole: "assistant", content: reply }];

  Promise.all([
    // State deltas every 4 messages (was every message)
    messageCount % 4 === 0
      ? computeStateDelta(message, reply, agent, state)
          .then((delta) => applyDelta(userId, agentId, delta))
          .then(() => checkStageProgression(userId, agentId, agent))
      : Promise.resolve(),
    // Memory extraction every 10 messages (was every 6)
    messageCount % 10 === 0 ? extractMemories(userId, agentId, allMessages, agent) : Promise.resolve(0),
  ]).catch((err) => console.error("Background task error:", err));

  // 9. Return response
  return {
    reply,
    conversationId: conversation.id,
    stage: state.stage,
    mood,
  };
}
