"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowUp, BarChart3, X } from "lucide-react";

interface ReplayMessage {
  id: string;
  senderRole: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface MessageAnalysis {
  messageIndex: number;
  impact: "positive" | "neutral" | "negative";
  issues?: string[];
  suggestion?: string;
}

interface KeyMoment {
  messageIndex: number;
  type: string;
  description: string;
}

interface SessionFeedback {
  messageAnalysis: MessageAnalysis[];
  keyMoments?: KeyMoment[];
}

interface ConversationReplayProps {
  messages: ReplayMessage[];
  agentName: string;
  conversationId?: string;
  feedback?: SessionFeedback | null;
}

const IMPACT_DOT: Record<string, string> = {
  positive: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]",
  neutral: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]",
  negative: "bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.5)]",
};

const IMPACT_LABEL: Record<string, string> = {
  positive: "Positivo",
  neutral: "Neutro",
  negative: "Negativo",
};

const IMPACT_BORDER: Record<string, string> = {
  positive: "border-emerald-500/40",
  neutral: "border-amber-500/40",
  negative: "border-rose-500/40",
};

const KEY_MOMENT_LABELS: Record<string, string> = {
  momentum_loss: "Perda de Momentum",
  too_intense: "Intenso Demais",
  too_cold: "Frio Demais",
  good_read: "Boa Leitura",
  ignored_signal: "Sinal Ignorado",
  good_recovery: "Boa Recuperacao",
};

function formatTime(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ConversationReplay({
  messages,
  agentName,
  conversationId,
  feedback,
}: ConversationReplayProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [expandedTooltip, setExpandedTooltip] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function handleScroll() {
      setShowScrollTop((el?.scrollTop || 0) > 400);
    }
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToTop() {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Build lookup maps from feedback
  const analysisMap = new Map<number, MessageAnalysis>();
  const keyMomentMap = new Map<number, KeyMoment>();

  if (feedback) {
    for (const a of feedback.messageAnalysis) {
      analysisMap.set(a.messageIndex, a);
    }
    if (feedback.keyMoments) {
      for (const km of feedback.keyMoments) {
        keyMomentMap.set(km.messageIndex, km);
      }
    }
  }

  // Track user message index (only counting user messages)
  let userMsgIndex = -1;

  return (
    <div className="flex h-[calc(100vh-73px)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-base-500/30 px-4 py-3 backdrop-blur-md bg-base-950/60">
        <div className="flex items-center gap-3">
          <a
            href="/history"
            className="flex items-center gap-1.5 rounded-lg p-1.5 text-base-400 transition-colors hover:bg-base-700/60 hover:text-base-100"
          >
            <ArrowLeft size={18} />
          </a>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-base-700 ring-1 ring-base-500/30 text-xs font-bold text-base-200">
              {agentName[0]}
            </div>
            <div>
              <span className="font-display text-sm font-semibold text-base-50">
                {agentName}
              </span>
              <span className="ml-2 text-[10px] text-base-400">
                Reprodução
              </span>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <span className="text-[11px] text-base-400">
            {formatDate(messages[0].createdAt)}
          </span>
        )}
      </div>

      {/* Messages area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Top fade */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-base-950 to-transparent" />

        <div ref={scrollRef} className="h-full overflow-y-auto px-4 py-4">
          <div className="mx-auto max-w-2xl space-y-3">
            {messages.map((msg, idx) => {
              const isUser = msg.senderRole === "user";
              if (isUser) userMsgIndex++;
              const currentUserIdx = isUser ? userMsgIndex : -1;

              const analysis = isUser ? analysisMap.get(currentUserIdx) : null;
              const keyMoment = isUser ? keyMomentMap.get(currentUserIdx) : null;

              return (
                <div key={msg.id}>
                  {/* Key moment marker */}
                  {keyMoment && (
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0.8 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      className="my-4 flex items-center gap-3"
                    >
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
                      <span className="shrink-0 rounded-full bg-indigo-500/15 px-3 py-1 text-[10px] font-medium tracking-wide text-indigo-400 ring-1 ring-indigo-500/25">
                        {KEY_MOMENT_LABELS[keyMoment.type] ?? keyMoment.description}
                      </span>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.2,
                      delay: Math.min(idx * 0.02, 0.5),
                      ease: [0.34, 1.56, 0.64, 1],
                    }}
                    className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2`}
                  >
                    {/* Agent avatar for assistant messages */}
                    {!isUser && (
                      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-base-700 ring-1 ring-base-500/30 text-[10px] font-bold text-base-300">
                        {agentName[0]}
                      </div>
                    )}

                    <div className="max-w-[78%]">
                      <div className="relative">
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            isUser
                              ? "rounded-br-sm bg-base-700 text-base-100 border border-base-500/30"
                              : "rounded-bl-sm bg-base-800/60 backdrop-blur-sm text-base-100 border border-base-500/20"
                          }`}
                        >
                          {!isUser && (
                            <div className="mb-1 text-[10px] font-semibold tracking-widest uppercase text-indigo-400">
                              {agentName}
                            </div>
                          )}
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>

                        {/* Impact indicator dot */}
                        {analysis && (
                          <button
                            onClick={() =>
                              setExpandedTooltip(
                                expandedTooltip === currentUserIdx
                                  ? null
                                  : currentUserIdx
                              )
                            }
                            className={`absolute -left-2 top-3 h-3 w-3 rounded-full transition-transform hover:scale-125 ${IMPACT_DOT[analysis.impact]}`}
                            title={IMPACT_LABEL[analysis.impact]}
                          />
                        )}
                      </div>

                      {/* Tooltip with issues + suggestion */}
                      <AnimatePresence>
                        {analysis && expandedTooltip === currentUserIdx && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className={`mt-2 rounded-xl border ${IMPACT_BORDER[analysis.impact]} bg-base-800/95 p-3 shadow-surface-1`}
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <span
                                className={`text-[10px] font-semibold tracking-wide uppercase ${
                                  analysis.impact === "positive"
                                    ? "text-emerald-400"
                                    : analysis.impact === "neutral"
                                      ? "text-amber-400"
                                      : "text-rose-400"
                                }`}
                              >
                                {IMPACT_LABEL[analysis.impact]}
                              </span>
                              <button
                                onClick={() => setExpandedTooltip(null)}
                                className="text-base-400 hover:text-base-200 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            {analysis.issues && (
                              <p className="mb-2 text-xs leading-relaxed text-base-300">
                                <span className="font-medium text-base-200">
                                  Problema:{" "}
                                </span>
                                {analysis.issues.join(", ")}
                              </p>
                            )}
                            {analysis.suggestion && (
                              <p className="text-xs leading-relaxed text-base-300">
                                <span className="font-medium text-base-200">
                                  Sugestão:{" "}
                                </span>
                                <span className="italic">
                                  &ldquo;{analysis.suggestion}&rdquo;
                                </span>
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Timestamp */}
                      <div
                        className={`mt-0.5 text-[10px] ${isUser ? "text-right" : "text-left"} text-base-400`}
                      >
                        {formatTime(msg.createdAt)}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-base-950 to-transparent" />
      </div>

      {/* Bottom bar */}
      <div className="border-t border-base-500/30 px-4 py-3 backdrop-blur-md bg-base-950/60">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <span className="text-xs text-base-400">
            {messages.length} {messages.length === 1 ? "mensagem" : "mensagens"}
          </span>
          {conversationId && (
            <a
              href={`/analysis/${conversationId}`}
              className="flex items-center gap-2 rounded-xl bg-indigo-500/15 px-4 py-2 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/25 transition-all hover:bg-indigo-500/25 hover:text-indigo-200 hover:ring-indigo-500/40"
            >
              <BarChart3 size={14} />
              Ver Análise Completa
            </a>
          )}
        </div>
      </div>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            className="fixed bottom-24 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-base-500/40 bg-base-800/90 backdrop-blur-md text-base-300 shadow-lg transition-colors hover:bg-base-700 hover:text-base-100"
          >
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
