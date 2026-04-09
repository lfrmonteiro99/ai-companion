import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/services/auth";
import { startScenario } from "@/lib/services/scenario";

const startSchema = z.object({
  scenarioId: z.string(),
  agentId: z.string(),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await getOrCreateUser(authUser);

    const body = await req.json();
    const { scenarioId, agentId } = startSchema.parse(body);

    const result = await startScenario(user.id, scenarioId, agentId);

    return NextResponse.json({
      attempt: result.attempt,
      conversation: result.conversation,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Scenario not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("[api/scenarios/start] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
