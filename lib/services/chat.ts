import { prisma } from "@/lib/prisma";
import { getAgent } from "@/lib/agents";
import { generateChatResponse, ChatMessage } from "./llm";
import { buildSystemPrompt } from "./prompt-builder";
import { getOrCreateState, computeStateDelta, applyDelta } from "./relationship";
import { checkStageProgression } from "./stage";
import { retrieveMemories, extractMemories } from "./memory";
import { updateMood } from "./mood";
import { ConversationMode, AgentConstraints } from "@/lib/types";

export interface SendMessageParams {
  userId: string;
  agentId: string;
  message: string;
  mode?: ConversationMode;
  scenarioId?: string;
  attemptId?: string;
}

export interface SendMessageResult {
  reply: string;
  conversationId: string;
  stage: number;
  mood: string;
  messageCount: number;
}

export async function sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
  const { userId, agentId, message, mode = "practice", scenarioId, attemptId } = params;

  const agent = getAgent(agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  // 1. Find or create conversation
  let conversation;
  if (mode === "scenario" || mode === "challenge") {
    // Scenario/challenge: create a new conversation linked to scenario
    if (scenarioId) {
      conversation = await prisma.conversation.create({
        data: { userId, agentId, mode, scenarioId },
      });
    } else {
      conversation = await prisma.conversation.upsert({
        where: { userId_agentId: { userId, agentId } },
        update: { updatedAt: new Date() },
        create: { userId, agentId, mode },
      });
    }
  } else {
    // Practice mode: one conversation per user-agent pair
    conversation = await prisma.conversation.upsert({
      where: { userId_agentId: { userId, agentId } },
      update: { updatedAt: new Date() },
      create: { userId, agentId, mode: "practice" },
    });
  }

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

  // 5. Load scenario context if applicable
  let scenarioContext = null;
  if (scenarioId && (mode === "scenario" || mode === "challenge")) {
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
    });
    if (scenario) {
      scenarioContext = {
        context: scenario.context,
        objective: scenario.objective,
        agentConstraints: scenario.agentConstraints as AgentConstraints | null,
      };
    }
  }

  // 6. Build system prompt with state + memories + scenario
  const stateWithMood = { ...state, currentMood: mood };
  const systemPrompt = buildSystemPrompt(agent, stateWithMood, memories, chatHistory, scenarioContext);

  // 7. Generate reply — model selected by stage
  const reply = await generateChatResponse({
    systemPrompt,
    messages: chatHistory,
    stage: state.stage,
  });

  // 8. Store assistant message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderRole: "assistant",
      content: reply,
    },
  });

  // 9. Background tasks — batched: state deltas every 4 messages, memory every 10
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

  // 10. Return response with message count for scenario tracking
  return {
    reply,
    conversationId: conversation.id,
    stage: state.stage,
    mood,
    messageCount: messageCount + 1,
  };
}
