import { prisma } from "@/lib/prisma";
import { AgentConfig } from "@/lib/types";

const ALL_MOODS = ["receptive", "distant", "playful", "demanding", "vulnerable", "curious", "affectionate", "reflective", "jealous_light"];

interface MoodInput {
  currentMood: string;
  stage: number;
  interest: number;
  trust: number;
  comfort: number;
  tension: number;
  attachment: number;
  lastInteractionAt: Date;
}

/**
 * Rule-based mood engine. Deterministic (no LLM call) for speed and cost.
 * Mood sits on top of personality — it shifts tone but doesn't override identity.
 */
export function computeMood(agent: AgentConfig, state: MoodInput): string {
  const hoursSinceLastInteraction = (Date.now() - state.lastInteractionAt.getTime()) / (1000 * 60 * 60);

  // Long absence effects
  if (hoursSinceLastInteraction > 48) {
    if (state.attachment > 50) return "jealous_light";
    if (agent.coreTraits.warmth > 0.6) return "curious";
    return "distant";
  }
  if (hoursSinceLastInteraction > 24) {
    if (state.attachment > 40) return "curious";
    return "distant";
  }

  // State-driven mood shifts
  if (state.tension > 70 && state.comfort < 30) {
    return "demanding";
  }
  if (state.comfort > 60 && state.attachment > 50) {
    return "affectionate";
  }
  if (state.trust > 60 && state.stage >= 3 && Math.random() < 0.15) {
    return "vulnerable";
  }
  if (state.interest > 60 && agent.coreTraits.playfulness > 0.6) {
    return "playful";
  }
  if (state.tension > 50 && state.trust < 40) {
    return "reflective";
  }

  // Random mood variation (10% chance to shift from current)
  if (Math.random() < 0.1) {
    const validMoods = ALL_MOODS.filter((m) => {
      // Personality constraints
      if (m === "vulnerable" && state.stage < 2) return false;
      if (m === "affectionate" && agent.coreTraits.warmth < 0.4 && state.stage < 3) return false;
      if (m === "jealous_light" && state.attachment < 30) return false;
      return m !== state.currentMood;
    });
    if (validMoods.length > 0) {
      return validMoods[Math.floor(Math.random() * validMoods.length)];
    }
  }

  // Default: keep current mood, or receptive
  return state.currentMood || "receptive";
}

/**
 * Update mood in the database.
 */
export async function updateMood(userId: string, agentId: string, agent: AgentConfig): Promise<string> {
  const state = await prisma.relationshipState.findUnique({
    where: { userId_agentId: { userId, agentId } },
  });
  if (!state) return "receptive";

  const newMood = computeMood(agent, state);

  if (newMood !== state.currentMood) {
    await prisma.relationshipState.update({
      where: { userId_agentId: { userId, agentId } },
      data: { currentMood: newMood },
    });
  }

  return newMood;
}
