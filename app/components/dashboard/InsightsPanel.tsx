"use client";

import { Lightbulb } from "lucide-react";

interface InsightsPanelProps {
  insights: string[];
}

export default function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <section className="rounded-2xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md shadow-surface-1">
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb size={16} className="text-amber-300" />
        <p className="text-xs uppercase tracking-wider text-base-400">Insights</p>
      </div>
      <ul className="space-y-2">
        {insights.map((insight) => (
          <li key={insight} className="rounded-lg bg-base-700/50 px-3 py-2 text-sm text-base-200">
            {insight}
          </li>
        ))}
      </ul>
    </section>
  );
}
