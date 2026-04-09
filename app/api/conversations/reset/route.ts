import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { userId, agentId } = await req.json();

  if (!userId || !agentId) {
    return NextResponse.json({ error: "userId and agentId required" }, { status: 400 });
  }

  // Delete in correct order to respect foreign key constraints
  const conversation = await prisma.conversation.findUnique({
    where: { userId_agentId: { userId, agentId } },
  });

  if (conversation) {
    await prisma.message.deleteMany({ where: { conversationId: conversation.id } });
    await prisma.conversation.delete({ where: { id: conversation.id } });
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
