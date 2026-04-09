import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { userId, agentId } = await req.json();

  if (!userId || !agentId) {
    return NextResponse.json({ error: "userId and agentId required" }, { status: 400 });
  }

  // Delete ALL conversations for this user-agent pair (practice + scenario)
  const conversations = await prisma.conversation.findMany({
    where: { userId, agentId },
    select: { id: true },
  });

  if (conversations.length > 0) {
    const convIds = conversations.map((c) => c.id);
    await prisma.message.deleteMany({ where: { conversationId: { in: convIds } } });
    await prisma.scenarioAttempt.deleteMany({ where: { conversationId: { in: convIds } } });
    await prisma.conversation.deleteMany({ where: { id: { in: convIds } } });
  }

  // Delete relationship state, memories, milestones, notifications
  await Promise.all([
    prisma.relationshipState.deleteMany({ where: { userId, agentId } }),
    prisma.memory.deleteMany({ where: { userId, agentId } }),
    prisma.milestone.deleteMany({ where: { userId, agentId } }),
    prisma.notification.deleteMany({ where: { userId, agentId } }),
  ]);

  return NextResponse.json({ success: true });
}
