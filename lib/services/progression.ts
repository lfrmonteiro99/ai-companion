import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS } from "@/lib/data/achievements";
import { Achievement } from "@/lib/types";
import { UserProgress } from "@prisma/client";

// ---------------------------------------------------------------------------
// XP reward table
// ---------------------------------------------------------------------------

export const XP_REWARDS = {
  completePracticeSession: 10,
  completeScenario: 25,
  completeScenarioFirstTime: 50,
  completeChallenge: 40,
  scoreAbove70: 15,
  scoreAbove90: 30,
  improveSkill: 10,
  firstSessionOfDay: 5,
} as const;

// ---------------------------------------------------------------------------
// Level thresholds — index is level, value is cumulative XP required
// ---------------------------------------------------------------------------

const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5500, 7500, 10000,
];

function levelForXP(totalXP: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

function xpToNextLevel(level: number): number {
  const nextIdx = level; // level 1 -> threshold index 1
  if (nextIdx >= LEVEL_THRESHOLDS.length) {
    return 0; // max level reached
  }
  return LEVEL_THRESHOLDS[nextIdx];
}

// ---------------------------------------------------------------------------
// getOrCreateProgress
// ---------------------------------------------------------------------------

export async function getOrCreateProgress(
  userId: string
): Promise<UserProgress> {
  return prisma.userProgress.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

// ---------------------------------------------------------------------------
// awardXP
// ---------------------------------------------------------------------------

export async function awardXP(
  userId: string,
  amount: number,
  _source: string
): Promise<{ newXP: number; leveledUp: boolean; newLevel: number }> {
  const progress = await getOrCreateProgress(userId);

  const newXP = progress.xp + amount;
  const oldLevel = progress.level;
  const newLevel = levelForXP(newXP);
  const leveledUp = newLevel > oldLevel;
  const nextLevelXP = xpToNextLevel(newLevel);

  await prisma.userProgress.update({
    where: { userId },
    data: {
      xp: newXP,
      level: newLevel,
      xpToNextLevel: nextLevelXP,
    },
  });

  return { newXP, leveledUp, newLevel };
}

// ---------------------------------------------------------------------------
// Achievement condition evaluator
// ---------------------------------------------------------------------------

interface AchievementContext {
  skills?: Record<string, number>;
  scenariosCompleted?: number;
  totalSessions?: number;
  level?: number;
  uniqueAgents?: number;
  uniqueAgentsScenario?: number;
  lastScenarioCategory?: string;
  lastScore?: Record<string, number>;
}

/**
 * Evaluates a simple condition string against a context object.
 *
 * Supported conditions:
 *   "field >= N"
 *   "field <= N"
 *   "field == value"
 *   "condA && condB"  (AND-chained)
 *
 * Dotted paths like "skills.confidence" are resolved from the context.
 */
function resolveValue(
  path: string,
  ctx: AchievementContext
): string | number | undefined {
  const parts = path.split(".");
  let current: unknown = ctx;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  if (typeof current === "number" || typeof current === "string") {
    return current;
  }
  return undefined;
}

function evaluateSingleCondition(
  expr: string,
  ctx: AchievementContext
): boolean {
  const trimmed = expr.trim();

  // Try >=
  let match = trimmed.match(/^(.+?)\s*>=\s*(.+)$/);
  if (match) {
    const left = resolveValue(match[1].trim(), ctx);
    const right = parseFloat(match[2].trim());
    return typeof left === "number" && left >= right;
  }

  // Try <=
  match = trimmed.match(/^(.+?)\s*<=\s*(.+)$/);
  if (match) {
    const left = resolveValue(match[1].trim(), ctx);
    const right = parseFloat(match[2].trim());
    return typeof left === "number" && left <= right;
  }

  // Try ==
  match = trimmed.match(/^(.+?)\s*==\s*(.+)$/);
  if (match) {
    const left = resolveValue(match[1].trim(), ctx);
    const right = match[2].trim();
    // Compare as number if possible, otherwise as string
    const rightNum = parseFloat(right);
    if (!isNaN(rightNum) && typeof left === "number") {
      return left === rightNum;
    }
    return String(left) === right;
  }

  return false;
}

function evaluateCondition(
  condition: string,
  ctx: AchievementContext
): boolean {
  const clauses = condition.split("&&");
  return clauses.every((clause) => evaluateSingleCondition(clause, ctx));
}

// ---------------------------------------------------------------------------
// checkAchievements
// ---------------------------------------------------------------------------

export async function checkAchievements(
  userId: string,
  context: AchievementContext
): Promise<Achievement[]> {
  const progress = await getOrCreateProgress(userId);
  const existingIds = new Set<string>(
    (progress.achievements as string[]) ?? []
  );

  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (existingIds.has(achievement.id)) continue;
    if (evaluateCondition(achievement.condition, context)) {
      newlyUnlocked.push(achievement);
      existingIds.add(achievement.id);
    }
  }

  if (newlyUnlocked.length > 0) {
    await prisma.userProgress.update({
      where: { userId },
      data: {
        achievements: Array.from(existingIds),
      },
    });
  }

  return newlyUnlocked;
}

// ---------------------------------------------------------------------------
// updateStreak
// ---------------------------------------------------------------------------

export async function updateStreak(userId: string): Promise<number> {
  const progress = await getOrCreateProgress(userId);

  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  let newStreak: number;

  if (!progress.lastSessionAt) {
    newStreak = 1;
  } else {
    const lastDate = new Date(progress.lastSessionAt);
    const lastDayStart = new Date(
      lastDate.getFullYear(),
      lastDate.getMonth(),
      lastDate.getDate()
    );

    const diffMs = todayStart.getTime() - lastDayStart.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Same day — keep current streak
      newStreak = progress.streakDays;
    } else if (diffDays === 1) {
      // Yesterday — extend streak
      newStreak = progress.streakDays + 1;
    } else {
      // Gap — reset
      newStreak = 1;
    }
  }

  await prisma.userProgress.update({
    where: { userId },
    data: {
      streakDays: newStreak,
      lastSessionAt: now,
    },
  });

  // Award bonus XP for streak milestones
  const STREAK_BONUSES: Record<number, number> = { 3: 15, 7: 30, 14: 50, 30: 100 };
  const bonus = STREAK_BONUSES[newStreak];
  if (bonus) {
    await awardXP(userId, bonus, `streak_milestone:${newStreak}`);
  }

  return newStreak;
}

// ---------------------------------------------------------------------------
// recordSession
// ---------------------------------------------------------------------------

export async function recordSession(
  userId: string,
  _mode: string,
  scenarioCompleted: boolean
): Promise<void> {
  const progress = await getOrCreateProgress(userId);

  await prisma.userProgress.update({
    where: { userId },
    data: {
      totalSessions: progress.totalSessions + 1,
      scenariosCompleted: scenarioCompleted
        ? progress.scenariosCompleted + 1
        : progress.scenariosCompleted,
      lastSessionAt: new Date(),
    },
  });
}
