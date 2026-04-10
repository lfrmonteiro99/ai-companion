"use client";

import { motion } from "framer-motion";
import {
  ArrowUp,
  ArrowDown,
  Zap,
  Flame,
  Snowflake,
  Eye,
  EyeOff,
  RotateCcw,
  Target,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import type {
  SessionFeedback as SessionFeedbackType,
  KeyMoment,
} from "@/lib/types";
import MessageAnalysisCard from "./MessageAnalysisCard";

interface SessionFeedbackProps {
  feedback: SessionFeedbackType;
}

// ---------------------------------------------------------------------------
// Skill label map (Portuguese)
// ---------------------------------------------------------------------------
const SKILL_LABELS: Record<string, string> = {
  confidence: "Confianca",
  warmth: "Calor Humano",
  curiosity: "Curiosidade",
  calibration: "Calibracao",
  authenticity: "Autenticidade",
  pressureLevel: "Pressao",
  awkwardness: "Awkwardness",
  emotionalIntelligence: "Inteligencia Emocional",
  boundaryRespect: "Respeito por Limites",
  conversationalMomentum: "Momentum",
};

// Skills where lower = better
const INVERSE_SKILLS = new Set(["pressureLevel", "awkwardness"]);

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------
function scoreColor(score: number, inverse = false): string {
  const effective = inverse ? 100 - score : score;
  if (effective < 40) return "text-red-500";
  if (effective < 60) return "text-amber-500";
  if (effective < 80) return "text-emerald-500";
  return "text-sky-500";
}

function barBg(score: number, inverse = false): string {
  const effective = inverse ? 100 - score : score;
  if (effective < 40) return "bg-red-500";
  if (effective < 60) return "bg-amber-500";
  if (effective < 80) return "bg-emerald-500";
  return "bg-sky-500";
}

function ringStroke(score: number): string {
  if (score < 40) return "stroke-red-500";
  if (score < 60) return "stroke-amber-500";
  if (score < 80) return "stroke-emerald-500";
  return "stroke-sky-500";
}

function ringTrack(): string {
  return "stroke-base-700";
}

// ---------------------------------------------------------------------------
// Key moment icon by type
// ---------------------------------------------------------------------------
const MOMENT_ICONS: Record<string, React.ReactNode> = {
  momentum_loss: <Zap size={16} className="text-amber-500" />,
  too_intense: <Flame size={16} className="text-rose-500" />,
  too_cold: <Snowflake size={16} className="text-sky-400" />,
  good_read: <Eye size={16} className="text-emerald-500" />,
  ignored_signal: <EyeOff size={16} className="text-rose-400" />,
  good_recovery: <RotateCcw size={16} className="text-emerald-400" />,
};

const MOMENT_LABELS: Record<string, string> = {
  momentum_loss: "Perda de Momentum",
  too_intense: "Intenso Demais",
  too_cold: "Frio Demais",
  good_read: "Boa Leitura",
  ignored_signal: "Sinal Ignorado",
  good_recovery: "Boa Recuperacao",
};

// ---------------------------------------------------------------------------
// Circular progress ring
// ---------------------------------------------------------------------------
function ScoreRing({ score }: { score: number }) {
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={ringTrack()}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={ringStroke(score)}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <span
        className={`absolute font-display text-4xl font-bold ${scoreColor(score)}`}
      >
        {score}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single skill bar
// ---------------------------------------------------------------------------
function SkillBar({
  label,
  skillKey,
  score,
  compared,
}: {
  label: string;
  skillKey: string;
  score: number;
  compared?: { improved: string[]; declined: string[]; stable: string[] };
}) {
  const inverse = INVERSE_SKILLS.has(skillKey);
  const displayScore = score;

  // Determine comparison direction
  let comparisonArrow: React.ReactNode = null;
  if (compared) {
    if (compared.improved.includes(skillKey)) {
      comparisonArrow = (
        <ArrowUp size={12} className="text-emerald-500" />
      );
    } else if (compared.declined.includes(skillKey)) {
      comparisonArrow = (
        <ArrowDown size={12} className="text-rose-500" />
      );
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {comparisonArrow}
          <span className="text-xs font-medium text-base-200">{label}</span>
          {inverse && (
            <span className="text-[9px] text-base-500">(menor = melhor)</span>
          )}
        </div>
        <span
          className={`text-xs font-semibold ${scoreColor(displayScore, inverse)}`}
        >
          {displayScore}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-base-700/60">
        <motion.div
          className={`h-full rounded-full ${barBg(displayScore, inverse)}`}
          initial={{ width: 0 }}
          animate={{ width: `${displayScore}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function SessionFeedback({ feedback }: SessionFeedbackProps) {
  const skillEntries = Object.entries(feedback.skills) as [string, number][];
  const topImprovements = feedback.improvements.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Score header */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-4 rounded-xl border border-base-500/40 bg-base-800/85 p-6 backdrop-blur-md"
      >
        <h2 className="text-xs font-semibold uppercase tracking-widest text-base-400">
          Pontuacao Geral
        </h2>
        <ScoreRing score={feedback.overallScore} />
      </motion.section>

      {/* Perception */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md"
      >
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-base-400">
          Percepcao do Personagem
        </h3>
        <p className="text-sm italic leading-relaxed text-base-200">
          &ldquo;{feedback.perception}&rdquo;
        </p>
      </motion.section>

      {/* Summary */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="rounded-xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md"
      >
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-base-400">
          Resumo
        </h3>
        <p className="text-sm leading-relaxed text-base-100">
          {feedback.summary}
        </p>
      </motion.section>

      {/* Next actions first */}
      {topImprovements.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
          className="rounded-xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md"
        >
          <div className="mb-3 flex items-center gap-2">
            <Target size={16} className="text-emerald-400" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-base-400">
              Next Actions
            </h3>
          </div>
          <ul className="space-y-2">
            {topImprovements.map((tip, i) => (
              <li key={i} className="rounded-lg bg-base-700/40 px-3 py-2 text-sm text-base-200">
                {tip}
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      {/* Hint penalty breakdown */}
      {typeof feedback.hintsUsed === "number" && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
          className="rounded-xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md"
        >
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-base-400">
            Impacto das Dicas
          </h3>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p className="text-base-200">Dicas usadas: <span className="font-semibold">{feedback.hintsUsed}</span></p>
            {typeof feedback.directHintUses === "number" && (
              <p className="text-base-200">Dicas usadas sem adaptação: <span className="font-semibold">{feedback.directHintUses}</span></p>
            )}
            <p className="text-base-200">Penalty score: <span className="font-semibold">-{(feedback.hintPenaltyScore ?? 0).toFixed(2)}</span></p>
            {typeof feedback.directHintPenaltyScore === "number" && (
              <p className="text-base-200">Penalty score (uso direto): <span className="font-semibold">-{feedback.directHintPenaltyScore.toFixed(2)}</span></p>
            )}
            <p className="text-base-200">Score bruto: <span className="font-semibold">{feedback.rawOverallScore ?? feedback.overallScore}</span></p>
            <p className="text-base-200">Score final: <span className="font-semibold">{feedback.adjustedOverallScore ?? feedback.overallScore}</span></p>
            {typeof feedback.rawXp === "number" && (
              <p className="text-base-200">XP bruto: <span className="font-semibold">{feedback.rawXp}</span></p>
            )}
            {typeof feedback.adjustedXp === "number" && (
              <p className="text-base-200">XP final: <span className="font-semibold">{feedback.adjustedXp}</span></p>
            )}
            {typeof feedback.directHintPenaltyXp === "number" && (
              <p className="text-base-200">Penalty XP (uso direto): <span className="font-semibold">-{feedback.directHintPenaltyXp}</span></p>
            )}
          </div>
        </motion.section>
      )}

      {/* Skills grid */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md"
      >
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-base-400">
          Habilidades
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {skillEntries.map(([key, value]) => (
            <SkillBar
              key={key}
              label={SKILL_LABELS[key] ?? key}
              skillKey={key}
              score={value}
              compared={feedback.comparedToPrevious}
            />
          ))}
        </div>
      </motion.section>

      {/* Key Moments */}
      {feedback.keyMoments.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="rounded-xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md"
        >
          <div className="mb-4 flex items-center gap-2">
            <Target size={16} className="text-base-400" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-base-400">
              Momentos-chave
            </h3>
          </div>
          <div className="relative space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-base-600/60">
            {feedback.keyMoments.map((moment: KeyMoment, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
                className="flex items-start gap-3"
              >
                <div className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-base-800">
                  {MOMENT_ICONS[moment.type] ?? (
                    <Zap size={16} className="text-base-400" />
                  )}
                </div>
                <div>
                  <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-widest text-base-500">
                    {MOMENT_LABELS[moment.type] ?? moment.type}
                  </span>
                  <p className="text-sm leading-relaxed text-base-200">
                    {moment.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Message Analysis */}
      {feedback.messageAnalysis.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-base-400" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-base-400">
              Analise por Mensagem
            </h3>
          </div>
          <div className="space-y-2">
            {feedback.messageAnalysis.map((msg, i) => (
              <MessageAnalysisCard key={i} analysis={msg} index={i} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Full improvements list */}
      {feedback.improvements.length > 3 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="rounded-xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md"
        >
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb size={16} className="text-amber-400" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-base-400">
              Como Melhorar
            </h3>
          </div>
          <ol className="space-y-3">
            {feedback.improvements.slice(3).map((tip, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: 0.4 + i * 0.06 }}
                className="flex items-start gap-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-400">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-base-200">{tip}</p>
              </motion.li>
            ))}
          </ol>
        </motion.section>
      )}
    </div>
  );
}
