import { prisma } from "@/lib/prisma";

const STAGE_NARRATIVES: Record<number, string> = {
  1: "Ela parece mais curiosa sobre ti agora.",
  2: "Ela está claramente envolvida — as vossas conversas têm profundidade.",
  3: "Ela está investida em ti. Isto parece real.",
  4: "Algo mais profundo desbloqueou entre vocês.",
};

const MILESTONE_DEFINITIONS: { type: string; check: (state: StateSnapshot) => boolean; label: string }[] = [
  // First tier — achievable in 8-12 good messages
  { type: "first_interest", check: (s) => s.trust >= 35 && s.comfort >= 30, label: "Ela parece genuinamente interessada." },
  { type: "first_high_trust", check: (s) => s.trust >= 50, label: "Ela está a começar a confiar em ti." },
  { type: "first_high_comfort", check: (s) => s.comfort >= 50, label: "Ela sente-se confortável contigo." },
  // Second tier — requires sustained quality
  { type: "first_high_tension", check: (s) => s.tension >= 55, label: "Há tensão real entre vocês." },
  { type: "first_high_respect", check: (s) => s.respect >= 60, label: "Ela respeita-te claramente." },
  { type: "first_attachment", check: (s) => s.attachment >= 40, label: "Ela está a criar ligação." },
  { type: "first_deep_conversation", check: (s) => s.conversationDepth >= 45, label: "As vossas conversas são profundas." },
  { type: "first_openness", check: (s) => s.emotionalOpenness >= 40, label: "Ela está a abrir-se contigo." },
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
