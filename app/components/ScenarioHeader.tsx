"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, MessageSquare, Clock, X } from "lucide-react";

interface ScenarioHeaderProps {
  objective: string;
  messageCount: number;
  maxMessages?: number;
  timeLimit?: number;
  onEnd: () => void;
}

export default function ScenarioHeader({
  objective,
  messageCount,
  maxMessages,
  timeLimit,
  onEnd,
}: ScenarioHeaderProps) {
  const [secondsLeft, setSecondsLeft] = useState(timeLimit ?? 0);
  const [showConfirm, setShowConfirm] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer countdown
  useEffect(() => {
    if (!timeLimit || timeLimit <= 0) return;
    setSecondsLeft(timeLimit);

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timeLimit]);

  // Auto-end when timer hits zero
  useEffect(() => {
    if (timeLimit && secondsLeft === 0) {
      onEnd();
    }
  }, [secondsLeft, timeLimit, onEnd]);

  function formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  const timerUrgent = timeLimit ? secondsLeft <= 30 : false;
  const messagesUrgent = maxMessages ? messageCount >= maxMessages - 2 : false;

  return (
    <>
      <div className="sticky top-0 z-20 border-b border-base-500/30 bg-base-950/70 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-2.5">
          {/* Objective */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Target size={14} className="shrink-0 text-[var(--agent-accent)]" />
            <p className="truncate text-xs font-medium text-base-200">
              {objective}
            </p>
          </div>

          {/* Counters */}
          <div className="flex shrink-0 items-center gap-3">
            {/* Message counter */}
            {maxMessages && (
              <div
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  messagesUrgent
                    ? "bg-amber-500/15 text-amber-400"
                    : "bg-base-700/80 text-base-300"
                }`}
              >
                <MessageSquare size={11} />
                <span>
                  {messageCount}/{maxMessages}
                </span>
              </div>
            )}

            {/* Timer */}
            {timeLimit && timeLimit > 0 && (
              <div
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums transition-colors ${
                  timerUrgent
                    ? "bg-rose-500/15 text-rose-400 animate-pulse"
                    : "bg-base-700/80 text-base-300"
                }`}
              >
                <Clock size={11} />
                <span>{formatTime(secondsLeft)}</span>
              </div>
            )}

            {/* End button */}
            <button
              onClick={() => setShowConfirm(true)}
              className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-base-400 transition-colors hover:bg-base-700/60 hover:text-rose-400"
            >
              Terminar
            </button>
          </div>
        </div>
      </div>

      {/* End confirmation modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
              className="surface-3 mx-4 w-full max-w-sm rounded-2xl p-6"
            >
              <h3 className="mb-2 text-lg font-semibold text-base-50">
                Terminar cenário?
              </h3>
              <p className="mb-5 text-sm text-base-300">
                O cenário será encerrado e sua performance será avaliada com base nas mensagens enviadas até agora.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-base-200 transition-colors hover:bg-base-600/50"
                >
                  Continuar
                </button>
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    onEnd();
                  }}
                  className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-rose-500 shadow-[0_0_16px_rgba(225,29,72,0.25)]"
                >
                  <X size={14} />
                  Terminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
