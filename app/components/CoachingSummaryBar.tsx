"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, GraduationCap } from "lucide-react";
import type { CoachingFeedback } from "@/lib/types";

interface CoachingSummaryBarProps {
  coachingHistory: CoachingFeedback[];
}

const SKILL_LABELS: Record<string, string> = {
  confidence: "Confiança",
  warmth: "Calor",
  curiosity: "Curiosidade",
  calibration: "Calibração",
  authenticity: "Autenticidade",
  pressureLevel: "Pressão",
  awkwardness: "Desconforto",
  emotionalIntelligence: "Intel. Emocional",
  boundaryRespect: "Limites",
  conversationalMomentum: "Momentum",
};

const INVERSE_SKILLS = new Set(["pressureLevel", "awkwardness"]);

export default function CoachingSummaryBar({ coachingHistory }: CoachingSummaryBarProps) {
  const [expanded, setExpanded] = useState(false);

  if (coachingHistory.length === 0) return null;

  // Aggregate scores across all coaching feedbacks
  const scoreAcc: Record<string, { total: number; count: number }> = {};
  for (const c of coachingHistory) {
    for (const [skill, score] of Object.entries(c.scores)) {
      if (typeof score !== "number") continue;
      if (!scoreAcc[skill]) scoreAcc[skill] = { total: 0, count: 0 };
      scoreAcc[skill].total += score;
      scoreAcc[skill].count += 1;
    }
  }

  const avgScores = Object.entries(scoreAcc)
    .map(([skill, { total, count }]) => ({
      skill,
      label: SKILL_LABELS[skill] || skill,
      score: Math.round(total / count),
      isInverse: INVERSE_SKILLS.has(skill),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const positiveCount = coachingHistory.filter((c) => c.impact === "positive").length;
  const total = coachingHistory.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t border-base-500/20 bg-base-950/40 backdrop-blur-sm"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-2 text-xs text-base-400 hover:text-base-300 transition-colors"
        aria-expanded={expanded}
        aria-label="Resumo do coaching"
      >
        <span className="flex items-center gap-1.5">
          <GraduationCap size={13} aria-hidden="true" />
          <span className="font-medium">Coach</span>
          <span className="text-base-500">
            {positiveCount}/{total} positivas
          </span>
        </span>
        {expanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2">
              {avgScores.map(({ skill, label, score, isInverse }) => {
                // For inverse skills, display score shows how GOOD it is (100 - raw)
                const displayScore = isInverse ? 100 - score : score;
                const barColor =
                  displayScore >= 70 ? "bg-emerald-500" :
                  displayScore >= 45 ? "bg-amber-500" :
                  "bg-rose-500";

                return (
                  <div key={skill} className="flex items-center gap-2">
                    <span className="w-24 shrink-0 text-[10px] text-base-400 truncate">{label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-base-700/60 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${barColor}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${displayScore}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="w-7 text-right text-[10px] text-base-400">{displayScore}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
