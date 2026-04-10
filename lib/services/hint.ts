import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { config } from "@/lib/config";
import { getAgent } from "@/lib/agents";
import { getOrCreateState } from "@/lib/services/relationship";
import { retrieveMemories } from "@/lib/services/memory";
import type { ConversationMode } from "@/lib/types";

const openai = new OpenAI({ apiKey: config.openaiApiKey });

export interface HintResult {
  hint: string;
  reason: string;
  suggestions: string[];
  hintsUsed: number;
  conversationId: string | null;
}

interface GenerateHintInput {
  userId: string;
  agentId: string;
  mode: ConversationMode;
  scenarioId?: string;
  attemptId?: string;
  conversationId?: string;
  draftMessage?: string;
}

async function resolveConversation(input: GenerateHintInput) {
  if (input.conversationId) {
    return prisma.conversation.findUnique({ where: { id: input.conversationId } });
  }
  if (input.mode === "practice") {
    return prisma.conversation.findFirst({
      where: { userId: input.userId, agentId: input.agentId, mode: "practice" },
      orderBy: { updatedAt: "desc" },
    });
  }
  return prisma.conversation.findFirst({
    where: {
      userId: input.userId,
      agentId: input.agentId,
      mode: input.mode,
      ...(input.scenarioId ? { scenarioId: input.scenarioId } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });
}

async function incrementHintsUsed(input: GenerateHintInput, conversationId: string | null): Promise<number> {
  if (input.attemptId) {
    const updated = await prisma.scenarioAttempt.update({
      where: { id: input.attemptId },
      data: { hintsUsed: { increment: 1 } },
      select: { hintsUsed: true },
    });
    return updated.hintsUsed;
  }

  if (!conversationId) return 0;
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { sessionMeta: true },
  });
  const currentMeta = (conversation?.sessionMeta as Record<string, unknown> | null) ?? {};
  const currentHints = typeof currentMeta.hintsUsed === "number" ? currentMeta.hintsUsed : 0;
  const nextHints = currentHints + 1;
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      sessionMeta: {
        ...currentMeta,
        hintsUsed: nextHints,
      },
    },
  });
  return nextHints;
}

export async function getHintsUsed(input: GenerateHintInput, conversationId: string | null): Promise<number> {
  if (input.attemptId) {
    const attempt = await prisma.scenarioAttempt.findUnique({
      where: { id: input.attemptId },
      select: { hintsUsed: true },
    });
    return attempt?.hintsUsed ?? 0;
  }
  if (!conversationId) return 0;
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { sessionMeta: true },
  });
  const meta = (conversation?.sessionMeta as Record<string, unknown> | null) ?? {};
  return typeof meta.hintsUsed === "number" ? meta.hintsUsed : 0;
}

export async function generateContextualHint(input: GenerateHintInput): Promise<HintResult> {
  const agent = getAgent(input.agentId);
  if (!agent) throw new Error(`Agent not found: ${input.agentId}`);

  const conversation = await resolveConversation(input);
  const ensuredConversation =
    conversation ??
    (input.mode === "practice"
      ? await prisma.conversation.create({
          data: { userId: input.userId, agentId: input.agentId, mode: "practice" },
        })
      : null);
  const conversationId = ensuredConversation?.id ?? null;

  const [state, scenario, recentMessagesDesc, memories] = await Promise.all([
    getOrCreateState(input.userId, input.agentId),
    input.scenarioId ? prisma.scenario.findUnique({ where: { id: input.scenarioId } }) : Promise.resolve(null),
    conversationId
      ? prisma.message.findMany({
          where: { conversationId },
          orderBy: { createdAt: "desc" },
          take: 12,
        })
      : Promise.resolve([]),
    retrieveMemories(input.userId, input.agentId, agent),
  ]);

  const recentMessages = [...recentMessagesDesc].reverse();
  const transcript = recentMessages
    .map((m) => `${m.senderRole === "assistant" ? agent.name : "Utilizador"}: ${m.content}`)
    .join("\n");
  const memoryContext = memories.slice(0, 5).map((m) => `[${m.type}] ${m.content}`).join(" | ");

  const prompt = `Tu és um coach de comunicação social.\nGera UMA dica prática para a próxima mensagem do utilizador.\n\nContexto:\n- Modo: ${input.mode}\n- Agente: ${agent.name} (${agent.shortBio})\n- Estado atual: interest=${state.interest}, trust=${state.trust}, comfort=${state.comfort}, tension=${state.tension}, respect=${state.respect}\n- Mensagem em rascunho (se existir): ${input.draftMessage || "sem rascunho"}\n- Cenário: ${scenario ? `${scenario.title} | objetivo: ${scenario.objective}` : "n/a"}\n- Memórias relevantes: ${memoryContext || "nenhuma"}\n\nÚltimas mensagens:\n${transcript || "Sem histórico ainda."}\n\nRegras da resposta:\n- Responder APENAS JSON válido com chaves: reason, hint, suggestions\n- reason: 1 frase curta em pt-PT explicando o que melhorar\n- hint: 1 orientação acionável para a próxima mensagem\n- suggestions: array com 2 a 3 exemplos de mensagens naturais, curtas e calibradas\n- Nunca usar scripts manipulativos, pressão emocional ou linguagem agressiva\n- Manter o estilo natural e respeitador\n`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Tu és um motor de dicas contextuais. Retorna apenas JSON válido sem markdown.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 350,
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}") as {
    reason?: string;
    hint?: string;
    suggestions?: string[];
  };

  const hintsUsed = await incrementHintsUsed(input, conversationId);

  return {
    reason: parsed.reason || "Tenta ser mais específico e puxar um detalhe da conversa.",
    hint: parsed.hint || "Mostra curiosidade genuína com uma pergunta concreta.",
    suggestions: (parsed.suggestions || []).slice(0, 3),
    hintsUsed,
    conversationId,
  };
}
