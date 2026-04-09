interface Milestone {
  type: string;
  label: string;
  createdAt: Date;
}

export default function MilestoneTimeline({ milestones }: { milestones: Milestone[] }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        Milestones
      </h2>
      <div className="space-y-3">
        {milestones.map((m, i) => (
          <div key={`${m.type}-${i}`} className="flex items-start gap-3">
            <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-purple-500" />
            <div>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>{m.label}</p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                {new Date(m.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
