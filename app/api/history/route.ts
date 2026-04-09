import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/services/auth";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await getOrCreateUser(authUser);

    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId");
    const mode = searchParams.get("mode");
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20", 10),
      100
    );

    // Build where clause
    const where: Record<string, unknown> = { userId: user.id };
    if (agentId) where.agentId = agentId;
    if (mode) where.mode = mode;

    // Fetch conversations with related data
    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: {
        agent: {
          select: { name: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
        scenario: {
          select: { title: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    // For scenario conversations, load the best attempt score
    const scenarioConversationIds = conversations
      .filter((c) => c.mode === "scenario")
      .map((c) => c.id);

    const attempts =
      scenarioConversationIds.length > 0
        ? await prisma.scenarioAttempt.findMany({
            where: {
              conversationId: { in: scenarioConversationIds },
              userId: user.id,
            },
            select: {
              conversationId: true,
              score: true,
              status: true,
            },
          })
        : [];

    // Build a map of conversationId -> best attempt score
    const attemptScoreMap = new Map<string, number | null>();
    for (const attempt of attempts) {
      if (attempt.status === "completed" && attempt.score) {
        const scoreObj = attempt.score as Record<string, unknown>;
        const overallScore =
          typeof scoreObj.overallScore === "number"
            ? scoreObj.overallScore
            : null;
        const existing = attemptScoreMap.get(attempt.conversationId);
        if (
          overallScore !== null &&
          (existing === null || existing === undefined || overallScore > existing)
        ) {
          attemptScoreMap.set(attempt.conversationId, overallScore);
        }
      }
    }

    const history = conversations.map((c) => ({
      id: c.id,
      agentId: c.agentId,
      agentName: c.agent.name,
      mode: c.mode,
      messageCount: c._count.messages,
      lastMessageAt: c.messages[0]?.createdAt?.toISOString() ?? null,
      updatedAt: c.updatedAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
      scenarioTitle: c.scenario?.title ?? null,
      scenarioScore: attemptScoreMap.get(c.id) ?? null,
    }));

    return NextResponse.json(history);
  } catch (error) {
    console.error("[api/history] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
