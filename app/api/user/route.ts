import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { config } from "@/lib/config";
import { logger } from "@/lib/utils/logger";

const log = logger("api/user");

export async function DELETE(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  // Verify the request is from the authenticated user
  const supabase = createServerSupabaseClient();
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

  // 3. Delete scenario attempts and progress data
  await Promise.all([
    prisma.scenarioAttempt.deleteMany({ where: { userId } }),
    prisma.microExerciseAttempt.deleteMany({ where: { userId } }),
    prisma.userSkillScore.deleteMany({ where: { userId } }),
    prisma.userProgress.deleteMany({ where: { userId } }),
  ]);

  // 4. Delete user record
  await prisma.user.delete({ where: { id: userId } });

  // 5. Delete Supabase auth user (requires service_role key)
  if (config.supabaseServiceRoleKey) {
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        config.supabaseServiceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } },
      );
      const { error } = await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      if (error) {
        log.error("Failed to delete Supabase auth user", error, { userId, authId: authUser.id });
      }
    } catch (err) {
      log.error("Supabase admin deletion threw", err, { userId, authId: authUser.id });
    }
  } else {
    log.warn("SUPABASE_SERVICE_ROLE_KEY not set — auth user not deleted", { userId, authId: authUser.id });
  }

  return NextResponse.json({ success: true });
}
