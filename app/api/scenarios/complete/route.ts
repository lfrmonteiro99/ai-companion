import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/services/auth";
import { checkCompletion, completeScenario } from "@/lib/services/scenario";
import { evaluateSession, updateGlobalSkillScores } from "@/lib/services/evaluation";
import { generateSessionFeedback, saveFeedback } from "@/lib/services/feedback";
import {
  awardXP,
  recordSession,
  updateStreak,
  checkAchievements,
  XP_REWARDS,
} from "@/lib/services/progression";
import { getAgent } from "@/lib/agents";
import type { SuccessCriteria } from "@/lib/types";

const completeSchema = z.object({
  attemptId: z.string(),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await getOrCreateUser(authUser);

    const body = await req.json();
    const { attemptId } = completeSchema.parse(body);

    // Load the attempt with scenario data
    const attempt = await prisma.scenarioAttempt.findUnique({
      where: { id: attemptId },
      include: { scenario: true },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (attempt.status !== "in_progress") {
      return NextResponse.json(
        { error: "Attempt is not in progress" },
        { status: 400 }
      );
    }

    // Load conversation messages
    const messages = await prisma.message.findMany({
      where: { conversationId: attempt.conversationId },
      orderBy: { createdAt: "asc" },
      select: { senderRole: true, content: true },
    });

    const formattedMessages = messages.map((m) => ({
      role: m.senderRole,
      content: m.content,
    }));

    // Load agent config
    const agentConfig = getAgent(attempt.agentId);
    if (!agentConfig) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Load relationship state for completion check
    const relationship = await prisma.relationshipState.findUnique({
      where: {
        userId_agentId: {
          userId: user.id,
          agentId: attempt.agentId,
        },
      },
    });

    const completionState = {
      interest: relationship?.interest ?? 30,
      trust: relationship?.trust ?? 20,
      comfort: relationship?.comfort ?? 20,
      tension: relationship?.tension ?? 30,
      respect: relationship?.respect ?? 30,
      conversationDepth: relationship?.conversationDepth ?? 10,
    };

    // Check completion
    const completionResult = await checkCompletion(
      attemptId,
      completionState,
      messages.length
    );

    // Evaluate the session
    const scenario = attempt.scenario;
    const scenarioContext = {
      objective: scenario.objective,
      successCriteria: scenario.successCriteria as SuccessCriteria,
    };

    const sessionScores = await evaluateSession(
      formattedMessages,
      agentConfig,
      scenarioContext
    );

    // Generate detailed feedback
    const feedback = await generateSessionFeedback(
      formattedMessages,
      agentConfig,
      scenarioContext
    );

    // Save feedback to the attempt
    await saveFeedback(attemptId, feedback);

    // Complete the scenario
    await completeScenario(
      attemptId,
      completionResult.success,
      feedback.skills as unknown as Record<string, unknown>,
      completionResult.success
        ? XP_REWARDS.completeScenario
        : XP_REWARDS.completePracticeSession
    );

    // Update global skill scores
    await updateGlobalSkillScores(user.id, sessionScores);

    // Award XP
    let xpAmount = completionResult.success
      ? XP_REWARDS.completeScenario
      : XP_REWARDS.completePracticeSession;

    if (feedback.overallScore >= 90) {
      xpAmount += XP_REWARDS.scoreAbove90;
    } else if (feedback.overallScore >= 70) {
      xpAmount += XP_REWARDS.scoreAbove70;
    }

    const { leveledUp, newLevel } = await awardXP(
      user.id,
      xpAmount,
      `scenario:${scenario.slug}`
    );

    // Record session and update streak
    await recordSession(user.id, "scenario", completionResult.success);
    await updateStreak(user.id);

    // Check for new achievements
    const progress = await prisma.userProgress.findUnique({
      where: { userId: user.id },
    });
    const skillScores = await prisma.userSkillScore.findUnique({
      where: { userId: user.id },
    });

    const achievements = await checkAchievements(user.id, {
      skills: skillScores
        ? {
            confidence: skillScores.confidence,
            warmth: skillScores.warmth,
            curiosity: skillScores.curiosity,
            calibration: skillScores.calibration,
            authenticity: skillScores.authenticity,
            pressureLevel: skillScores.pressureLevel,
            awkwardness: skillScores.awkwardness,
            emotionalIntelligence: skillScores.emotionalIntelligence,
            boundaryRespect: skillScores.boundaryRespect,
            conversationalMomentum: skillScores.conversationalMomentum,
          }
        : undefined,
      scenariosCompleted: progress?.scenariosCompleted ?? 0,
      totalSessions: progress?.totalSessions ?? 0,
      level: progress?.level ?? 1,
      lastScenarioCategory: scenario.category,
      lastScore: feedback.skills as unknown as Record<string, number>,
    });

    return NextResponse.json({
      feedback,
      xp: xpAmount,
      leveledUp,
      newLevel,
      achievements,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[api/scenarios/complete] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
