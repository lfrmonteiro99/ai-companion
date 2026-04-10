"use client";

import { CalendarCheck2 } from "lucide-react";
import type { DashboardAction } from "@/lib/services/dashboard";

interface TodaysPlanProps {
  actions: DashboardAction[];
}

export default function TodaysPlan({ actions }: TodaysPlanProps) {
  return (
    <section className="rounded-2xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md shadow-surface-1">
      <div className="mb-3 flex items-center gap-2">
        <CalendarCheck2 size={16} className="text-mira-300" />
        <p className="text-xs uppercase tracking-wider text-base-400">Today&apos;s Plan</p>
      </div>
      <div className="space-y-2">
        {actions.map((action, index) => (
          <a
            key={action.id}
            href={action.href}
            className="block rounded-xl border border-base-600/60 bg-base-700/40 p-3 transition hover:border-base-500 hover:bg-base-700/70"
          >
            <p className="text-xs text-base-400">Step {index + 1}</p>
            <p className="text-sm font-medium text-base-100">{action.title}</p>
            <p className="mt-0.5 text-xs text-base-300">{action.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
