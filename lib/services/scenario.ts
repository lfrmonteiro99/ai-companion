import { prisma } from "@/lib/prisma";
import type { Scenario, ScenarioAttempt } from "@prisma/client";
import type { SuccessCriteria, ConversationMode } from "@/lib/types";

// --- Types ---

export type ScenarioWithStatus = Scenario & {
  locked: boolean;
  bestScore: number | null;
  attemptCount: number;
};

interface CompletionState {
  interest: number;
  trust: number;
  comfort: number;
  tension: number;
  respect: number;
  conversationDepth: number;
}

interface CompletionResult {
  completed: boolean;
  success: boolean;
  reason: string;
}

// --- Public API ---

/**
 * Fetch all active scenarios with per-user status (locked/unlocked, best score, attempt count).
 * Sorted by scenario order.
 */
export async function getAvailableScenarios(userId: string): Promise<ScenarioWithStatus[]> {
  const [scenarios, progress, attempts] = await Promise.all([
    prisma.scenario.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    }),
    prisma.userProgress.findUnique({
      where: { userId },
    }),
    prisma.scenarioAttempt.findMany({
      where: { userId },
      select: { scenarioId: true, score: true, status: true },
    }),
  ]);

  const userLevel = progress?.level ?? 1;

  // Build per-scenario attempt stats
  const attemptsByScenario = new Map<
    string,
    { count: number; bestScore: number | null }
  >();

  for (const attempt of attempts) {
    const existing = attemptsByScenario.get(attempt.scenarioId) ?? {
      count: 0,
      bestScore: null,
    };
    existing.count++;

    if (attempt.status === "completed" && attempt.score != null) {
      const scoreObj = attempt.score as Record<string, unknown>;
      const overallScore =
        typeof scoreObj.overallScore === "number" ? scoreObj.overallScore : null;
      if (overallScore !== null) {
        existing.bestScore =
          existing.bestScore === null
            ? overallScore
            : Math.max(existing.bestScore, overallScore);
      }
    }

    attemptsByScenario.set(attempt.scenarioId, existing);
  }

  return scenarios.map((scenario) => {
    const unlock = scenario.unlockRequirement as { minLevel?: number } | null;
    const requiredLevel = unlock?.minLevel ?? 1;
    const locked = userLevel < requiredLevel;
    const stats = attemptsByScenario.get(scenario.id);

    return {
      ...scenario,
      locked,
      bestScore: stats?.bestScore ?? null,
      attemptCount: stats?.count ?? 0,
    };
  });
}

/**
 * Start a scenario: creates a new scenario-mode conversation and an in-progress attempt.
 */
export async function startScenario(
  userId: string,
  scenarioId: string,
  agentId: string,
): Promise<{ attempt: ScenarioAttempt; conversation: { id: string } }> {
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
  });
  if (!scenario) {
    throw new Error(`Scenario not found: ${scenarioId}`);
  }

  const mode: ConversationMode = "scenario";

  // Create conversation and attempt in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const conversation = await tx.conversation.create({
      data: {
        userId,
        agentId,
        mode,
        scenarioId,
      },
    });

    const attempt = await tx.scenarioAttempt.create({
      data: {
        userId,
        scenarioId,
        conversationId: conversation.id,
        agentId,
        status: "in_progress",
      },
    });

    return { attempt, conversation };
  });

  return result;
}

/**
 * Check whether a scenario attempt has reached a completion condition.
 * Evaluates maxMessages and successCriteria against the current relationship state.
 */
export async function checkCompletion(
  attemptId: string,
  state: CompletionState,
  messageCount: number,
): Promise<CompletionResult> {
  const attempt = await prisma.scenarioAttempt.findUnique({
    where: { id: attemptId },
    include: { scenario: true },
  });
  if (!attempt) {
    throw new Error(`Scenario attempt not found: ${attemptId}`);
  }

  const { scenario } = attempt;
  const criteria = scenario.successCriteria as SuccessCriteria;

  // Check max messages first — if reached, evaluate final state
  if (scenario.maxMessages != null && messageCount >= scenario.maxMessages) {
    const success = evaluateCriteria(criteria, state);
    return {
      completed: true,
      success,
      reason: success
        ? "Scenario objectives met within the message limit."
        : "Message limit reached without meeting all objectives.",
    };
  }

  // Check if criteria met early
  const criteriaMet = evaluateCriteria(criteria, state);
  if (criteriaMet) {
    return {
      completed: true,
      success: true,
      reason: "All scenario objectives achieved.",
    };
  }

  return {
    completed: false,
    success: false,
    reason: "Scenario still in progress.",
  };
}

/**
 * Mark a scenario attempt as completed with score and XP.
 */
export async function completeScenario(
  attemptId: string,
  success: boolean,
  score?: Record<string, unknown>,
  xpEarned?: number,
  penalty?: {
    hintsUsed: number;
    hintPenaltyScore: number;
    hintPenaltyXp: number;
    rawOverallScore: number;
    adjustedOverallScore: number;
  },
): Promise<ScenarioAttempt> {
  return prisma.scenarioAttempt.update({
    where: { id: attemptId },
    data: {
      status: "completed",
      completedAt: new Date(),
      score: score ? JSON.parse(JSON.stringify(score)) : undefined,
      xpEarned: xpEarned ?? (success ? 50 : 10),
      hintsUsed: penalty?.hintsUsed,
      hintPenaltyScore: penalty?.hintPenaltyScore,
      hintPenaltyXp: penalty?.hintPenaltyXp,
      rawOverallScore: penalty?.rawOverallScore,
      adjustedOverallScore: penalty?.adjustedOverallScore,
    },
  });
}

/**
 * Mark a scenario attempt as abandoned.
 */
export async function abandonScenario(attemptId: string): Promise<void> {
  await prisma.scenarioAttempt.update({
    where: { id: attemptId },
    data: { status: "abandoned" },
  });
}

/**
 * Fetch a single scenario by ID.
 */
export async function getScenarioById(scenarioId: string): Promise<Scenario | null> {
  return prisma.scenario.findUnique({
    where: { id: scenarioId },
  });
}

/**
 * Fetch a user's scenario attempts, optionally filtered by scenario.
 */
export async function getUserAttempts(
  userId: string,
  scenarioId?: string,
): Promise<ScenarioAttempt[]> {
  return prisma.scenarioAttempt.findMany({
    where: {
      userId,
      ...(scenarioId ? { scenarioId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { scenario: true },
  });
}

// --- Internal helpers ---

/**
 * Evaluate all success criteria against the current state.
 * Returns true only if every defined criterion is satisfied.
 */
function evaluateCriteria(criteria: SuccessCriteria, state: CompletionState): boolean {
  if (criteria.minInterest != null && state.interest < criteria.minInterest) {
    return false;
  }
  if (criteria.minRespect != null && state.respect < criteria.minRespect) {
    return false;
  }
  if (criteria.minComfort != null && state.comfort < criteria.minComfort) {
    return false;
  }
  if (
    criteria.minConversationDepth != null &&
    state.conversationDepth < criteria.minConversationDepth
  ) {
    return false;
  }
  if (criteria.maxTension != null && state.tension > criteria.maxTension) {
    return false;
  }
  if (criteria.minTension != null && state.tension < criteria.minTension) {
    return false;
  }
  return true;
}
