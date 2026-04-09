"use client";

import { motion, AnimatePresence } from "framer-motion";
import { getTopLabels, RelationalLabel } from "@/lib/utils/relational-labels";

interface StateData {
  stage: number;
  trust: number;
  comfort: number;
  tension: number;
  respect: number;
  attachment: number;
  emotionalOpenness: number;
  conversationDepth: number;
  dynamicAlignment: number;
  interest: number;
}

const STAGE_NAMES: Record<number, string> = {
  0: "Desconhecidos",
  1: "Curiosidade",
  2: "Envolvimento",
  3: "Investimento",
  4: "Intimidade",
};

const STAGE_DESCRIPTIONS: Record<number, string> = {
  0: "Ainda não quebrou o gelo.",
  1: "Algo em ti chamou a atenção dela.",
  2: "As vossas conversas já têm substância.",
  3: "Ela está investida. Esta ligação importa-lhe.",
  4: "Algo mais profundo desbloqueou entre vocês.",
};

const sentimentColors: Record<string, string> = {
  positive: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
  neutral: "text-base-300 border-base-500/30 bg-base-500/5",
  negative: "text-rose-400 border-rose-500/30 bg-rose-500/5",
  warning: "text-amber-400 border-amber-500/30 bg-amber-500/5",
};

const sentimentDot: Record<string, string> = {
  positive: "bg-emerald-400",
  neutral: "bg-base-400",
  negative: "bg-rose-400",
  warning: "bg-amber-400",
};

export default function RelationshipProgress({ state, agentName }: { state: StateData; agentName: string }) {
  const stageName = STAGE_NAMES[state.stage] || "Desconhecidos";
  const stageDesc = STAGE_DESCRIPTIONS[state.stage] || "";
  const labels = getTopLabels(state, 4);

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-base-400">
        A tua ligação com {agentName}
      </h2>
      <div className="rounded-xl p-5 surface-1">
        {/* Stage name + subtle indicator */}
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--agent-accent)]/15">
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--agent-accent)] shadow-[0_0_8px_var(--agent-glow)]" />
          </div>
          <div>
            <span className="text-sm font-medium text-base-50">{stageName}</span>
            <p className="text-xs italic text-base-300">{stageDesc}</p>
          </div>
        </div>

        {/* Relational labels — natural language */}
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {labels.map((label: RelationalLabel, i: number) => (
              <motion.div
                key={label.text}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${sentimentColors[label.sentiment]}`}
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${sentimentDot[label.sentiment]}`} />
                <span className="text-sm">{label.text}</span>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {labels.length === 0 && (
          <p className="text-sm italic text-base-400">A conhecer-te...</p>
        )}
      </div>
    </section>
  );
}
