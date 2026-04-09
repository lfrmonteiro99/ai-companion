import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/services/auth";
import { getOrCreateProgress } from "@/lib/services/progression";
import { getSkillScores } from "@/lib/services/evaluation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await getOrCreateUser(authUser);

    const [progress, skills] = await Promise.all([
      getOrCreateProgress(user.id),
      getSkillScores(user.id),
    ]);

    return NextResponse.json({ progress, skills });
  } catch (error) {
    console.error("[api/progress] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
