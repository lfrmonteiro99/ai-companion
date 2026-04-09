import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/lib/services/chat";
import { z } from "zod";

const sendMessageSchema = z.object({
  userId: z.string().uuid(),
  agentId: z.string().min(1),
  message: z.string().min(1).max(2000),
  mode: z.enum(["practice", "scenario", "challenge"]).optional(),
  scenarioId: z.string().optional(),
  attemptId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, agentId, message, mode, scenarioId, attemptId } = sendMessageSchema.parse(body);

    const result = await sendMessage({ userId, agentId, message, mode, scenarioId, attemptId });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Agent not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Chat send error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
