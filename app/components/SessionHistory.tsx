"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Trophy, Filter, Clock, Inbox } from "lucide-react";

interface SessionItem {
  conversationId: string;
  agentId: string;
  agentName: string;
  mode: "practice" | "scenario" | "challenge";
  updatedAt: string;
  messageCount: number;
  scenarioTitle?: string;
  score?: number | null;
}

interface SessionHistoryProps {
  sessions: SessionItem[];
}

const MODE_BADGE: Record<string, { label: string; className: string }> = {
  practice: {
    label: "Prática",
    className: "bg-base-500/15 text-base-300 ring-1 ring-base-500/25",
  },
  scenario: {
    label: "Cenário",
    className: "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/25",
  },
  challenge: {
    label: "Desafio",
    className: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25",
  },
};

const AGENT_COLORS: Record<string, string> = {
  valeria: "bg-rose-500",
  luna: "bg-pink-400",
  mira: "bg-indigo-500",
  sable: "bg-violet-500",
  kira: "bg-amber-400",
};

const FILTER_TABS = [
  { key: "all", label: "Todas" },
  { key: "practice", label: "Prática" },
  { key: "scenario", label: "Cenários" },
  { key: "challenge", label: "Desafios" },
] as const;

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays === 1) return "há 1 dia";
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "há 1 semana" : `há ${weeks} semanas`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? "há 1 mês" : `há ${months} meses`;
  }
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}

function getScoreBadge(score: number): { className: string } {
  if (score >= 80) return { className: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25" };
  if (score >= 50) return { className: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25" };
  return { className: "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/25" };
}

export default function SessionHistory({ sessions }: SessionHistoryProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filtered =
    activeFilter === "all"
      ? sessions
      : sessions.filter((s) => s.mode === activeFilter);

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition-all duration-200 ${
              activeFilter === tab.key
                ? "bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                : "bg-base-700/80 text-base-300 hover:bg-base-600/80 hover:text-base-100"
            }`}
          >
            <span className="flex items-center gap-1.5">
              {tab.key === "all" && <Filter size={12} />}
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Session list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sorted.map((session, i) => {
            const modeBadge = MODE_BADGE[session.mode] || MODE_BADGE.practice;
            const agentColor = AGENT_COLORS[session.agentId] || "bg-base-500";

            return (
              <motion.a
                key={session.conversationId}
                href={`/replay/${session.conversationId}`}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  duration: 0.25,
                  delay: i * 0.03,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                className="group block rounded-2xl border border-base-500/40 bg-base-800/85 backdrop-blur-md shadow-surface-1 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-surface-2 hover:border-base-300/60"
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Agent initial circle */}
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-display font-bold text-white ${agentColor}`}
                  >
                    {session.agentName[0]}
                  </div>

                  {/* Session info */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-display text-sm font-semibold text-base-50 truncate">
                        {session.agentName}
                      </span>
                      <span className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase ${modeBadge.className}`}>
                        {modeBadge.label}
                      </span>
                      {session.score != null && (
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getScoreBadge(session.score).className}`}
                        >
                          <Trophy size={10} />
                          {session.score}
                        </span>
                      )}
                    </div>

                    {session.scenarioTitle && (
                      <p className="mb-1 text-xs text-base-200 truncate">
                        {session.scenarioTitle}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-base-400">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {formatRelativeDate(session.updatedAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={11} />
                        {session.messageCount}{" "}
                        {session.messageCount === 1 ? "mensagem" : "mensagens"}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-base-400 opacity-0 transition-opacity group-hover:opacity-100">
                      Abrir replay e análise detalhada &rarr;
                    </div>
                  </div>
                </div>
              </motion.a>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-base-700/60">
            <Inbox size={28} className="text-base-400" />
          </div>
          <p className="mb-1 font-display text-lg font-semibold text-base-200">
            Nenhuma sessão encontrada
          </p>
          <p className="text-sm text-base-400">
            {activeFilter === "all"
              ? "Suas conversas aparecerão aqui após a primeira sessão."
              : "Nenhuma sessão nesta categoria ainda."}
          </p>
        </motion.div>
      )}
    </div>
  );
}
