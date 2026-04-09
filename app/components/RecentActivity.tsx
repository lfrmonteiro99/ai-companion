"use client";

import { motion } from "framer-motion";
import { Clock, ArrowRight } from "lucide-react";

interface RecentSession {
  agentName: string;
  mode: string;
  date: string;
  score?: number | null;
}

interface RecentActivityProps {
  sessions: RecentSession[];
}

const MODE_LABEL: Record<string, string> = {
  practice: "Prática",
  scenario: "Cenário",
  challenge: "Desafio",
};

const MODE_BADGE: Record<string, string> = {
  practice: "bg-mira-500/15 text-mira-400 ring-1 ring-mira-500/25",
  scenario: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25",
  challenge: "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/25",
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "agora mesmo";
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays === 1) return "ontem";
  if (diffDays < 7) return `há ${diffDays} dias`;
  return date.toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
}

export default function RecentActivity({ sessions }: RecentActivityProps) {
  if (sessions.length === 0) {
    return (
      <div className="mt-10 text-center">
        <p className="text-sm text-base-400">
          Ainda sem sessões. Escolhe uma personagem para começar.
        </p>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      className="mt-12"
    >
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold italic text-base-50">
          <Clock size={18} className="text-base-400" />
          Atividade Recente
        </h2>
        <a
          href="/history"
          className="flex items-center gap-1 text-xs font-medium text-base-400 transition-colors hover:text-base-100"
        >
          Ver tudo
          <ArrowRight size={12} />
        </a>
      </div>

      {/* Session list */}
      <div className="space-y-2">
        {sessions.map((session, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.1 + i * 0.05 }}
            className="flex items-center justify-between rounded-xl border border-base-500/30 bg-base-800/60 px-4 py-3 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-base-100">{session.agentName}</span>
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase ${
                  MODE_BADGE[session.mode] || "bg-base-600 text-base-300 ring-1 ring-base-500"
                }`}
              >
                {MODE_LABEL[session.mode] || session.mode}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {session.score != null && (
                <span className="text-xs font-semibold text-emerald-400">
                  {Math.round(session.score)}
                </span>
              )}
              <span className="text-xs text-base-400">
                {formatRelativeDate(session.date)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
