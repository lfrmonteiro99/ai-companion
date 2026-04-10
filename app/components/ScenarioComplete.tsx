"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, RotateCcw, ArrowRight, Search, Sparkles, XCircle } from "lucide-react";

interface Achievement {
  id: string;
  label: string;
  icon: string;
}

interface ScenarioCompleteProps {
  success: boolean;
  overallScore: number;
  xpEarned: number;
  rawScore?: number;
  rawXp?: number;
  hintsUsed?: number;
  hintPenaltyScore?: number;
  hintPenaltyXp?: number;
  leveledUp: boolean;
  newLevel?: number;
  achievements: Achievement[];
  onViewAnalysis: () => void;
  onRetry: () => void;
  onNext: () => void;
}

function ScoreCircle({ score, success }: { score: number; success: boolean }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const [animatedOffset, setAnimatedOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      const offset = circumference - (score / 100) * circumference;
      setAnimatedOffset(offset);
    }, 400);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={success ? "#34d399" : "#f87171"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          className="transition-all duration-1000 ease-out"
          style={{
            filter: success
              ? "drop-shadow(0 0 8px rgba(52,211,153,0.4))"
              : "drop-shadow(0 0 8px rgba(248,113,113,0.3))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4, type: "spring", stiffness: 200 }}
          className="text-4xl font-bold tabular-nums text-base-50"
        >
          {score}
        </motion.span>
        <span className="text-[10px] font-medium uppercase tracking-widest text-base-400">
          pontos
        </span>
      </div>
    </div>
  );
}

export default function ScenarioComplete({
  success,
  overallScore,
  xpEarned,
  rawScore,
  rawXp,
  hintsUsed = 0,
  hintPenaltyScore = 0,
  hintPenaltyXp = 0,
  leveledUp,
  newLevel,
  achievements,
  onViewAnalysis,
  onRetry,
  onNext,
}: ScenarioCompleteProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-base-950/95 backdrop-blur-xl"
      >
        {/* Background glow effect */}
        <div
          className={`pointer-events-none absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] ${
            success ? "bg-emerald-500/15" : "bg-rose-500/8"
          }`}
        />

        {/* Decorative particles for success */}
        {success && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  x: `${50 + (Math.random() - 0.5) * 20}%`,
                  y: "60%",
                  scale: 0,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  x: `${50 + (Math.random() - 0.5) * 80}%`,
                  y: `${Math.random() * 40}%`,
                  scale: [0, 1, 0.5],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: 0.2 + Math.random() * 0.8,
                  ease: "easeOut",
                }}
                className="absolute h-1.5 w-1.5 rounded-full"
                style={{
                  background: ["#34d399", "#6ee7b7", "#a7f3d0", "#fbbf24", "#818cf8"][
                    Math.floor(Math.random() * 5)
                  ],
                  boxShadow: `0 0 6px ${
                    ["rgba(52,211,153,0.6)", "rgba(110,231,183,0.5)", "rgba(167,243,208,0.4)", "rgba(251,191,36,0.5)", "rgba(129,140,248,0.5)"][
                      Math.floor(Math.random() * 5)
                    ]
                  }`,
                }}
              />
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative z-10 mx-4 w-full max-w-md"
        >
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
              className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                success
                  ? "bg-emerald-500/15 ring-2 ring-emerald-500/30 shadow-[0_0_32px_rgba(52,211,153,0.2)]"
                  : "bg-base-700/60 ring-2 ring-base-500/30"
              }`}
            >
              {success ? (
                <Trophy size={28} className="text-emerald-400" />
              ) : (
                <XCircle size={28} className="text-base-300" />
              )}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="mb-1.5 font-display text-2xl font-bold italic text-base-50"
            >
              {success ? "Cenário Completo!" : "Cenário Terminado"}
            </motion.h1>

            {!success && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-4 text-sm text-base-300"
              >
                Não se preocupe — cada tentativa é uma oportunidade de aprender.
              </motion.p>
            )}

            {/* Score circle */}
            {showContent && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="my-6"
              >
                <ScoreCircle score={overallScore} success={success} />
              </motion.div>
            )}

            {/* XP earned */}
            {showContent && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.3 }}
                className="mb-4 flex items-center gap-2"
              >
                <Sparkles size={16} className="text-amber-400" />
                <span className="text-lg font-bold text-amber-400">
                  +{xpEarned} XP
                </span>
              </motion.div>
            )}

            {showContent && hintsUsed > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.3 }}
                className="mb-4 w-full rounded-xl border border-base-500/30 bg-base-800/60 px-4 py-3 text-left text-xs text-base-300"
              >
                <p className="mb-1 font-semibold text-base-200">Impacto das dicas</p>
                <p>Dicas usadas: {hintsUsed}</p>
                <p>Score bruto/final: {rawScore ?? overallScore} / {overallScore} (-{hintPenaltyScore.toFixed(2)})</p>
                <p>XP bruto/final: {rawXp ?? xpEarned} / {xpEarned} (-{hintPenaltyXp})</p>
              </motion.div>
            )}

            {/* Level up */}
            {showContent && leveledUp && newLevel && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 1.0,
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-6 py-3 shadow-[0_0_24px_rgba(251,191,36,0.15)]"
              >
                <div className="flex items-center gap-2.5">
                  <Star size={20} className="text-amber-400" />
                  <div className="text-left">
                    <p className="text-xs font-medium uppercase tracking-widest text-amber-400/80">
                      Subiu de nível!
                    </p>
                    <p className="font-display text-xl font-bold italic text-amber-300">
                      Nível {newLevel}!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Achievements */}
            {showContent && achievements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.3 }}
                className="mb-8 w-full"
              >
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-base-400">
                  Conquistas Desbloqueadas
                </h3>
                <div className="space-y-2">
                  {achievements.map((ach, i) => (
                    <motion.div
                      key={ach.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.3 + i * 0.1, duration: 0.25 }}
                      className="flex items-center gap-3 rounded-xl bg-base-800/80 px-4 py-3 ring-1 ring-base-500/30"
                    >
                      <span className="text-lg">{ach.icon}</span>
                      <span className="text-sm font-medium text-base-100">
                        {ach.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Action buttons */}
            {showContent && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.3 }}
                className="flex w-full flex-col gap-2.5"
              >
                <button
                  onClick={onViewAnalysis}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--agent-accent)] px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_20px_var(--agent-glow)]"
                >
                  <Search size={16} />
                  Ver Análise Detalhada
                </button>
                <div className="flex gap-2.5">
                  <button
                    onClick={onRetry}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-base-500/40 bg-base-800/60 px-4 py-2.5 text-sm font-medium text-base-200 transition-all duration-200 hover:bg-base-700/80 hover:text-base-50"
                  >
                    <RotateCcw size={14} />
                    Tentar Novamente
                  </button>
                  <button
                    onClick={onNext}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-base-500/40 bg-base-800/60 px-4 py-2.5 text-sm font-medium text-base-200 transition-all duration-200 hover:bg-base-700/80 hover:text-base-50"
                  >
                    Próximo Cenário
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
