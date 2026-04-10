import { prisma } from "@/lib/prisma";
import { getAllAgents } from "@/lib/agents";
import { getProfileTier } from "@/lib/utils/profile-tier";
import type { ConversationMode } from "@/lib/types";

type PlanActionType = "continue" | "skill" | "review";

export interface DashboardAction {
  id: string;
  title: string;
  description: string;
  href: string;
  type: PlanActionType;
}

export interface DashboardViewModel {
  continueTraining: {
    available: boolean;
    title: string;
    subtitle: string;
    href: string;
    mode: ConversationMode;
    updatedAt: string | null;
  };
  progressSnapshot: {
    level: number;
    tierLabel: string;
    xp: number;
    xpInCurrentLevel: number;
    xpSpan: number;
    xpPercent: number;
    streakDays: number;
    overallScore: number | null;
    totalSessions: number;
    scenariosCompleted: number;
  };
  todayPlan: DashboardAction[];
  skillFocus: {
    key: string | null;
    label: string;
    score: number | null;
    recommendation: string;
    href: string;
  };
  recentSessions: Array<{
    conversationId: string;
    agentId: string;
    agentName: string;
    mode: string;
    updatedAt: string;
    scenarioTitle: string | null;
    adjustedScore: number | null;
    rawScore: number | null;
    hintsUsed: number;
    directHintUses: number;
    hintPenaltyScore: number;
    hintPenaltyXp: number;
  }>;
  insights: string[];
  switchCharacter: Array<{
    agentId: string;
    name: string;
    unreadCount: number;
    stage: number | null;
    href: string;
  }>;
}

const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5500, 7500, 10000,
];

const SKILL_LABELS: Record<string, string> = {
  confidence: "Confidence",
  warmth: "Warmth",
  curiosity: "Curiosity",
  calibration: "Calibration",
  authenticity: "Authenticity",
  pressureLevel: "Pressure Control",
  awkwardness: "Social Smoothness",
  emotionalIntelligence: "Emotional Intelligence",
  boundaryRespect: "Boundary Respect",
  conversationalMomentum: "Conversation Momentum",
};

const INVERSE_SKILLS = new Set(["pressureLevel", "awkwardness"]);

function effectiveSkillValue(key: string, value: number): number {
  return INVERSE_SKILLS.has(key) ? 100 - value : value;
}

function parseMetaCount(meta: unknown, key: string): number {
  if (!meta || typeof meta !== "object") return 0;
  const value = (meta as Record<string, unknown>)[key];
  return typeof value === "number" ? value : 0;
}

function parseFeedbackNumber(feedback: unknown, key: string): number {
  if (!feedback || typeof feedback !== "object") return 0;
  const value = (feedback as Record<string, unknown>)[key];
  return typeof value === "number" ? value : 0;
}

function scoreFromAttempt(attempt: {
  adjustedOverallScore: number | null;
  rawOverallScore: number | null;
  score: unknown;
}) {
  const scoreObj =
    attempt.score && typeof attempt.score === "object"
      ? (attempt.score as Record<string, unknown>)
      : null;
  const fallbackOverall =
    scoreObj && typeof scoreObj.overallScore === "number"
      ? scoreObj.overallScore
      : null;

  return {
    adjustedScore:
      typeof attempt.adjustedOverallScore === "number"
        ? attempt.adjustedOverallScore
        : fallbackOverall,
    rawScore:
      typeof attempt.rawOverallScore === "number"
        ? attempt.rawOverallScore
        : fallbackOverall,
  };
}

export async function getDashboardViewModel(userId: string): Promise<DashboardViewModel> {
  const [progress, skillScore, conversations, states, unreadNotifications] =
    await Promise.all([
      prisma.userProgress.findUnique({ where: { userId } }),
      prisma.userSkillScore.findUnique({ where: { userId } }),
      prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 8,
        include: {
          agent: { select: { name: true } },
          scenario: { select: { title: true } },
        },
      }),
      prisma.relationshipState.findMany({
        where: { userId },
        select: { agentId: true, stage: true },
      }),
      prisma.notification.groupBy({
        by: ["agentId"],
        where: { userId, read: false },
        _count: { id: true },
      }),
    ]);

  const stageMap = new Map(states.map((item) => [item.agentId, item.stage]));
  const unreadMap = new Map(unreadNotifications.map((item) => [item.agentId, item._count.id]));
  const conversationIds = conversations.map((c) => c.id);

  const attempts = conversationIds.length
    ? await prisma.scenarioAttempt.findMany({
        where: {
          userId,
          conversationId: { in: conversationIds },
          status: "completed",
        },
        orderBy: { completedAt: "desc" },
        select: {
          conversationId: true,
          hintsUsed: true,
          hintPenaltyScore: true,
          hintPenaltyXp: true,
          adjustedOverallScore: true,
          rawOverallScore: true,
          score: true,
          feedback: true,
          completedAt: true,
        },
      })
    : [];

  const attemptByConversation = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts) {
    if (!attemptByConversation.has(attempt.conversationId)) {
      attemptByConversation.set(attempt.conversationId, attempt);
    }
  }

  const mostRecentConversation = conversations[0] ?? null;
  const continueHref = mostRecentConversation
    ? `/chat/${mostRecentConversation.agentId}`
    : "/scenarios";

  const currentLevel = progress?.level ?? 1;
  const currentLevelFloor = LEVEL_THRESHOLDS[Math.max(0, currentLevel - 1)] ?? 0;
  const nextLevelTarget = LEVEL_THRESHOLDS[currentLevel] ?? (progress?.xpToNextLevel ?? 100);
  const xp = progress?.xp ?? 0;
  const xpInCurrentLevel = Math.max(0, xp - currentLevelFloor);
  const xpSpan = Math.max(1, nextLevelTarget - currentLevelFloor);
  const xpPercent = Math.min(100, Math.round((xpInCurrentLevel / xpSpan) * 100));
  const tier = getProfileTier(currentLevel);

  let weakestSkillKey: string | null = null;
  let weakestSkillValue = Number.POSITIVE_INFINITY;
  if (skillScore) {
    for (const key of Object.keys(SKILL_LABELS)) {
      const raw = (skillScore as Record<string, unknown>)[key];
      if (typeof raw !== "number") continue;
      const effective = effectiveSkillValue(key, raw);
      if (effective < weakestSkillValue) {
        weakestSkillValue = effective;
        weakestSkillKey = key;
      }
    }
  }

  const recentSessions = conversations.map((conversation) => {
    const attempt = attemptByConversation.get(conversation.id);
    const score = attempt
      ? scoreFromAttempt({
          adjustedOverallScore: attempt.adjustedOverallScore,
          rawOverallScore: attempt.rawOverallScore,
          score: attempt.score,
        })
      : { adjustedScore: null, rawScore: null };

    const directHintUses = parseMetaCount(conversation.sessionMeta, "directHintUses");
    const feedbackPenaltyScore = parseFeedbackNumber(attempt?.feedback, "directHintPenaltyScore");
    const feedbackPenaltyXp = parseFeedbackNumber(attempt?.feedback, "directHintPenaltyXp");

    return {
      conversationId: conversation.id,
      agentId: conversation.agentId,
      agentName: conversation.agent.name,
      mode: conversation.mode,
      updatedAt: conversation.updatedAt.toISOString(),
      scenarioTitle: conversation.scenario?.title ?? null,
      adjustedScore: score.adjustedScore,
      rawScore: score.rawScore,
      hintsUsed: attempt?.hintsUsed ?? parseMetaCount(conversation.sessionMeta, "hintsUsed"),
      directHintUses,
      hintPenaltyScore: (attempt?.hintPenaltyScore ?? 0) + feedbackPenaltyScore,
      hintPenaltyXp: (attempt?.hintPenaltyXp ?? 0) + feedbackPenaltyXp,
    };
  });

  const todayPlan: DashboardAction[] = [
    {
      id: "continue-latest",
      type: "continue",
      title: mostRecentConversation ? "Continue your latest session" : "Start your first training session",
      description: mostRecentConversation
        ? `Pick up with ${mostRecentConversation.agent.name} and keep your momentum.`
        : "Jump into a scenario and establish your baseline score.",
      href: continueHref,
    },
    {
      id: "skill-focus",
      type: "skill",
      title: weakestSkillKey ? `Train ${SKILL_LABELS[weakestSkillKey]}` : "Build core communication skills",
      description: weakestSkillKey
        ? "Focus your weakest effective skill to maximize next-session gains."
        : "Complete one guided scenario to unlock a personalized skill focus.",
      href: "/scenarios",
    },
    {
      id: "review-last",
      type: "review",
      title: recentSessions[0] ? "Review your latest conversation" : "Review examples and feedback",
      description: recentSessions[0]
        ? "Use replay and analysis to identify one concrete improvement."
        : "After your first session, use replay to build better habits quickly.",
      href: recentSessions[0]
        ? `/replay/${recentSessions[0].conversationId}`
        : "/history",
    },
  ];

  const latestScored = recentSessions.find((item) => item.adjustedScore !== null) ?? null;
  const previousScored =
    recentSessions.filter((item) => item.adjustedScore !== null)[1] ?? null;

  const insights: string[] = [];
  if (latestScored?.adjustedScore !== null && previousScored?.adjustedScore !== null) {
    const delta = latestScored.adjustedScore - previousScored.adjustedScore;
    if (delta >= 3) {
      insights.push(`Adjusted score improved by ${delta.toFixed(1)} in your latest session.`);
    } else if (delta <= -3) {
      insights.push(`Adjusted score dropped by ${Math.abs(delta).toFixed(1)}. Revisit your last replay.`);
    } else {
      insights.push("Adjusted score is stable. Keep training consistency this week.");
    }
  }
  if ((progress?.streakDays ?? 0) > 0) {
    insights.push(`Current streak: ${progress?.streakDays ?? 0} day(s).`);
  }
  if (latestScored && latestScored.hintsUsed > 0) {
    insights.push(
      `Latest session used ${latestScored.hintsUsed} hint(s), with ${latestScored.directHintUses} direct use(s).`,
    );
  }
  if (insights.length === 0) {
    insights.push("Complete your first session to unlock personalized performance insights.");
  }

  const switchCharacter = getAllAgents().map((agent) => ({
    agentId: agent.id,
    name: agent.name,
    unreadCount: unreadMap.get(agent.id) ?? 0,
    stage: stageMap.get(agent.id) ?? null,
    href: `/chat/${agent.id}`,
  }));

  return {
    continueTraining: {
      available: Boolean(mostRecentConversation),
      title: mostRecentConversation ? "Continue Training" : "Start Training",
      subtitle: mostRecentConversation
        ? `${mostRecentConversation.agent.name} • ${mostRecentConversation.mode}`
        : "No previous session found yet.",
      href: continueHref,
      mode: (mostRecentConversation?.mode as ConversationMode) ?? "practice",
      updatedAt: mostRecentConversation?.updatedAt.toISOString() ?? null,
    },
    progressSnapshot: {
      level: currentLevel,
      tierLabel: tier.label,
      xp,
      xpInCurrentLevel,
      xpSpan,
      xpPercent,
      streakDays: progress?.streakDays ?? 0,
      overallScore: skillScore?.overallScore ?? null,
      totalSessions: progress?.totalSessions ?? 0,
      scenariosCompleted: progress?.scenariosCompleted ?? 0,
    },
    todayPlan,
    skillFocus: {
      key: weakestSkillKey,
      label: weakestSkillKey ? SKILL_LABELS[weakestSkillKey] : "No focus yet",
      score: weakestSkillKey ? Math.round(weakestSkillValue) : null,
      recommendation: weakestSkillKey
        ? "Run a focused scenario and avoid relying on direct hint copy."
        : "Start one session to generate your first personalized weak-skill recommendation.",
      href: "/scenarios",
    },
    recentSessions,
    insights,
    switchCharacter,
  };
}
