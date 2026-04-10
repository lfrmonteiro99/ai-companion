import type { ConversationMode } from "@/lib/types";

export interface HintPenaltyBreakdown {
  hintsUsed: number;
  directHintUses: number;
  level: number;
  mode: ConversationMode;
  levelMultiplier: number;
  modeMultiplier: number;
  scorePenalty: number;
  directScorePenalty: number;
  totalScorePenalty: number;
  xpPenalty: number;
  directXpPenalty: number;
  totalXpPenalty: number;
}

export interface FinalScoreAndXp {
  rawScore: number;
  adjustedScore: number;
  rawXp: number;
  adjustedXp: number;
  breakdown: HintPenaltyBreakdown;
}

const MODE_MULTIPLIER: Record<ConversationMode, number> = {
  practice: 1.0,
  scenario: 1.1,
  challenge: 1.25,
};

const MIN_XP_FLOOR: Record<ConversationMode, number> = {
  practice: 3,
  scenario: 5,
  challenge: 8,
};

const BASE_PENALTY_PER_HINT = 2;

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function computeHintPenalty(
  level: number,
  hintsUsed: number,
  directHintUses: number,
  mode: ConversationMode,
): HintPenaltyBreakdown {
  const safeLevel = Math.max(1, level);
  const safeHints = Math.max(0, hintsUsed);
  const safeDirectHintUses = Math.max(0, directHintUses);
  const levelMultiplier = 1 + Math.floor((safeLevel - 1) / 5) * 0.15;
  const modeMultiplier = MODE_MULTIPLIER[mode] ?? 1.0;
  const scorePenalty = safeHints * BASE_PENALTY_PER_HINT * levelMultiplier * modeMultiplier;
  const directScorePenalty = safeDirectHintUses * BASE_PENALTY_PER_HINT * 1.5 * levelMultiplier * modeMultiplier;
  const totalScorePenalty = scorePenalty + directScorePenalty;
  const xpPenalty = Math.round(scorePenalty * 0.8);
  const directXpPenalty = Math.round(directScorePenalty * 0.8);
  const totalXpPenalty = xpPenalty + directXpPenalty;

  return {
    hintsUsed: safeHints,
    directHintUses: safeDirectHintUses,
    level: safeLevel,
    mode,
    levelMultiplier,
    modeMultiplier,
    scorePenalty: Number(scorePenalty.toFixed(2)),
    directScorePenalty: Number(directScorePenalty.toFixed(2)),
    totalScorePenalty: Number(totalScorePenalty.toFixed(2)),
    xpPenalty,
    directXpPenalty,
    totalXpPenalty,
  };
}

export function computeFinalScoreAndXp(params: {
  rawScore: number;
  rawXp: number;
  level: number;
  hintsUsed: number;
  directHintUses: number;
  mode: ConversationMode;
}): FinalScoreAndXp {
  const breakdown = computeHintPenalty(params.level, params.hintsUsed, params.directHintUses, params.mode);
  const adjustedScore = clampScore(params.rawScore - breakdown.totalScorePenalty);
  const minFloor = MIN_XP_FLOOR[params.mode] ?? 1;
  const adjustedXp = Math.max(minFloor, Math.round(params.rawXp - breakdown.totalXpPenalty));

  return {
    rawScore: clampScore(params.rawScore),
    adjustedScore,
    rawXp: Math.max(0, Math.round(params.rawXp)),
    adjustedXp,
    breakdown,
  };
}
