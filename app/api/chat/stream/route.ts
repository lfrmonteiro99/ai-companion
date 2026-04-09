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
});

export async function POST(req: NextRequest) {
  let body;
  try {
    body = sendMessageSchema.parse(await req.json());
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
  }

  const { userId, agentId, message } = body;
  const agent = getAgent(agentId);
  if (!agent) {
    return new Response(JSON.stringify({ error: "Agent not found" }), { status: 404 });
  }

  // Setup
  const conversation = await prisma.conversation.upsert({
    where: { userId_agentId: { userId, agentId } },
    update: { updatedAt: new Date() },
    create: { userId, agentId },
  });

  const state = await getOrCreateState(userId, agentId);
  const previousStage = state.stage;
  const mood = await updateMood(userId, agentId, agent);

  await prisma.message.create({
    data: { conversationId: conversation.id, senderRole: "user", content: message },
  });

  const [recentMessages, memories] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 20,
    }),
    retrieveMemories(userId, agentId, agent),
  ]);

  const chatHistory = recentMessages.map((msg) => ({
    role: msg.senderRole as "user" | "assistant",
    content: msg.content,
  }));

  const stateWithMood = { ...state, currentMood: mood };
  const systemPrompt = buildSystemPrompt(agent, stateWithMood, memories, chatHistory);

  // Stream response via SSE
  const encoder = new TextEncoder();
  let fullReply = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await openai.chat.completions.create({
          model: config.openaiModel,
          messages: [
            { role: "system", content: systemPrompt },
            ...chatHistory,
          ],
          temperature: 0.9,
          max_tokens: 500,
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

        // Background: state + memory + milestones
        const allMessages = [...recentMessages.map((m) => ({ senderRole: m.senderRole, content: m.content })), { senderRole: "assistant", content: fullReply }];

        const [, , milestones] = await Promise.all([
          computeStateDelta(message, fullReply, agent, state)
            .then((delta) => applyDelta(userId, agentId, delta))
            .then(() => checkStageProgression(userId, agentId, agent)),
          recentMessages.length % 6 === 0
            ? extractMemories(userId, agentId, allMessages, agent)
            : Promise.resolve(0),
          computeStateDelta(message, fullReply, agent, state)
            .then(() => checkMilestones(userId, agentId, previousStage))
            .catch(() => [] as { type: string; label: string }[]),
        ]);

        // Send done event with metadata
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: "done",
          conversationId: conversation.id,
          stage: state.stage,
          mood,
          milestones: milestones || [],
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
