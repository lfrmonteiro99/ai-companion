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
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="rounded-full bg-base-700/80 px-2.5 py-1 text-xs text-base-100">
          Score {Math.round(adjustedScore)}
        </span>
        <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300">
          +{finalXpAwarded} XP
        </span>
      </div>
      {explanation && <p className="mt-2 text-sm text-base-300">{explanation}</p>}
      <details className="mt-3 rounded-lg bg-base-700/40 px-3 py-2 text-xs text-base-300">
        <summary className="cursor-pointer text-base-200">Penalty and bonus breakdown</summary>
        <p className="mt-2">
          Penalties: hints {penalties.hintsUsed}, direct hint use {penalties.directHintUses}, score -
          {penalties.scorePenalty.toFixed(1)}, xp -{penalties.xpPenalty}
        </p>
        <p className="mt-1">
          Bonuses: no-hint +{bonuses.noHintBonus}, first-today +{bonuses.firstTodayBonus}
        </p>
      </details>
    </section>
  );
}
