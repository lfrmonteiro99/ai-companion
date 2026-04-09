import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/services/auth";
import { getAvailableScenarios } from "@/lib/services/scenario";

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await getOrCreateUser(authUser);

    const scenarios = await getAvailableScenarios(user.id);

    return NextResponse.json(scenarios);
  } catch (error) {
    console.error("[api/scenarios] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
