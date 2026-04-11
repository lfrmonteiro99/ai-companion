import { prisma } from "@/lib/prisma";
import { SkillScores, AgentConfig, SuccessCriteria } from "@/lib/types";
import { generateStructuredOutput } from "./llm";
import { UserSkillScore } from "@prisma/client";
import { logger } from "@/lib/utils/logger";

const log = logger("evaluation");

const SKILL_KEYS: (keyof SkillScores)[] = [
  "confidence",
  "warmth",
  "curiosity",
  "calibration",
  "authenticity",
  "pressureLevel",
  "awkwardness",
  "emotionalIntelligence",
  "boundaryRespect",
  "conversationalMomentum",
];

const INVERSE_SKILLS: (keyof SkillScores)[] = ["pressureLevel", "awkwardness"];

const DEFAULT_SCORES: SkillScores = {
  confidence: 50,
  warmth: 50,
  curiosity: 50,
  calibration: 50,
  authenticity: 50,
  pressureLevel: 50,
  awkwardness: 50,
  emotionalIntelligence: 50,
  boundaryRespect: 50,
  conversationalMomentum: 50,
};

const DECAY_WEIGHT = 0.7;
const SESSION_WEIGHT = 0.3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildEvaluationPrompt(
  messages: { role: string; content: string }[],
  agent: AgentConfig,
  scenario?: { objective: string; successCriteria: SuccessCriteria }
): string {
  const transcript = messages
    .map((m) => `[${m.role}]: ${m.content}`)
    .join("\n");

  const scenarioBlock = scenario
    ? `
SCENARIO CONTEXT:
- Objective: ${scenario.objective}
- Success criteria: ${JSON.stringify(scenario.successCriteria)}
Consider whether the user worked toward the objective effectively.`
    : "";

  return `You are an expert conversation analyst evaluating a user's social/dating skills in a simulated conversation. Be honest, calibrated, and critical — do NOT inflate scores. Most average conversations should land around 40-60. Only truly exceptional moments deserve 80+, and only terrible ones deserve below 20.

AGENT PERSONALITY:
- Name: ${agent.name}
- Archetype: ${agent.archetype}
- Voice style: ${agent.voiceStyle}
- Values/preferences: ${agent.interactionPreferences.join(", ")}
- Dislikes: ${agent.dislikes.join(", ")}
- Humor preference: ${agent.humorProfile}
- Depth preference: ${agent.depthPreference}
- Trust-building pace: ${agent.trustBuildingPace}
${scenarioBlock}

CONVERSATION TRANSCRIPT:
${transcript}

Evaluate the USER's messages only (not the agent's). Score each dimension 0-100:

1. confidence — Did the user's tone convey self-assurance without arrogance? Were they decisive, or hedging and apologetic?
2. warmth — Did the user show genuine interest and care? Was the tone inviting and friendly without being sycophantic?
3. curiosity — Did the user ask thoughtful questions? Did they show interest in the agent as a person, or stick to surface-level chatter?
4. calibration — Did the user read the room? Were their messages well-timed in tone and topic given the agent's personality, mood, and context?
5. authenticity — Did the user sound like a real person with their own perspective, or did they use generic pickup lines and hollow flattery?
6. pressureLevel — How much pressure did the user apply? 0 = no pressure at all, 100 = extremely pushy/insistent. Lower is generally better.
7. awkwardness — How awkward were the user's messages? 0 = perfectly smooth, 100 = cringe-inducing. Consider non-sequiturs, forced jokes, over-sharing, and tonal mismatches.
8. emotionalIntelligence — Did the user pick up on emotional cues? Did they respond appropriately to the agent's mood shifts, hints, and boundaries?
9. boundaryRespect — Did the user respect boundaries when set, or push past them? Did they handle rejection or deflection gracefully?
10. conversationalMomentum — Did the conversation flow naturally? Did the user keep things moving without stalling or jumping topics erratically?

Return a JSON object with exactly these keys: confidence, warmth, curiosity, calibration, authenticity, pressureLevel, awkwardness, emotionalIntelligence, boundaryRespect, conversationalMomentum. Each value must be an integer 0-100.`;
}

function parseAndValidateScores(raw: Record<string, number>): SkillScores {
  const scores: SkillScores = { ...DEFAULT_SCORES };

  for (const key of SKILL_KEYS) {
    const value = raw[key];
    if (typeof value === "number" && !isNaN(value)) {
      scores[key] = clamp(Math.round(value), 0, 100);
    }
  }

  return scores;
}

function calculateOverallScore(scores: SkillScores): number {
  let sum = 0;
  for (const key of SKILL_KEYS) {
    const value = scores[key];
    sum += INVERSE_SKILLS.includes(key) ? 100 - value : value;
  }
  return Math.round(sum / SKILL_KEYS.length);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function evaluateSession(
  messages: { role: string; content: string }[],
  agent: AgentConfig,
  scenario?: { objective: string; successCriteria: SuccessCriteria }
): Promise<SkillScores> {
  if (messages.length === 0) {
    return { ...DEFAULT_SCORES };
  }

  try {
    const prompt = buildEvaluationPrompt(messages, agent, scenario);
    const raw = await generateStructuredOutput(prompt);
    return parseAndValidateScores(raw);
  } catch (error) {
    log.warn("LLM evaluation failed, using fallback scores", { messageCount: messages.length, agentId: agent.id });
    return { ...DEFAULT_SCORES };
  }
}

export async function updateGlobalSkillScores(
  userId: string,
  sessionScores: SkillScores
): Promise<void> {
  const existing = await prisma.userSkillScore.findUnique({
    where: { userId },
  });

  const updatedSkills: Record<string, number> = {};

  for (const key of SKILL_KEYS) {
    const oldValue = existing ? (existing[key] as number) : 50;
    updatedSkills[key] = Math.round(
      oldValue * DECAY_WEIGHT + sessionScores[key] * SESSION_WEIGHT
    );
  }

  const totalSessions = (existing?.totalSessions ?? 0) + 1;

  const overallScore = calculateOverallScore(updatedSkills as unknown as SkillScores);

  await prisma.userSkillScore.upsert({
    where: { userId },
    create: {
      userId,
      ...updatedSkills,
      overallScore,
      totalSessions,
    },
    update: {
      ...updatedSkills,
      overallScore,
      totalSessions,
    },
  });
}

export async function getSkillScores(
  userId: string
): Promise<UserSkillScore | null> {
  return prisma.userSkillScore.findUnique({
    where: { userId },
  });
}
