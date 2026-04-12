"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import type { CoachingFeedback } from "@/lib/types";

interface CoachingBadgeProps {
  coaching: CoachingFeedback;
  onDismiss?: () => void;
}

const IMPACT_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  positive: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-300",
    icon: "✓",
  },
  neutral: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-300",
    icon: "→",
  },
  negative: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    text: "text-rose-300",
    icon: "!",
  },
};

const SKILL_LABELS: Record<string, string> = {
  confidence: "Confiança",
  warmth: "Calor",
  curiosity: "Curiosidade",
  calibration: "Calibração",
  authenticity: "Autenticidade",
  pressureLevel: "Pressão",
  awkwardness: "Desconforto",
  emotionalIntelligence: "Inteligência Emocional",
  boundaryRespect: "Respeito por Limites",
  conversationalMomentum: "Momentum",
};

export default function CoachingBadge({ coaching, onDismiss }: CoachingBadgeProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const style = IMPACT_STYLES[coaching.impact] || IMPACT_STYLES.neutral;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: 0.5 }}
      className={`mt-1.5 rounded-xl border ${style.border} ${style.bg} text-xs`}
    >
      <div className="flex items-start gap-2 px-3 py-2">
        <span className={`mt-0.5 text-sm font-bold ${style.text}`} aria-hidden="true">
          {style.icon}
        </span>
        <p className={`flex-1 leading-relaxed ${style.text}`}>
          {coaching.feedback}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          {(coaching.suggestion || Object.keys(coaching.scores).length > 0) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded p-0.5 text-base-400 hover:text-base-200 transition-colors"
              aria-label={expanded ? "Colapsar detalhes" : "Expandir detalhes"}
              aria-expanded={expanded}
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
          <button
            onClick={() => { setDismissed(true); onDismiss?.(); }}
            className="rounded p-0.5 text-base-400 hover:text-base-200 transition-colors"
            aria-label="Fechar coaching"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-base-500/20 px-3 py-2 space-y-2">
              {coaching.suggestion && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-base-400 mb-0.5">
                    Alternativa sugerida
                  </p>
                  <p className="italic text-base-200">&ldquo;{coaching.suggestion}&rdquo;</p>
                </div>
              )}
              {Object.keys(coaching.scores).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(coaching.scores).map(([skill, score]) => (
                    <span
                      key={skill}
                      className="rounded-full bg-base-700/60 px-2 py-0.5 text-[10px] text-base-300"
                    >
                      {SKILL_LABELS[skill] || skill}: {Math.round(score as number)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
