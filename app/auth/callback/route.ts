import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // Redirect new users (no DB record yet) to onboarding
    if (data.user) {
      const existingUser = await prisma.user.findFirst({
        where: { authId: data.user.id },
        select: { id: true },
      });
      if (!existingUser) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    }
  }

  return NextResponse.redirect(origin);
}
