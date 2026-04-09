import { prisma } from "@/lib/prisma";
import type { User as SupabaseUser } from "@supabase/supabase-js";

/**
 * Ensures a User row exists in our DB for the authenticated Supabase user.
 * Uses upsert to handle race conditions and existing users cleanly.
 */
export async function getOrCreateUser(supabaseUser: SupabaseUser) {
  return prisma.user.upsert({
    where: { authId: supabaseUser.id },
    update: {
      email: supabaseUser.email,
    },
    create: {
      authId: supabaseUser.id,
      email: supabaseUser.email,
      displayName: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
      avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
    },
  });
}
