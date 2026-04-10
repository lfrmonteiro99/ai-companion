"use client";

import { ArrowRight, PlayCircle } from "lucide-react";

interface ContinueTrainingCardProps {
  title: string;
  subtitle: string;
  href: string;
  updatedAt: string | null;
}

export default function ContinueTrainingCard({
  title,
  subtitle,
  href,
  updatedAt,
}: ContinueTrainingCardProps) {
  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "No previous session";

  return (
    <section className="rounded-2xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md shadow-surface-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-base-400">Continue Training</p>
          <h2 className="font-display text-xl font-semibold text-base-50">{title}</h2>
          <p className="mt-1 text-sm text-base-300">{subtitle}</p>
          <p className="mt-2 text-xs text-base-400">Last activity: {updatedLabel}</p>
        </div>
        <PlayCircle className="mt-1 text-mira-400" size={22} />
      </div>
      <a
        href={href}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-mira-500 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-mira-400"
      >
        Continue now
        <ArrowRight size={14} />
      </a>
    </section>
  );
}
