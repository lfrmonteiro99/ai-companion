"use client";

import { BrainCircuit } from "lucide-react";

interface SkillFocusCardProps {
  label: string;
  score: number | null;
  recommendation: string;
  href: string;
}

export default function SkillFocusCard({ label, score, recommendation, href }: SkillFocusCardProps) {
  return (
    <section className="rounded-2xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md shadow-surface-1">
      <div className="mb-3 flex items-center gap-2">
        <BrainCircuit size={16} className="text-violet-300" />
        <p className="text-xs uppercase tracking-wider text-base-400">Skill Focus</p>
      </div>
      <h3 className="text-lg font-semibold text-base-100">{label}</h3>
      <p className="mt-1 text-xs text-base-300">
        Current effective score: {score === null ? "--" : score}
      </p>
      <p className="mt-3 text-sm text-base-200">{recommendation}</p>
      <a
        href={href}
        className="mt-4 inline-flex rounded-lg bg-base-700 px-3 py-2 text-sm text-base-100 transition hover:bg-base-600"
      >
        Open focused practice
      </a>
    </section>
  );
}
