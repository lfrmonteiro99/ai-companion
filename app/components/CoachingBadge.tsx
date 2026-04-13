"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import type { CoachingFeedback } from "@/lib/types";

interface CoachingBadgeProps {
  coaching: CoachingFeedback;
  onDismiss?: () => void;
}

const HINT_STORAGE_KEY = "coachingBadgeHintSeen";

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
  const [showHint, setShowHint] = useState(false);

  const hasDetail = Boolean(coaching.suggestion) || Object.keys(coaching.scores).length > 0;

  // First-time hint: only shown until the user has expanded any badge once.
  useEffect(() => {
    if (!hasDetail) return;
    if (typeof window === "undefined") return;
    try {
      const seen = window.localStorage.getItem(HINT_STORAGE_KEY);
      if (!seen) setShowHint(true);
    } catch {
      // localStorage may be unavailable (private mode); silently skip the hint.
    }
  }, [hasDetail]);

  function markHintSeen() {
    setShowHint(false);
    try {
      window.localStorage.setItem(HINT_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function handleToggleExpanded() {
    setExpanded((v) => !v);
    if (showHint) markHintSeen();
  }

  function handleDismiss() {
    setDismissed(true);
    if (showHint) markHintSeen();
    onDismiss?.();
  }

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
        <div className="flex-1">
          <p className={`leading-relaxed ${style.text}`}>{coaching.feedback}</p>
          {showHint && hasDetail && !expanded && (
            <button
              onClick={handleToggleExpanded}
              className="mt-1 inline-flex animate-pulse items-center gap-1 rounded-full bg-base-900/60 px-2 py-0.5 text-[10px] font-medium text-base-200 ring-1 ring-base-500/40 transition-colors hover:animate-none hover:bg-base-800"
              aria-label="Ver alternativa sugerida"
            >
              <span aria-hidden="true">💡</span>
              Toca para ver alternativa
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {hasDetail && (
            <button
              onClick={handleToggleExpanded}
              className="rounded p-0.5 text-base-400 transition-colors hover:text-base-200"
              aria-label={expanded ? "Colapsar detalhes" : "Expandir detalhes"}
              aria-expanded={expanded}
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="rounded p-0.5 text-base-400 transition-colors hover:text-base-200"
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
            <div className="space-y-2 border-t border-base-500/20 px-3 py-2">
              {coaching.suggestion && (
                <div>
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-base-400">
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
