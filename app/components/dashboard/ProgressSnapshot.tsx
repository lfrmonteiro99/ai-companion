"use client";

import { Flame, Target, TrendingUp } from "lucide-react";

interface ProgressSnapshotProps {
  level: number;
  tierLabel: string;
  xp: number;
  xpInCurrentLevel: number;
  xpSpan: number;
  xpPercent: number;
  streakDays: number;
  overallScore: number | null;
  totalSessions: number;
  scenariosCompleted: number;
}

export default function ProgressSnapshot(props: ProgressSnapshotProps) {
  return (
    <section className="rounded-2xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md shadow-surface-1">
      <p className="mb-3 text-xs uppercase tracking-wider text-base-400">Progress Snapshot</p>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-base-700/80 px-2.5 py-1 text-xs text-base-200">
          Level {props.level}
        </span>
        <span className="rounded-full bg-base-700/80 px-2.5 py-1 text-xs text-base-300">
          {props.tierLabel}
        </span>
        <span className="rounded-full bg-base-700/80 px-2.5 py-1 text-xs text-base-300">
          {props.xp} XP total
        </span>
      </div>
      <div className="mb-2 flex items-center justify-between text-xs text-base-300">
        <span>{props.xpInCurrentLevel} / {props.xpSpan} XP</span>
        <span>{props.xpPercent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-base-600/80">
        <div className="h-full rounded-full bg-gradient-to-r from-mira-500 to-mira-300" style={{ width: `${props.xpPercent}%` }} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-base-700/60 p-2 text-base-200">
          <Flame size={14} className="mx-auto mb-1 text-amber-400" />
          {props.streakDays} streak
        </div>
        <div className="rounded-lg bg-base-700/60 p-2 text-base-200">
          <Target size={14} className="mx-auto mb-1 text-emerald-400" />
          {props.scenariosCompleted} scenarios
        </div>
        <div className="rounded-lg bg-base-700/60 p-2 text-base-200">
          <TrendingUp size={14} className="mx-auto mb-1 text-sky-400" />
          {props.overallScore === null ? "--" : Math.round(props.overallScore)}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-base-400">{props.totalSessions} sessions completed</p>
    </section>
  );
}
