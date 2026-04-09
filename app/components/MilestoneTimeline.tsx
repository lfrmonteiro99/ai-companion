interface Milestone {
  type: string;
  label: string;
  createdAt: Date;
}

export default function MilestoneTimeline({ milestones }: { milestones: Milestone[] }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-base-400">
        Milestones
      </h2>
      <div className="relative space-y-3 before:absolute before:left-[3px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--agent-accent)]/20">
        {milestones.map((m, i) => (
          <div key={`${m.type}-${i}`} className="flex items-start gap-3">
            <div className="relative mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--agent-accent)] shadow-[0_0_6px_var(--agent-glow)]" />
            <div>
              <p className="text-sm text-base-100">{m.label}</p>
              <p className="text-[10px] text-base-400">
                {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(m.createdAt))}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
