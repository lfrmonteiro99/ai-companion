import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/services/auth";
import { getNextMicroExercise } from "@/lib/services/micro-exercises";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await getOrCreateUser(authUser);
    const exercise = await getNextMicroExercise(user.id);

    return NextResponse.json({ exercise });
  } catch (error) {
    console.error("[api/micro-exercises/next] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
