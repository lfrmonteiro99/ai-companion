import { prisma } from "@/lib/prisma";
import { AgentConfig } from "@/lib/types";

const STAGE_THRESHOLDS = [0, 35, 50, 65, 80]; // minimum weighted score for each stage

export async function checkStageProgression(userId: string, agentId: string, agent: AgentConfig): Promise<number | null> {
  const state = await prisma.relationshipState.findUnique({
    where: { userId_agentId: { userId, agentId } },
  });
  if (!state) return null;

  const weights = agent.stageAdvancementWeights;
  const weightedScore =
    state.interest * weights.interest +
    state.trust * weights.trust +
    state.comfort * weights.comfort +
    state.tension * weights.tension +
    state.respect * weights.respect +
    state.attachment * weights.attachment +
    state.emotionalOpenness * weights.emotionalOpenness +
    state.dynamicAlignment * weights.dynamicAlignment +
    state.conversationDepth * weights.conversationDepth;

  // Determine what stage the score qualifies for
  let newStage = 0;
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (weightedScore >= STAGE_THRESHOLDS[i]) {
      newStage = i;
      break;
    }
  }

  // Only advance by 1 at a time
  const targetStage = Math.min(state.stage + 1, newStage);

  if (targetStage > state.stage) {
    await prisma.relationshipState.update({
      where: { userId_agentId: { userId, agentId } },
      data: { stage: targetStage },
    });
    return targetStage;
  }

  return null;
}
