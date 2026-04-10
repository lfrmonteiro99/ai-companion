import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/services/auth";
import { submitMicroExercise } from "@/lib/services/micro-exercises";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await getOrCreateUser(authUser);
    const body = await req.json().catch(() => ({}));

    const exerciseId =
      typeof body.exerciseId === "string" ? body.exerciseId : "";
    const answer =
      body.answer && typeof body.answer === "object"
        ? (body.answer as Record<string, unknown>)
        : {};
    const hintsUsed =
      typeof body.hintsUsed === "number" ? body.hintsUsed : undefined;
    const directHintUses =
      typeof body.directHintUses === "number" ? body.directHintUses : undefined;

    if (!exerciseId) {
      return NextResponse.json(
        { error: "exerciseId is required" },
        { status: 400 },
      );
    }

    const result = await submitMicroExercise({
      userId: user.id,
      exerciseId,
      answer,
      hintsUsed,
      directHintUses,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/micro-exercises/submit] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
