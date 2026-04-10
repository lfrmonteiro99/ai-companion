import type { ConversationMode } from "@/lib/types";

export interface HintPenaltyBreakdown {
  hintsUsed: number;
  level: number;
  mode: ConversationMode;
  levelMultiplier: number;
  modeMultiplier: number;
  scorePenalty: number;
  xpPenalty: number;
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
  mode: ConversationMode,
): HintPenaltyBreakdown {
  const safeLevel = Math.max(1, level);
  const safeHints = Math.max(0, hintsUsed);
  const levelMultiplier = 1 + Math.floor((safeLevel - 1) / 5) * 0.15;
  const modeMultiplier = MODE_MULTIPLIER[mode] ?? 1.0;
  const scorePenalty = safeHints * BASE_PENALTY_PER_HINT * levelMultiplier * modeMultiplier;
  const xpPenalty = Math.round(scorePenalty * 0.8);

  return {
    hintsUsed: safeHints,
    level: safeLevel,
    mode,
    levelMultiplier,
    modeMultiplier,
    scorePenalty: Number(scorePenalty.toFixed(2)),
    xpPenalty,
  };
}

export function computeFinalScoreAndXp(params: {
  rawScore: number;
  rawXp: number;
  level: number;
  hintsUsed: number;
  mode: ConversationMode;
}): FinalScoreAndXp {
  const breakdown = computeHintPenalty(params.level, params.hintsUsed, params.mode);
  const adjustedScore = clampScore(params.rawScore - breakdown.scorePenalty);
  const minFloor = MIN_XP_FLOOR[params.mode] ?? 1;
  const adjustedXp = Math.max(minFloor, Math.round(params.rawXp - breakdown.xpPenalty));

  return {
    rawScore: clampScore(params.rawScore),
    adjustedScore,
    rawXp: Math.max(0, Math.round(params.rawXp)),
    adjustedXp,
    breakdown,
  };
}
