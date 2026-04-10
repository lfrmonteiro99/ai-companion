"use client";

interface ExerciseResultCardProps {
  isCorrect: boolean;
  adjustedScore: number;
  finalXpAwarded: number;
  explanation?: string | null;
  penalties: {
    hintsUsed: number;
    directHintUses: number;
    scorePenalty: number;
    xpPenalty: number;
  };
  bonuses: {
    noHintBonus: number;
    firstTodayBonus: number;
  };
}

export default function ExerciseResultCard({
  isCorrect,
  adjustedScore,
  finalXpAwarded,
  explanation,
  penalties,
  bonuses,
}: ExerciseResultCardProps) {
  return (
    <section className="rounded-2xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md shadow-surface-1">
      <p className={`text-sm font-semibold ${isCorrect ? "text-emerald-400" : "text-amber-400"}`}>
        {isCorrect ? "Strong answer" : "Room to improve"}
      </p>
      <p className="mt-1 text-base-200">Adjusted score: {Math.round(adjustedScore)}</p>
      <p className="text-base-200">XP gained: {finalXpAwarded}</p>
      {explanation && <p className="mt-2 text-sm text-base-300">{explanation}</p>}
      <p className="mt-3 text-xs text-base-400">
        Penalties: hints {penalties.hintsUsed}, direct hint use {penalties.directHintUses}, score -
        {penalties.scorePenalty.toFixed(1)}, xp -{penalties.xpPenalty}
      </p>
      <p className="text-xs text-base-400">
        Bonuses: no-hint +{bonuses.noHintBonus}, first-today +{bonuses.firstTodayBonus}
      </p>
    </section>
  );
}
