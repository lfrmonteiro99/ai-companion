import { prisma } from "@/lib/prisma";
import { AgentConfig } from "@/lib/types";
import { generateStructuredOutput } from "./llm";

export interface StateDelta {
  interest: number;
  trust: number;
  comfort: number;
  tension: number;
  respect: number;
  attachment: number;
  emotionalOpenness: number;
  conversationDepth: number;
  dynamicAlignment: number;
}

export async function getOrCreateState(userId: string, agentId: string) {
  return prisma.relationshipState.upsert({
    where: { userId_agentId: { userId, agentId } },
    update: { lastInteractionAt: new Date() },
    create: { userId, agentId },
  });
}

export async function computeStateDelta(
  userMessage: string,
  agentReply: string,
  agent: AgentConfig,
  currentState: { interest: number; trust: number; comfort: number; tension: number; respect: number; attachment: number; emotionalOpenness: number; conversationDepth: number; stage: number },
): Promise<StateDelta> {
  const prompt = `You are a relationship analysis engine for a personality simulation.

Agent personality: ${agent.name} (${agent.archetype})
- Values: ${agent.interactionPreferences.join(", ")}
- Dislikes: ${agent.dislikes.join(", ")}
- Dominance: ${agent.coreTraits.dominance}, Warmth: ${agent.coreTraits.warmth}

Current state: Stage ${currentState.stage}, Interest ${currentState.interest}, Trust ${currentState.trust}, Comfort ${currentState.comfort}, Tension ${currentState.tension}, Respect ${currentState.respect}

User said: "${userMessage}"
Agent replied: "${agentReply}"

How should each relationship dimension change? Return a JSON object with integer deltas between -5 and +5 for each dimension. Consider:
- Does the user's message match what this agent values?
- Is the tone appropriate for the current stage?
- Would this agent respect or dislike this approach?

Return ONLY valid JSON: {"interest":0,"trust":0,"comfort":0,"tension":0,"respect":0,"attachment":0,"emotionalOpenness":0,"conversationDepth":0,"dynamicAlignment":0}`;

  try {
    const result = await generateStructuredOutput(prompt);
    return {
      interest: clampDelta(result.interest),
      trust: clampDelta(result.trust),
      comfort: clampDelta(result.comfort),
      tension: clampDelta(result.tension),
      respect: clampDelta(result.respect),
      attachment: clampDelta(result.attachment),
      emotionalOpenness: clampDelta(result.emotionalOpenness),
      conversationDepth: clampDelta(result.conversationDepth),
      dynamicAlignment: clampDelta(result.dynamicAlignment),
    };
  } catch {
    // Fallback: small positive deltas for continued engagement
    return { interest: 1, trust: 1, comfort: 1, tension: 0, respect: 1, attachment: 0, emotionalOpenness: 0, conversationDepth: 1, dynamicAlignment: 0 };
  }
}

export async function applyDelta(userId: string, agentId: string, delta: StateDelta) {
  const state = await prisma.relationshipState.findUnique({
    where: { userId_agentId: { userId, agentId } },
  });
  if (!state) return;

  await prisma.relationshipState.update({
    where: { userId_agentId: { userId, agentId } },
    data: {
      interest: clamp(state.interest + delta.interest),
      trust: clamp(state.trust + delta.trust),
      comfort: clamp(state.comfort + delta.comfort),
      tension: clamp(state.tension + delta.tension),
      respect: clamp(state.respect + delta.respect),
      attachment: clamp(state.attachment + delta.attachment),
      emotionalOpenness: clamp(state.emotionalOpenness + delta.emotionalOpenness),
      conversationDepth: clamp(state.conversationDepth + delta.conversationDepth),
      dynamicAlignment: clamp(state.dynamicAlignment + delta.dynamicAlignment),
      lastInteractionAt: new Date(),
    },
  });
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function clampDelta(value: number | undefined): number {
  if (value === undefined || isNaN(value)) return 0;
  return Math.max(-5, Math.min(5, Math.round(value)));
}
