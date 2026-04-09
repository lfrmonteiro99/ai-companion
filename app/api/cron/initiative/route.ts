import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkInitiativeTrigger, generateInitiativeMessage, isQuietHours } from "@/lib/services/initiative";
import { getAgent } from "@/lib/agents";

/**
 * Cron endpoint — checks all active user-agent pairs and sends initiative messages.
 * Configure in vercel.json: { "crons": [{ "path": "/api/cron/initiative", "schedule": "0 * * * *" }] }
 *
 * Protected by CRON_SECRET to prevent unauthorized access.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sends this automatically for cron jobs)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: string[] = [];

  // Find all relationship states where initiative might be appropriate
  const states = await prisma.relationshipState.findMany({
    where: { stage: { gte: 1 } },
    include: { user: true },
  });

  for (const state of states) {
    try {
      // Skip users who disabled initiative
      if (!state.user.enableInitiative) continue;

      // Skip quiet hours
      if (isQuietHours(state.user.quietHoursStart, state.user.quietHoursEnd)) continue;

      // Check if already sent initiative today
      const recentNotification = await prisma.notification.findFirst({
        where: {
          userId: state.userId,
          agentId: state.agentId,
          type: "initiative_message",
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });
      if (recentNotification) continue;

      const agent = getAgent(state.agentId);
      if (!agent) continue;

      const hoursSince = (Date.now() - state.lastInteractionAt.getTime()) / (1000 * 60 * 60);
      const trigger = checkInitiativeTrigger(hoursSince, state.stage, state.attachment, agent.archetype);

      if (trigger) {
        await generateInitiativeMessage(state.userId, state.agentId, trigger.type);
        results.push(`${agent.name} → ${state.userId.slice(0, 8)}: ${trigger.type} (${trigger.reason})`);
      }
    } catch (err) {
      results.push(`Error for ${state.agentId}/${state.userId.slice(0, 8)}: ${String(err)}`);
    }
  }

  return NextResponse.json({ processed: states.length, initiated: results.length, results });
}
