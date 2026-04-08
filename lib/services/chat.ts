import { prisma } from "@/lib/prisma";
import { getAgent } from "@/lib/agents";
import { generateChatResponse, ChatMessage } from "./llm";
import { buildSystemPrompt } from "./prompt-builder";
import { getOrCreateState, computeStateDelta, applyDelta } from "./relationship";
import { checkStageProgression } from "./stage";

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

  // 2. Get or create relationship state
  const state = await getOrCreateState(userId, agentId);

  // 3. Store user message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderRole: "user",
      content: message,
    },
  });

  // 4. Load recent messages for context
  const recentMessages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const chatHistory: ChatMessage[] = recentMessages.map((msg) => ({
    role: msg.senderRole as "user" | "assistant",
    content: msg.content,
  }));

  // 5. Load memories (Phase 3 — empty for now)
  const memories: { type: string; content: string }[] = [];

  // 6. Build 4-layer system prompt
  const systemPrompt = buildSystemPrompt(agent, state, memories);

  // 7. Generate reply via OpenAI
  const reply = await generateChatResponse({
    systemPrompt,
    messages: chatHistory,
  });

  // 8. Store assistant message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderRole: "assistant",
      content: reply,
    },
  });

  // 9. Compute and apply relationship state deltas (async, non-blocking)
  computeStateDelta(message, reply, agent, state)
    .then((delta) => applyDelta(userId, agentId, delta))
    .then(() => checkStageProgression(userId, agentId, agent))
    .catch((err) => console.error("State update error:", err));

  // 10. Return response
  return {
    reply,
    conversationId: conversation.id,
    stage: state.stage,
    mood: state.currentMood,
  };
}
