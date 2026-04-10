"use client";

import { motion } from "framer-motion";
import { Flame, Star, TrendingUp } from "lucide-react";
import { getProfileTier } from "@/lib/utils/profile-tier";

interface HomeHeroProps {
  level: number;
  xp: number;
  xpToNextLevel: number;
  streakDays: number;
  overallScore: number | null;
}

export default function HomeHero({ level, xp, xpToNextLevel, streakDays, overallScore }: HomeHeroProps) {
  const xpProgress = xpToNextLevel > 0 ? Math.min((xp / xpToNextLevel) * 100, 100) : 100;
  const tier = getProfileTier(level);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      className="mb-10 text-center"
    >
      {/* Title */}
      <h1 className="mb-2 font-display text-4xl font-bold italic text-base-50">
        Simulador de Conversas
      </h1>
      <p className="mx-auto mb-6 max-w-md text-base-300">
        Pratica comunicação, confiança e leitura social
      </p>

      {/* Stats bar */}
      <div className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-4">
        {/* Level badge */}
        <div className="flex items-center gap-2 rounded-full border border-base-500/40 bg-base-800/85 px-4 py-2 backdrop-blur-md shadow-surface-1">
          <Star size={14} className="text-amber-400" />
          <span className="text-xs font-semibold text-base-100">Nível {level}</span>
          <span className="text-[10px] text-base-400">• {tier.label}</span>
        </div>

        {/* XP mini-bar */}
        <div className="flex items-center gap-2 rounded-full border border-base-500/40 bg-base-800/85 px-4 py-2 backdrop-blur-md shadow-surface-1">
          <TrendingUp size={14} className="text-mira-400" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-base-300">{xp} XP</span>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-base-600">
              <motion.div
                className="h-full rounded-full bg-mira-400"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Streak */}
        {streakDays > 0 && (
          <div className="flex items-center gap-2 rounded-full border border-base-500/40 bg-base-800/85 px-4 py-2 backdrop-blur-md shadow-surface-1">
            <Flame size={14} className="text-orange-400" />
            <span className="text-xs font-semibold text-base-100">
              {streakDays} {streakDays === 1 ? "dia" : "dias"}
            </span>
          </div>
        )}

        {/* Overall score */}
        {overallScore !== null && (
          <div className="flex items-center gap-2 rounded-full border border-base-500/40 bg-base-800/85 px-4 py-2 backdrop-blur-md shadow-surface-1">
            <span className="text-xs text-base-300">Score</span>
            <span className="text-xs font-semibold text-emerald-400">{Math.round(overallScore)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
