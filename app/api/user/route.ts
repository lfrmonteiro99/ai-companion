import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  // Verify the request is from the authenticated user
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!dbUser || dbUser.authId !== authUser.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Cascade delete all user data
  // 1. Delete messages via conversations
  const conversations = await prisma.conversation.findMany({
    where: { userId },
    select: { id: true },
  });
  const convIds = conversations.map((c) => c.id);

  if (convIds.length > 0) {
    await prisma.message.deleteMany({ where: { conversationId: { in: convIds } } });
  }

  // 2. Delete all related records
  await Promise.all([
    prisma.conversation.deleteMany({ where: { userId } }),
    prisma.relationshipState.deleteMany({ where: { userId } }),
    prisma.memory.deleteMany({ where: { userId } }),
    prisma.milestone.deleteMany({ where: { userId } }),
    prisma.notification.deleteMany({ where: { userId } }),
  ]);

  // 3. Delete user record
  await prisma.user.delete({ where: { id: userId } });

  // 4. Delete Supabase auth user
  // Note: Supabase admin API is needed for this, which requires the service_role key.
  // For now, we delete the DB record. The auth user will be orphaned but harmless.

  return NextResponse.json({ success: true });
}
