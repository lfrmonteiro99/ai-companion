"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, GraduationCap, ArrowUp, ArrowDown, Minus } from "lucide-react";
import InfoTooltip from "./InfoTooltip";
import type { CoachingFeedback } from "@/lib/types";

interface CoachingSummaryBarProps {
  coachingHistory: CoachingFeedback[];
}

const SKILL_LABELS: Record<string, string> = {
  confidence: "Confiança",
  warmth: "Calor",
  curiosity: "Curiosidade",
  calibration: "Calibração",
  authenticity: "Autenticidade",
  pressureLevel: "Pressão",
  awkwardness: "Desconforto",
  emotionalIntelligence: "Intel. Emocional",
  boundaryRespect: "Limites",
  conversationalMomentum: "Momentum",
};

const SKILL_DESCRIPTIONS: Record<string, string> = {
  confidence: "Quão segura e firme soa a tua mensagem, sem cair em arrogância.",
  warmth: "Quanto calor humano e empatia transmites em vez de soares distante.",
  curiosity: "Se fazes perguntas que mostram interesse genuíno por ela.",
  calibration: "Se ajustas o tom e a profundidade ao momento da conversa.",
  authenticity: "Voz própria — sem soar a script, copy-paste ou clichés.",
  pressureLevel: "Quanta pressão exerces sobre ela. Quanto menos, melhor.",
  awkwardness: "Desconforto que crias na conversa. Quanto menos, melhor.",
  emotionalIntelligence: "Capacidade de ler e responder bem às emoções dela.",
  boundaryRespect: "Respeito pelo ritmo e pelos limites dela.",
  conversationalMomentum: "Capacidade de manter a conversa viva e a fluir.",
};

const INVERSE_SKILLS = new Set(["pressureLevel", "awkwardness"]);

type Trend = "up" | "down" | "flat";

function calcTrend(values: number[]): Trend {
  if (values.length < 4) return "flat";
  const half = Math.max(2, Math.floor(values.length / 2));
  const earlier = values.slice(0, values.length - half);
  const recent = values.slice(values.length - half);
  if (earlier.length === 0) return "flat";
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const diff = avg(recent) - avg(earlier);
  if (diff > 5) return "up";
  if (diff < -5) return "down";
  return "flat";
}

interface SkillRow {
  skill: string;
  label: string;
  description: string;
  score: number;
  displayScore: number;
  isInverse: boolean;
  trend: Trend;
  count: number;
}

function buildVerdict(rows: SkillRow[]): string | null {
  if (rows.length < 2) return null;
  const sorted = [...rows].sort((a, b) => b.displayScore - a.displayScore);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  const gap = top.displayScore - bottom.displayScore;
  const lower = (s: string) => s.toLowerCase();

  if (top.displayScore >= 70 && bottom.displayScore < 50) {
    return `Forte em ${lower(top.label)} (${top.displayScore}). ${top.label === bottom.label ? "" : `${bottom.label} (${bottom.displayScore}) precisa de atenção.`}`;
  }
  if (gap < 12) {
    return `Equilíbrio entre as skills — nada se destaca em força ou fragilidade.`;
  }
  if (bottom.displayScore < 45) {
    return `Atenção a ${lower(bottom.label)} (${bottom.displayScore}) — está a puxar a conversa para baixo.`;
  }
  return `A tua maior força agora é ${lower(top.label)} (${top.displayScore}).`;
}

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "up") {
    return <ArrowUp size={12} className="text-emerald-500" aria-label="A melhorar" />;
  }
  if (trend === "down") {
    return <ArrowDown size={12} className="text-rose-500" aria-label="A piorar" />;
  }
  return <Minus size={12} className="text-base-300" aria-label="Estável" />;
}

function bandColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 45) return "bg-amber-500";
  return "bg-rose-500";
}

function overallScore(rows: SkillRow[]): number | null {
  if (rows.length === 0) return null;
  const sum = rows.reduce((a, r) => a + r.displayScore, 0);
  return Math.round(sum / rows.length);
}

export default function CoachingSummaryBar({ coachingHistory }: CoachingSummaryBarProps) {
  const [expanded, setExpanded] = useState(false);

  if (coachingHistory.length === 0) return null;

  // Aggregate scores and per-skill trend across all coaching feedbacks
  const scoreAcc: Record<string, { total: number; count: number; series: number[] }> = {};
  for (const c of coachingHistory) {
    for (const [skill, score] of Object.entries(c.scores)) {
      if (typeof score !== "number") continue;
      if (!scoreAcc[skill]) scoreAcc[skill] = { total: 0, count: 0, series: [] };
      scoreAcc[skill].total += score;
      scoreAcc[skill].count += 1;
      const display = INVERSE_SKILLS.has(skill) ? 100 - score : score;
      scoreAcc[skill].series.push(display);
    }
  }

  const rows: SkillRow[] = Object.entries(scoreAcc)
    .map(([skill, { total, count, series }]) => {
      const score = Math.round(total / count);
      const isInverse = INVERSE_SKILLS.has(skill);
      return {
        skill,
        label: SKILL_LABELS[skill] || skill,
        description: SKILL_DESCRIPTIONS[skill] || "Skill avaliada pelo coach.",
        score,
        displayScore: isInverse ? 100 - score : score,
        isInverse,
        trend: calcTrend(series),
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const positiveCount = coachingHistory.filter((c) => c.impact === "positive").length;
  const total = coachingHistory.length;
  const verdict = buildVerdict(rows);
  const overall = overallScore(rows);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t border-base-600/40 bg-base-900 shadow-coach-bar"
    >
      {/* Collapsed header — always visible, clearly readable */}
      <div className="flex w-full items-center gap-3 px-4 py-2.5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex flex-1 items-center gap-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-base-400 rounded-md -mx-1 px-1"
          aria-expanded={expanded}
          aria-label="Resumo do coaching"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-base-700">
            <GraduationCap size={13} className="text-base-100" aria-hidden="true" />
          </span>
          <span className="text-xs font-semibold text-base-100">Coach</span>
          {overall !== null && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                overall >= 70
                  ? "bg-emerald-500/15 text-emerald-500"
                  : overall >= 45
                    ? "bg-amber-500/15 text-amber-600"
                    : "bg-rose-500/15 text-rose-500"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${bandColor(overall)}`}
                aria-hidden="true"
              />
              {overall}
            </span>
          )}
          <span className="text-xs text-base-300">
            {positiveCount}/{total} positivas
          </span>
        </button>
        <div className="flex items-center gap-1">
          <InfoTooltip
            label="Como ler o coach"
            align="end"
            content={
              <div className="space-y-1.5">
                <p className="font-semibold text-base-50">Como ler o coach</p>
                <p>
                  Após cada mensagem tua, o coach avalia o impacto e atualiza
                  estas skills. Cada barra é a média da sessão.
                </p>
                <ul className="space-y-0.5 text-base-200">
                  <li>
                    <span className="text-emerald-500">●</span> 70+ — forte
                  </li>
                  <li>
                    <span className="text-amber-500">●</span> 45–69 — a desenvolver
                  </li>
                  <li>
                    <span className="text-rose-500">●</span> abaixo de 45 — precisa atenção
                  </li>
                </ul>
                <p className="text-base-200">
                  As setas comparam as últimas mensagens com o início da sessão.
                </p>
              </div>
            }
          />
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-md p-1 text-base-300 transition-colors hover:bg-base-700 hover:text-base-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-base-400"
            aria-label={expanded ? "Recolher" : "Expandir"}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 px-4 pb-3">
              {verdict && (
                <p className="rounded-lg border border-base-600/40 bg-base-800 px-3 py-2 text-[11px] font-medium leading-snug text-base-100">
                  {verdict}
                </p>
              )}
              <div className="space-y-2">
                {rows.map(({ skill, label, description, displayScore, trend }, index) => (
                  <div key={skill} className="flex items-center gap-2.5">
                    <span className="flex w-28 shrink-0 items-center gap-1 text-[11px] font-medium text-base-200">
                      <span className="truncate">{label}</span>
                      <InfoTooltip
                        label={`O que é ${label}`}
                        size={11}
                        align="start"
                        content={
                          <div className="space-y-1">
                            <p className="font-semibold text-base-50">{label}</p>
                            <p>{description}</p>
                          </div>
                        }
                      />
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-base-700">
                      <motion.div
                        className={`h-full rounded-full ${bandColor(displayScore)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${displayScore}%` }}
                        transition={{ duration: 0.6, delay: index * 0.08, ease: "easeOut" }}
                      />
                    </div>
                    <span className="flex w-12 shrink-0 items-center justify-end gap-1 text-[11px] font-semibold tabular-nums text-base-100">
                      <TrendIcon trend={trend} />
                      <span>{displayScore}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
