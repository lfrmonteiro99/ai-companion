import { prisma } from "@/lib/prisma";
import { getAgent } from "@/lib/agents";
import { generateChatResponse, ChatMessage } from "./llm";
import { buildSystemPrompt } from "./prompt-builder";
import { getOrCreateState, computeStateDelta, applyDelta } from "./relationship";
import { checkStageProgression } from "./stage";
import { retrieveMemories, extractMemories } from "./memory";
import { updateMood } from "./mood";
import { ConversationMode, AgentConstraints } from "@/lib/types";
import { trackDirectHintUse } from "./hint-usage";
import { sanitizeUserMessage } from "@/lib/utils/sanitize";
import { logger } from "@/lib/utils/logger";

const log = logger("chat");

/** Number of recent messages to load for context */
const MESSAGE_CONTEXT_SIZE = 15;

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
  const { userId, agentId, mode = "practice", scenarioId, attemptId } = params;
  const message = sanitizeUserMessage(params.message);

  const agent = getAgent(agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  // 1. Find or create conversation
  let conversation;
  if ((mode === "scenario" || mode === "challenge") && scenarioId) {
    // Scenario/challenge: find existing for this attempt or create new
    const existing = await prisma.conversation.findFirst({
      where: { userId, agentId, mode, scenarioId },
      orderBy: { createdAt: "desc" },
    });
    conversation = existing || await prisma.conversation.create({
      data: { userId, agentId, mode, scenarioId },
    });
  } else {
    // Practice mode: one conversation per user-agent pair
    const existing = await prisma.conversation.findFirst({
      where: { userId, agentId, mode: "practice" },
    });
    conversation = existing || await prisma.conversation.create({
      data: { userId, agentId, mode: "practice" },
    });
    // Update timestamp
    if (existing) {
      await prisma.conversation.update({ where: { id: existing.id }, data: { updatedAt: new Date() } });
    }
  }

  // 2. Get relationship state + update mood
  const state = await getOrCreateState(userId, agentId);
  const mood = await updateMood(userId, agentId, agent);

  // 3. Store user message
  await trackDirectHintUse(conversation.id, message);
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderRole: "user",
      content: message,
    },
  });

  // 4. Load context: recent messages + memories
  const [recentMessagesDesc, memories] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: MESSAGE_CONTEXT_SIZE,
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

  const bgContext = { userId, agentId, conversationId: conversation.id, messageCount };

  // State deltas every 4 messages
  if (messageCount % 4 === 0) {
    computeStateDelta(message, reply, agent, state)
      .then((delta) => applyDelta(userId, agentId, delta))
      .then(() => checkStageProgression(userId, agentId, agent))
      .catch((err) => log.error("Background state delta failed", err, bgContext));
  }

  // Memory extraction every 10 messages
  if (messageCount % 10 === 0) {
    extractMemories(userId, agentId, allMessages, agent)
      .catch((err) => log.error("Background memory extraction failed", err, bgContext));
  }

  // 10. Return response with message count for scenario tracking
  return {
    reply,
    conversationId: conversation.id,
    stage: state.stage,
    mood,
    messageCount: messageCount + 1,
  };
}
