import { prisma } from "@/lib/prisma";
import { MICRO_EXERCISE_SEEDS } from "@/lib/data/micro-exercises";
import { computeFinalScoreAndXp } from "@/lib/services/scoring";
import { awardXP } from "@/lib/services/progression";

type MicroExerciseRecord = {
  id: string;
  slug: string;
  type: string;
  title: string;
  prompt: string;
  difficulty: string;
  targetSkill: string;
  options: unknown;
  explanation: string | null;
};

function normalizeText(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function evaluateMcq(answerKey: Record<string, unknown>, userAnswer: Record<string, unknown>) {
  const expected = typeof answerKey.correctOptionId === "string" ? answerKey.correctOptionId : "";
  const got = typeof userAnswer.optionId === "string" ? userAnswer.optionId : "";
  const isCorrect = expected !== "" && got === expected;
  return { isCorrect, rawScore: isCorrect ? 100 : 35 };
}

function evaluateRewrite(answerKey: Record<string, unknown>, userAnswer: Record<string, unknown>) {
  const rawText = typeof userAnswer.text === "string" ? userAnswer.text : "";
  const text = normalizeText(rawText);
  const tokens = new Set(text.split(" ").filter(Boolean));

  const positiveTokens = Array.isArray(answerKey.positiveTokens)
    ? (answerKey.positiveTokens.filter((t): t is string => typeof t === "string").map(normalizeText))
    : [];
  const avoidTokens = Array.isArray(answerKey.avoidTokens)
    ? (answerKey.avoidTokens.filter((t): t is string => typeof t === "string").map(normalizeText))
    : [];
  const minTokens = typeof answerKey.minTokens === "number" ? answerKey.minTokens : 6;

  const positiveHits = positiveTokens.filter((token) => tokens.has(token)).length;
  const avoidHits = avoidTokens.filter((token) => tokens.has(token)).length;
  const tokenCount = text.split(" ").filter(Boolean).length;

  let rawScore = 50;
  if (tokenCount >= minTokens) rawScore += 15;
  rawScore += positiveHits * 12;
  rawScore -= avoidHits * 14;
  rawScore = Math.max(0, Math.min(100, rawScore));

  return { isCorrect: rawScore >= 70, rawScore };
}

function rawXpForDifficulty(difficulty: string): number {
  if (difficulty === "hard") return 12;
  if (difficulty === "normal") return 9;
  return 6;
}

async function ensureSeededExercises() {
  const count = await prisma.microExercise.count();
  if (count > 0) return;

  for (const exercise of MICRO_EXERCISE_SEEDS) {
    await prisma.microExercise.upsert({
      where: { slug: exercise.slug },
      update: {},
      create: {
        slug: exercise.slug,
        type: exercise.type,
        title: exercise.title,
        prompt: exercise.prompt,
        difficulty: exercise.difficulty,
        targetSkill: exercise.targetSkill,
        options: exercise.options ? JSON.parse(JSON.stringify(exercise.options)) : undefined,
        answerKey: JSON.parse(JSON.stringify(exercise.answerKey)),
        explanation: exercise.explanation,
        tags: exercise.tags,
        order: exercise.order,
        isActive: true,
      },
    });
  }
}

export async function getNextMicroExercise(userId: string): Promise<MicroExerciseRecord | null> {
  await ensureSeededExercises();

  const exercises = await prisma.microExercise.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      type: true,
      title: true,
      prompt: true,
      difficulty: true,
      targetSkill: true,
      options: true,
      explanation: true,
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  if (!exercises.length) return null;

  const stats = await prisma.microExerciseAttempt.groupBy({
    by: ["exerciseId"],
    where: { userId },
    _count: { id: true },
  });
  const countMap = new Map(stats.map((item) => [item.exerciseId, item._count.id]));

  exercises.sort((a, b) => (countMap.get(a.id) ?? 0) - (countMap.get(b.id) ?? 0));
  return exercises[0] ?? null;
}

export async function submitMicroExercise(params: {
  userId: string;
  exerciseId: string;
  answer: Record<string, unknown>;
  hintsUsed?: number;
  directHintUses?: number;
}) {
  const exercise = await prisma.microExercise.findUnique({
    where: { id: params.exerciseId },
  });
  if (!exercise) {
    throw new Error("Exercise not found");
  }

  const answerKey =
    exercise.answerKey && typeof exercise.answerKey === "object"
      ? (exercise.answerKey as Record<string, unknown>)
      : {};
  const evaluator =
    exercise.type === "rewrite_message" ? evaluateRewrite : evaluateMcq;
  const evaluation = evaluator(answerKey, params.answer);

  const userProgress = await prisma.userProgress.findUnique({
    where: { userId: params.userId },
    select: { level: true },
  });
  const level = userProgress?.level ?? 1;
  const hintsUsed = Math.max(0, params.hintsUsed ?? 0);
  const directHintUses = Math.max(0, params.directHintUses ?? 0);
  const rawXp = rawXpForDifficulty(exercise.difficulty);

  const final = computeFinalScoreAndXp({
    rawScore: evaluation.rawScore,
    rawXp,
    level,
    hintsUsed,
    directHintUses,
    mode: "micro",
  });

  const noHintBonus = hintsUsed === 0 ? 2 : 0;
  const firstTodayBonus = await hasAttemptToday(params.userId) ? 0 : 3;
  const totalXp = final.adjustedXp + noHintBonus + firstTodayBonus;

  const attempt = await prisma.microExerciseAttempt.create({
    data: {
      userId: params.userId,
      exerciseId: exercise.id,
      status: "completed",
      userAnswer: JSON.parse(JSON.stringify(params.answer)),
      isCorrect: evaluation.isCorrect,
      rawScore: final.rawScore,
      adjustedScore: final.adjustedScore,
      rawXp: final.rawXp,
      xpEarned: totalXp,
      hintsUsed,
      directHintUses,
      hintPenaltyScore: final.breakdown.totalScorePenalty,
      hintPenaltyXp: final.breakdown.totalXpPenalty,
      metadata: {
        noHintBonus,
        firstTodayBonus,
      },
      completedAt: new Date(),
    },
  });

  await awardXP(params.userId, totalXp, "micro_exercise");

  return {
    attemptId: attempt.id,
    exercise: {
      id: exercise.id,
      type: exercise.type,
      title: exercise.title,
      explanation: exercise.explanation,
    },
    result: {
      isCorrect: evaluation.isCorrect,
      rawScore: final.rawScore,
      adjustedScore: final.adjustedScore,
      rawXp: final.rawXp,
      adjustedXp: final.adjustedXp,
      finalXpAwarded: totalXp,
      bonuses: { noHintBonus, firstTodayBonus },
      penalties: {
        hintsUsed,
        directHintUses,
        scorePenalty: final.breakdown.totalScorePenalty,
        xpPenalty: final.breakdown.totalXpPenalty,
      },
    },
  };
}

async function hasAttemptToday(userId: string): Promise<boolean> {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const count = await prisma.microExerciseAttempt.count({
    where: {
      userId,
      createdAt: { gte: dayStart },
    },
  });
  return count > 0;
}
