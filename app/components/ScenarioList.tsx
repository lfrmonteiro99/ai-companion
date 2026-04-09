"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Trophy, Filter } from "lucide-react";

interface ScenarioWithStatus {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: "easy" | "normal" | "hard" | "expert";
  category: string;
  locked: boolean;
  bestScore: number | null;
  attemptCount: number;
  tips: string[];
  maxMessages: number | null;
}

interface ScenarioListProps {
  scenarios: ScenarioWithStatus[];
  onSelect: (id: string) => void;
}

const DIFFICULTY_BADGE: Record<string, string> = {
  easy: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25",
  normal: "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/25",
  hard: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25",
  expert: "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/25",
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Fácil",
  normal: "Normal",
  hard: "Difícil",
  expert: "Especialista",
};

const CATEGORY_LABEL: Record<string, string> = {
  opening: "Abertura",
  sustain: "Sustentação",
  recovery: "Recuperação",
  rejection: "Rejeição",
  flirting: "Flerte",
  transition: "Transição",
};

const CATEGORIES = ["opening", "sustain", "recovery", "rejection", "flirting", "transition"] as const;

export default function ScenarioList({ scenarios, onSelect }: ScenarioListProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filtered =
    activeFilter === "all"
      ? scenarios
      : scenarios.filter((s) => s.category === activeFilter);

  return (
    <div>
      {/* Filter pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFilter("all")}
          className={`rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition-all duration-200 ${
            activeFilter === "all"
              ? "bg-[var(--agent-accent)] text-white shadow-[0_0_12px_var(--agent-glow)]"
              : "bg-base-700/80 text-base-300 hover:bg-base-600/80 hover:text-base-100"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Filter size={12} />
            Todos
          </span>
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition-all duration-200 ${
              activeFilter === cat
                ? "bg-[var(--agent-accent)] text-white shadow-[0_0_12px_var(--agent-glow)]"
                : "bg-base-700/80 text-base-300 hover:bg-base-600/80 hover:text-base-100"
            }`}
          >
            {CATEGORY_LABEL[cat] || cat}
          </button>
        ))}
      </div>

      {/* Scenario grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((scenario, i) => (
            <motion.div
              key={scenario.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, delay: i * 0.04, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <button
                onClick={() => !scenario.locked && onSelect(scenario.id)}
                disabled={scenario.locked}
                className={`group relative w-full text-left rounded-2xl border border-base-500/40 bg-base-800/85 backdrop-blur-md shadow-surface-1 transition-all duration-300 ease-out ${
                  scenario.locked
                    ? "cursor-not-allowed opacity-50"
                    : "hover:-translate-y-0.5 hover:shadow-surface-2 hover:border-base-400/60"
                }`}
              >
                {/* Locked overlay */}
                {scenario.locked && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-base-950/60 backdrop-blur-[2px]">
                    <Lock size={24} className="mb-2 text-base-400" />
                    <span className="text-xs font-medium text-base-400">
                      Nível mais alto necessário
                    </span>
                  </div>
                )}

                {/* Best score badge */}
                {scenario.bestScore !== null && scenario.bestScore > 0 && (
                  <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 ring-1 ring-emerald-500/25">
                    <Trophy size={12} className="text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">
                      {scenario.bestScore}
                    </span>
                  </div>
                )}

                <div className="p-5">
                  {/* Title */}
                  <h3 className="mb-1.5 pr-16 font-display text-lg font-semibold italic text-base-50">
                    {scenario.title}
                  </h3>

                  {/* Description */}
                  <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-base-200">
                    {scenario.description}
                  </p>

                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase ${
                        DIFFICULTY_BADGE[scenario.difficulty] || "bg-base-600 text-base-300 ring-1 ring-base-500"
                      }`}
                    >
                      {DIFFICULTY_LABEL[scenario.difficulty] || scenario.difficulty}
                    </span>
                    <span className="inline-block rounded-full bg-base-600/80 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-base-300">
                      {CATEGORY_LABEL[scenario.category] || scenario.category}
                    </span>
                  </div>

                  {/* Attempt count */}
                  {scenario.attemptCount > 0 && (
                    <p className="mt-3 text-[11px] text-base-400">
                      {scenario.attemptCount}{" "}
                      {scenario.attemptCount === 1 ? "tentativa" : "tentativas"}
                    </p>
                  )}
                </div>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <p className="text-sm text-base-400">
            Nenhum cenário encontrado nesta categoria.
          </p>
        </motion.div>
      )}
    </div>
  );
}
