"use client";

import { motion } from "framer-motion";
import { Trophy, Flame, Target, MessageCircle, TrendingUp, Zap } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserProgress {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalSessions: number;
  scenariosCompleted: number;
  achievements: string[];
  streakDays: number;
}

interface UserSkillScore {
  confidence: number;
  warmth: number;
  curiosity: number;
  calibration: number;
  authenticity: number;
  pressureLevel: number;
  awkwardness: number;
  emotionalIntelligence: number;
  boundaryRespect: number;
  conversationalMomentum: number;
  overallScore: number;
  totalSessions: number;
}

interface ProgressDashboardProps {
  progress: UserProgress;
  skills: UserSkillScore | null;
}

// ---------------------------------------------------------------------------
// Skill label mapping (Portuguese)
// ---------------------------------------------------------------------------

const SKILL_LABELS: Record<string, string> = {
  confidence: "Confianca",
  warmth: "Calor Humano",
  curiosity: "Curiosidade",
  calibration: "Calibracao",
  authenticity: "Autenticidade",
  pressureLevel: "Nivel de Pressao",
  awkwardness: "Constrangimento",
  emotionalIntelligence: "Inteligencia Emocional",
  boundaryRespect: "Respeito a Limites",
  conversationalMomentum: "Fluxo da Conversa",
};

// Inverse skills where lower raw value = better
const INVERSE_SKILLS = new Set(["pressureLevel", "awkwardness"]);

const SKILL_KEYS = [
  "confidence",
  "warmth",
  "curiosity",
  "calibration",
  "authenticity",
  "pressureLevel",
  "awkwardness",
  "emotionalIntelligence",
  "boundaryRespect",
  "conversationalMomentum",
] as const;

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function getBarColor(value: number): string {
  if (value < 40) return "bg-rose-500";
  if (value < 60) return "bg-amber-500";
  if (value < 80) return "bg-emerald-500";
  return "bg-sky-500";
}

function getBarGlow(value: number): string {
  if (value < 40) return "shadow-rose-500/30";
  if (value < 60) return "shadow-amber-500/30";
  if (value < 80) return "shadow-emerald-500/30";
  return "shadow-sky-500/30";
}

function getScoreColor(value: number): string {
  if (value < 40) return "text-rose-400";
  if (value < 60) return "text-amber-400";
  if (value < 80) return "text-emerald-400";
  return "text-sky-400";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProgressDashboard({ progress, skills }: ProgressDashboardProps) {
  const xpPercent = progress.xpToNextLevel > 0
    ? Math.min(100, Math.round((progress.xp / progress.xpToNextLevel) * 100))
    : 100;

  return (
    <div className="space-y-6">
      {/* ---------- Level + XP Section ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl border border-base-500/40 bg-base-800/85 backdrop-blur-md p-5"
      >
        <div className="flex items-center gap-4">
          {/* Level badge */}
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-mira-500 to-mira-400 shadow-lg shadow-mira-500/30">
            <div className="absolute inset-0 rounded-full animate-pulse-glow" style={{ "--agent-glow": "rgba(99,102,241,0.35)" } as React.CSSProperties} />
            <span className="font-display text-2xl font-bold text-white">{progress.level}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-semibold text-base-50">
                Nivel {progress.level}
              </h2>
              {progress.streakDays > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/25">
                  <Flame size={12} />
                  {progress.streakDays} {progress.streakDays === 1 ? "dia" : "dias"}
                </span>
              )}
            </div>

            {/* XP bar */}
            <div className="mt-2">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-base-300">{progress.xp} / {progress.xpToNextLevel} XP</span>
                <span className="text-base-400">{xpPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-base-600/60 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-mira-500 to-mira-400 shadow-[0_0_8px_rgba(99,102,241,0.3)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ---------- Skills Section ---------- */}
      {skills && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-xl border border-base-500/40 bg-base-800/85 backdrop-blur-md p-5"
        >
          {/* Overall score */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-base-400">
              Habilidades
            </h3>
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-amber-400" />
              <span className={`font-display text-xl font-bold ${getScoreColor(skills.overallScore)}`}>
                {Math.round(skills.overallScore)}
              </span>
              <span className="text-xs text-base-400">geral</span>
            </div>
          </div>

          {/* Skill bars */}
          <div className="space-y-3">
            {SKILL_KEYS.map((key, i) => {
              const rawValue = skills[key];
              const isInverse = INVERSE_SKILLS.has(key);
              const displayValue = isInverse ? 100 - rawValue : rawValue;
              const roundedDisplay = Math.round(displayValue);
              const roundedRaw = Math.round(rawValue);

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + i * 0.03 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-base-200">{SKILL_LABELS[key]}</span>
                    <span className={`text-xs font-medium ${getScoreColor(roundedDisplay)}`}>
                      {roundedRaw}
                      {isInverse && (
                        <span className="ml-1 text-[10px] text-base-400">
                          ({roundedDisplay} efetivo)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-base-600/60 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${getBarColor(roundedDisplay)} shadow-sm ${getBarGlow(roundedDisplay)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${roundedDisplay}%` }}
                      transition={{ duration: 0.6, delay: 0.2 + i * 0.03, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ---------- Stats Grid ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-2 gap-3"
      >
        <StatCard
          icon={<MessageCircle size={18} className="text-mira-400" />}
          value={progress.totalSessions}
          label="Sessoes"
          delay={0.25}
        />
        <StatCard
          icon={<Target size={18} className="text-emerald-400" />}
          value={progress.scenariosCompleted}
          label="Cenarios"
          delay={0.3}
        />
        <StatCard
          icon={<Flame size={18} className="text-amber-400" />}
          value={progress.streakDays}
          label="Sequencia"
          delay={0.35}
        />
        <StatCard
          icon={<TrendingUp size={18} className="text-sky-400" />}
          value={skills ? Math.round(skills.overallScore) : 0}
          label="Score Geral"
          delay={0.4}
        />
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatCard sub-component
// ---------------------------------------------------------------------------

function StatCard({
  icon,
  value,
  label,
  delay,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className="rounded-xl surface-1 p-4 flex flex-col items-center gap-1.5"
    >
      {icon}
      <span className="font-display text-xl font-bold text-base-50">{value}</span>
      <span className="text-[11px] text-base-400 tracking-wide">{label}</span>
    </motion.div>
  );
}
