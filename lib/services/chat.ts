import { prisma } from "@/lib/prisma";
import { getAgent } from "@/lib/agents";
import { generateChatResponse, ChatMessage } from "./llm";
import { buildSystemPrompt } from "./prompt-builder";

export interface SendMessageParams {
  userId: string;
  agentId: string;
  message: string;
}

export interface SendMessageResult {
  reply: string;
  conversationId: string;
}

export async function sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
  const { userId, agentId, message } = params;

  const agent = getAgent(agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  // Find or create conversation
  const conversation = await prisma.conversation.upsert({
    where: { userId_agentId: { userId, agentId } },
    update: { updatedAt: new Date() },
    create: { userId, agentId },
  });

  // Ensure relationship state exists (for future phases)
  await prisma.relationshipState.upsert({
    where: { userId_agentId: { userId, agentId } },
    update: { lastInteractionAt: new Date() },
    create: { userId, agentId },
  });

  // Store user message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderRole: "user",
      content: message,
    },
  });

  // Load recent messages for context
  const recentMessages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  // Build message history for OpenAI
  const chatHistory: ChatMessage[] = recentMessages.map((msg) => ({
    role: msg.senderRole as "user" | "assistant",
    content: msg.content,
  }));

  // Build system prompt and generate response
  const systemPrompt = buildSystemPrompt(agent);
  const reply = await generateChatResponse({
    systemPrompt,
    messages: chatHistory,
  });

  // Store assistant message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderRole: "assistant",
      content: reply,
    },
  });

  return { reply, conversationId: conversation.id };
}
