import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/services/auth";
import { prisma } from "@/lib/prisma";
import { getAgent } from "@/lib/agents";
import { generateSessionFeedback, saveFeedback } from "@/lib/services/feedback";
import type { SessionFeedback, SkillScores, SuccessCriteria } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { conversationId: string } },
) {
  try {
    // ---- Auth ----
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(authUser);
    const { conversationId } = params;

    // ---- Load conversation & verify ownership ----
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversa nao encontrada" },
        { status: 404 },
      );
    }

    if (conversation.userId !== dbUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ---- Check for existing feedback on a ScenarioAttempt ----
    const existingAttempt = await prisma.scenarioAttempt.findFirst({
      where: { conversationId, userId: dbUser.id },
      orderBy: { createdAt: "desc" },
    });

    if (existingAttempt?.feedback) {
      const cachedFeedback =
        existingAttempt.feedback as unknown as SessionFeedback;
      return NextResponse.json({
        ...cachedFeedback,
        feedback: cachedFeedback,
        cached: true,
      });
    }

    // ---- Build inputs for feedback generation ----
    const agent = getAgent(conversation.agentId);
    if (!agent) {
      return NextResponse.json(
        { error: "Agente nao encontrado" },
        { status: 404 },
      );
    }

    const messages = conversation.messages.map((m) => ({
      role: m.senderRole,
      content: m.content,
    }));

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "Conversa sem mensagens" },
        { status: 400 },
      );
    }

    // Scenario context (if applicable)
    let scenarioCtx:
      | { objective: string; successCriteria: SuccessCriteria }
      | undefined;

    if (conversation.scenarioId) {
      const scenario = await prisma.scenario.findUnique({
        where: { id: conversation.scenarioId },
      });
      if (scenario) {
        scenarioCtx = {
          objective: scenario.objective,
          successCriteria: scenario.successCriteria as SuccessCriteria,
        };
      }
    }

    // Previous skill scores for comparison
    let previousSkills: SkillScores | undefined;
    const userSkill = await prisma.userSkillScore.findUnique({
      where: { userId: dbUser.id },
    });

    if (userSkill && userSkill.totalSessions > 0) {
      previousSkills = {
        confidence: userSkill.confidence,
        warmth: userSkill.warmth,
        curiosity: userSkill.curiosity,
        calibration: userSkill.calibration,
        authenticity: userSkill.authenticity,
        pressureLevel: userSkill.pressureLevel,
        awkwardness: userSkill.awkwardness,
        emotionalIntelligence: userSkill.emotionalIntelligence,
        boundaryRespect: userSkill.boundaryRespect,
        conversationalMomentum: userSkill.conversationalMomentum,
      };
    }

    // ---- Generate feedback ----
    const feedback = await generateSessionFeedback(
      messages,
      agent,
      scenarioCtx,
      previousSkills,
    );

    // ---- Persist if there is a ScenarioAttempt ----
    if (existingAttempt) {
      await saveFeedback(existingAttempt.id, feedback);
    }

    return NextResponse.json({
      ...feedback,
      feedback,
      cached: false,
    });
  } catch (error) {
    console.error("[api/feedback] Error:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar feedback" },
      { status: 500 },
    );
  }
}
