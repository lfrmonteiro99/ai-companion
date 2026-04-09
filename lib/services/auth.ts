import { prisma } from "@/lib/prisma";
import type { User as SupabaseUser } from "@supabase/supabase-js";

/**
 * Ensures a User row exists in our DB for the authenticated Supabase user.
 * Creates one on first login, returns existing on subsequent calls.
 */
export async function getOrCreateUser(supabaseUser: SupabaseUser) {
  // Check by authId first
  const existing = await prisma.user.findUnique({
    where: { authId: supabaseUser.id },
  });
  if (existing) return existing;

  // Create new user linked to Supabase Auth
  return prisma.user.create({
    data: {
      authId: supabaseUser.id,
      email: supabaseUser.email,
      displayName: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
      avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
    },
  });
}
