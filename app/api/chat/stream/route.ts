import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgent } from "@/lib/agents";
import { buildSystemPrompt } from "@/lib/services/prompt-builder";
import { getOrCreateState, computeStateDelta, applyDelta } from "@/lib/services/relationship";
import { checkStageProgression } from "@/lib/services/stage";
import { retrieveMemories, extractMemories } from "@/lib/services/memory";
import { updateMood } from "@/lib/services/mood";
import { checkMilestones } from "@/lib/services/milestone";
import { config } from "@/lib/config";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: config.openaiApiKey });

const sendMessageSchema = z.object({
  userId: z.string().uuid(),
  agentId: z.string().min(1),
  message: z.string().min(1).max(2000),
  mode: z.enum(["practice", "scenario", "challenge"]).optional(),
  scenarioId: z.string().optional(),
  attemptId: z.string().optional(),
});

/**
 * Select model based on relationship stage.
 * Stage 0-1: gpt-4o-mini (16x cheaper)
 * Stage 2+:  gpt-4o (nuanced personality)
 */
function selectModel(stage: number): string {
  if (stage <= 1) return "gpt-4o-mini";
  return config.openaiModel;
}

function selectMaxTokens(stage: number): number {
  if (stage <= 0) return 200;
  if (stage <= 1) return 300;
  return 400;
}

export async function POST(req: NextRequest) {
  let body;
  try {
    body = sendMessageSchema.parse(await req.json());
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
  }

  const { userId, agentId, message, mode = "practice", scenarioId } = body;
  const agent = getAgent(agentId);
  if (!agent) {
    return new Response(JSON.stringify({ error: "Agent not found" }), { status: 404 });
  }

  // Setup — scenario mode may create fresh conversations
  let conversation;
  if (scenarioId && (mode === "scenario" || mode === "challenge")) {
    // Find existing scenario conversation or create
    const existing = await prisma.conversation.findFirst({
      where: { userId, agentId, scenarioId, mode },
    });
    conversation = existing || await prisma.conversation.create({
      data: { userId, agentId, mode, scenarioId },
    });
  } else {
    const existingConv = await prisma.conversation.findFirst({
      where: { userId, agentId, mode: "practice" },
    });
    if (existingConv) {
      conversation = existingConv;
      await prisma.conversation.update({ where: { id: existingConv.id }, data: { updatedAt: new Date() } });
    } else {
      conversation = await prisma.conversation.create({
        data: { userId, agentId, mode: "practice" },
      });
    }
  }

  const state = await getOrCreateState(userId, agentId);
  const previousStage = state.stage;
  const mood = await updateMood(userId, agentId, agent);

  await prisma.message.create({
    data: { conversationId: conversation.id, senderRole: "user", content: message },
  });

  // Load last 15 messages (down from 30) + memories
  const [recentMessagesDesc, memories] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    retrieveMemories(userId, agentId, agent),
  ]);

  const recentMessages = recentMessagesDesc.reverse();

  const chatHistory = recentMessages.map((msg) => ({
    role: msg.senderRole as "user" | "assistant",
    content: msg.content,
  }));

  // Load scenario context if in scenario/challenge mode
  let scenarioContext = null;
  if (scenarioId && (mode === "scenario" || mode === "challenge")) {
    const scenario = await prisma.scenario.findUnique({ where: { id: scenarioId } });
    if (scenario) {
      scenarioContext = {
        context: scenario.context,
        objective: scenario.objective,
        agentConstraints: scenario.agentConstraints as import("@/lib/types").AgentConstraints | null,
      };
    }
  }

  const stateWithMood = { ...state, currentMood: mood };
  const systemPrompt = buildSystemPrompt(agent, stateWithMood, memories, chatHistory, scenarioContext);

  // Model and token selection based on stage
  const model = selectModel(state.stage);
  const maxTokens = selectMaxTokens(state.stage);

  // Stream response via SSE
  const encoder = new TextEncoder();
  let fullReply = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await openai.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            ...chatHistory,
          ],
          temperature: 0.9,
          max_tokens: maxTokens,
          frequency_penalty: 0.7,
          presence_penalty: 0.5,
          stream: true,
        });

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullReply += content;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", content })}\n\n`));
          }
        }

        // Store assistant message
        await prisma.message.create({
          data: { conversationId: conversation.id, senderRole: "assistant", content: fullReply },
        });

        // Background: state + memory + milestones (batched)
        const messageCount = recentMessages.length;
        const allMessages = [...recentMessages.map((m) => ({ senderRole: m.senderRole, content: m.content })), { senderRole: "assistant", content: fullReply }];

        const backgroundTasks: Promise<unknown>[] = [
          // State deltas every 4 messages (was every message)
          messageCount % 4 === 0
            ? computeStateDelta(message, fullReply, agent, state)
                .then((delta) => applyDelta(userId, agentId, delta))
                .then(() => checkStageProgression(userId, agentId, agent))
            : Promise.resolve(),
          // Memory extraction every 10 messages (was every 6)
          messageCount % 10 === 0
            ? extractMemories(userId, agentId, allMessages, agent)
            : Promise.resolve(0),
          // Milestones check
          checkMilestones(userId, agentId, previousStage)
            .catch(() => [] as { type: string; label: string }[]),
        ];

        const results = await Promise.all(backgroundTasks);
        const milestones = results[2] || [];

        // Send done event with metadata
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: "done",
          conversationId: conversation.id,
          stage: state.stage,
          mood,
          milestones,
        })}\n\n`));

        controller.close();
      } catch (error) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: String(error) })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
