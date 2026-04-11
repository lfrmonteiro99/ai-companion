import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateContextualHint } from "@/lib/services/hint";
import { chatHintLimiter } from "@/lib/utils/rate-limit";
import type { ConversationMode } from "@/lib/types";

const hintSchema = z.object({
  userId: z.string().uuid(),
  agentId: z.string().min(1),
  mode: z.enum(["practice", "scenario", "challenge"]).default("practice"),
  scenarioId: z.string().optional(),
  attemptId: z.string().optional(),
  conversationId: z.string().optional(),
  draftMessage: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = hintSchema.parse(await req.json());

    // Rate limiting
    const rateCheck = chatHintLimiter.check(body.userId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many hint requests", retryAfterMs: rateCheck.retryAfterMs },
        { status: 429 },
      );
    }

    const result = await generateContextualHint({
      userId: body.userId,
      agentId: body.agentId,
      mode: body.mode as ConversationMode,
      scenarioId: body.scenarioId,
      attemptId: body.attemptId,
      conversationId: body.conversationId,
      draftMessage: body.draftMessage,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[api/chat/hint] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
