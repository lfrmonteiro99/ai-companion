"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, AlertTriangle, Lightbulb, MessageSquareQuote } from "lucide-react";
import type { MessageFeedback } from "@/lib/types";

interface MessageAnalysisCardProps {
  analysis: MessageFeedback;
  index: number;
}

const impactConfig: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  positive: {
    label: "Positivo",
    bg: "bg-emerald-500/15",
    text: "text-emerald-500",
    dot: "bg-emerald-500",
  },
  neutral: {
    label: "Neutro",
    bg: "bg-base-400/15",
    text: "text-base-400",
    dot: "bg-base-400",
  },
  negative: {
    label: "Negativo",
    bg: "bg-rose-500/15",
    text: "text-rose-500",
    dot: "bg-rose-500",
  },
};

export default function MessageAnalysisCard({
  analysis,
  index,
}: MessageAnalysisCardProps) {
  const [expanded, setExpanded] = useState(false);
  const impact = impactConfig[analysis.impact] ?? impactConfig.neutral;

  const hasDetails =
    (analysis.issues && analysis.issues.length > 0) ||
    analysis.suggestion ||
    analysis.note;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="rounded-xl border border-base-500/40 bg-base-800/85 backdrop-blur-md overflow-hidden"
    >
      {/* Collapsed header */}
      <button
        onClick={() => hasDetails && setExpanded((v) => !v)}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
          hasDetails ? "cursor-pointer hover:bg-base-700/40" : "cursor-default"
        }`}
      >
        <span className="shrink-0 font-mono text-xs text-base-500">
          #{index + 1}
        </span>

        <p className="min-w-0 flex-1 truncate text-sm text-base-200">
          {analysis.userMessage}
        </p>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${impact.bg} ${impact.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${impact.dot}`} />
          {impact.label}
        </span>

        {hasDetails && (
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 text-base-400"
          >
            <ChevronDown size={16} />
          </motion.span>
        )}
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && hasDetails && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-base-500/30 px-4 pb-4 pt-3">
              {/* Full message */}
              <p className="text-sm leading-relaxed text-base-100">
                {analysis.userMessage}
              </p>

              {/* Issues */}
              {analysis.issues && analysis.issues.length > 0 && (
                <div className="flex flex-wrap items-start gap-2">
                  <AlertTriangle
                    size={14}
                    className="mt-0.5 shrink-0 text-amber-500"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.issues.map((issue, i) => (
                      <span
                        key={i}
                        className="inline-block rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-400"
                      >
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestion */}
              {analysis.suggestion && (
                <div className="flex items-start gap-2">
                  <Lightbulb
                    size={14}
                    className="mt-1 shrink-0 text-sky-400"
                  />
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-base-400">
                      Alternativa sugerida:
                    </p>
                    <blockquote className="rounded-lg border-l-2 border-sky-500/50 bg-sky-500/5 px-3 py-2 text-sm italic text-sky-200">
                      <MessageSquareQuote
                        size={12}
                        className="mb-1 inline-block text-sky-500/50"
                      />{" "}
                      {analysis.suggestion}
                    </blockquote>
                  </div>
                </div>
              )}

              {/* Note */}
              {analysis.note && (
                <p className="text-xs leading-relaxed text-base-300">
                  {analysis.note}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
