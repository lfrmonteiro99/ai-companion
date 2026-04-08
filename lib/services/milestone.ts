import { prisma } from "@/lib/prisma";

const STAGE_NARRATIVES: Record<number, string> = {
  1: "She seems more curious about you now.",
  2: "She is clearly engaged — your conversations have depth.",
  3: "She is invested in you. This feels real.",
  4: "Something deeper has unlocked between you two.",
};

const MILESTONE_DEFINITIONS: { type: string; check: (state: StateSnapshot) => boolean; label: string }[] = [
  { type: "first_high_trust", check: (s) => s.trust >= 60, label: "She is starting to trust you." },
  { type: "first_high_comfort", check: (s) => s.comfort >= 60, label: "She feels comfortable with you." },
  { type: "first_high_tension", check: (s) => s.tension >= 70, label: "There is real tension between you." },
  { type: "first_high_respect", check: (s) => s.respect >= 70, label: "She clearly respects you." },
  { type: "first_attachment", check: (s) => s.attachment >= 50, label: "She is becoming attached." },
  { type: "first_deep_conversation", check: (s) => s.conversationDepth >= 60, label: "Your conversations go deep." },
  { type: "first_openness", check: (s) => s.emotionalOpenness >= 50, label: "She is opening up to you." },
];

interface StateSnapshot {
  trust: number;
  comfort: number;
  tension: number;
  respect: number;
  attachment: number;
  conversationDepth: number;
  emotionalOpenness: number;
  stage: number;
}

export interface MilestoneEvent {
  type: string;
  label: string;
}

/**
 * Check for new milestones after state update.
 * Returns list of newly achieved milestones (empty if none or user has milestones disabled).
 */
export async function checkMilestones(
  userId: string,
  agentId: string,
  previousStage: number,
): Promise<MilestoneEvent[]> {
  // Check if user wants milestone notifications
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.showMilestones) return [];

  const state = await prisma.relationshipState.findUnique({
    where: { userId_agentId: { userId, agentId } },
  });
  if (!state) return [];

  const newMilestones: MilestoneEvent[] = [];

  // Check stage advancement
  if (state.stage > previousStage && STAGE_NARRATIVES[state.stage]) {
    const type = `stage_${state.stage}`;
    const existing = await prisma.milestone.findFirst({ where: { userId, agentId, type } });
    if (!existing) {
      await prisma.milestone.create({
        data: { userId, agentId, type, label: STAGE_NARRATIVES[state.stage] },
      });
      newMilestones.push({ type, label: STAGE_NARRATIVES[state.stage] });
    }
  }

  // Check dimension milestones
  for (const def of MILESTONE_DEFINITIONS) {
    if (def.check(state)) {
      const existing = await prisma.milestone.findFirst({ where: { userId, agentId, type: def.type } });
      if (!existing) {
        await prisma.milestone.create({
          data: { userId, agentId, type: def.type, label: def.label },
        });
        newMilestones.push({ type: def.type, label: def.label });
      }
    }
  }

  return newMilestones;
}
