"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ChevronUp, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import type { CoachingFeedback } from "@/lib/types";

type Impact = "positive" | "neutral" | "negative";

interface CoachingBadgeProps {
  coaching: CoachingFeedback;
  onDismiss?: () => void;
}

const HINT_STORAGE_KEY = "coachingBadgeHintSeen";

type IconComponent = typeof CheckCircle2;

const IMPACT_STYLES: Record<Impact, {
  stripe: string;
  iconBg: string;
  label: string;
  Icon: IconComponent;
}> = {
  positive: {
    stripe: "bg-emerald-500",
    iconBg: "bg-emerald-500",
    label: "Boa jogada",
    Icon: CheckCircle2,
  },
  neutral: {
    stripe: "bg-amber-500",
    iconBg: "bg-amber-500",
    label: "Podes ajustar",
    Icon: ArrowRight,
  },
  negative: {
    stripe: "bg-rose-500",
    iconBg: "bg-rose-500",
    label: "Atenção",
    Icon: AlertCircle,
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
  emotionalIntelligence: "Intel. Emocional",
  boundaryRespect: "Limites",
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
  const Icon = style.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25, delay: 0.4, ease: "easeOut" }}
      className="mt-2 overflow-hidden rounded-xl border border-base-500/30 bg-base-800 shadow-sm"
    >
      <div className="flex items-stretch">
        {/* Colored impact stripe */}
        <div className={`w-1 shrink-0 ${style.stripe}`} aria-hidden="true" />

        <div className="flex flex-1 items-start gap-2.5 px-3 py-2.5">
          {/* Solid icon pill */}
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${style.iconBg}`}
            aria-hidden="true"
          >
            <Icon size={12} className="text-white" strokeWidth={2.5} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-base-300">
                Coach
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-base-400">
                {style.label}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-base-100">{coaching.feedback}</p>
            {showHint && hasDetail && !expanded && (
              <button
                onClick={handleToggleExpanded}
                className="mt-1.5 inline-flex animate-pulse items-center gap-1 rounded-full bg-base-700 px-2 py-0.5 text-[10px] font-medium text-base-100 ring-1 ring-base-500/40 transition-colors hover:animate-none hover:bg-base-600/80"
                aria-label="Ver alternativa sugerida"
              >
                <span aria-hidden="true">💡</span>
                Ver alternativa
              </button>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            {hasDetail && (
              <button
                onClick={handleToggleExpanded}
                className="rounded-md p-1 text-base-300 transition-colors hover:bg-base-700 hover:text-base-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-base-400"
                aria-label={expanded ? "Colapsar detalhes" : "Expandir detalhes"}
                aria-expanded={expanded}
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="rounded-md p-1 text-base-300 transition-colors hover:bg-base-700 hover:text-base-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-base-400"
              aria-label="Fechar coaching"
            >
              <X size={14} />
            </button>
          </div>
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
            <div className="space-y-2.5 border-t border-base-600/40 px-3 py-2.5 pl-[calc(0.25rem+0.75rem)]">
              {coaching.suggestion && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-base-300">
                    Alternativa sugerida
                  </p>
                  <p className="text-xs italic leading-relaxed text-base-100">
                    &ldquo;{coaching.suggestion}&rdquo;
                  </p>
                </div>
              )}
              {Object.keys(coaching.scores).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(coaching.scores).map(([skill, score]) => (
                    <span
                      key={skill}
                      className="rounded-full bg-base-700 px-2 py-0.5 text-[10px] font-medium text-base-100"
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
