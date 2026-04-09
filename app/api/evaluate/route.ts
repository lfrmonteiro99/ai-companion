import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/services/auth";
import { evaluateSession, updateGlobalSkillScores } from "@/lib/services/evaluation";
import { generateSessionFeedback } from "@/lib/services/feedback";
import {
  awardXP,
  recordSession,
  updateStreak,
  checkAchievements,
  XP_REWARDS,
} from "@/lib/services/progression";
import { getAgent } from "@/lib/agents";

const evaluateSchema = z.object({
  conversationId: z.string(),
  agentId: z.string(),
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
    const { conversationId, agentId } = evaluateSchema.parse(body);

    // Verify the conversation belongs to the user
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (conversation.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Load agent config
    const agentConfig = getAgent(agentId);
    if (!agentConfig) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Load messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      select: { senderRole: true, content: true },
    });

    const formattedMessages = messages.map((m) => ({
      role: m.senderRole,
      content: m.content,
    }));

    // Evaluate session
    const sessionScores = await evaluateSession(formattedMessages, agentConfig);

    // Generate detailed feedback
    const feedback = await generateSessionFeedback(
      formattedMessages,
      agentConfig
    );

    // Update global skill scores
    await updateGlobalSkillScores(user.id, sessionScores);

    // Award XP
    let xpAmount = XP_REWARDS.completePracticeSession;
    if (feedback.overallScore >= 90) {
      xpAmount += XP_REWARDS.scoreAbove90;
    } else if (feedback.overallScore >= 70) {
      xpAmount += XP_REWARDS.scoreAbove70;
    }

    const { leveledUp, newLevel } = await awardXP(
      user.id,
      xpAmount,
      `practice:${agentId}`
    );

    // Record session and update streak
    await recordSession(user.id, "practice", false);
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
      totalSessions: progress?.totalSessions ?? 0,
      level: progress?.level ?? 1,
    });

    return NextResponse.json({
      feedback,
      xp: xpAmount,
      leveledUp,
      achievements,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[api/evaluate] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
