const STAGE_NAMES: Record<number, string> = {
  0: "Stranger",
  1: "Curious",
  2: "Engaged",
  3: "Invested",
  4: "Intimate",
};

const STAGE_DESCRIPTIONS: Record<number, string> = {
  0: "You haven't broken through yet.",
  1: "She's intrigued — something about you caught her attention.",
  2: "Your conversations have real substance now.",
  3: "She's invested in you. This connection means something to her.",
  4: "Something deeper has unlocked between you two.",
};

interface StateData {
  stage: number;
  trust: number;
  comfort: number;
  tension: number;
  respect: number;
  attachment: number;
  emotionalOpenness: number;
  interest: number;
}

function getNarratives(state: StateData): string[] {
  const narratives: string[] = [];
  if (state.trust >= 60) narratives.push("She trusts you.");
  if (state.comfort >= 60) narratives.push("She feels at ease around you.");
  if (state.tension >= 60) narratives.push("There's real tension between you.");
  if (state.respect >= 60) narratives.push("She respects you.");
  if (state.attachment >= 50) narratives.push("She's becoming attached.");
  if (state.emotionalOpenness >= 50) narratives.push("She's opening up to you.");
  if (state.interest >= 70) narratives.push("You have her full attention.");
  return narratives;
}

export default function RelationshipProgress({ state, agentName }: { state: StateData; agentName: string }) {
  const stageName = STAGE_NAMES[state.stage] || "Unknown";
  const stageDesc = STAGE_DESCRIPTIONS[state.stage] || "";
  const narratives = getNarratives(state);
  const progress = Math.min(100, (state.stage / 4) * 100);

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        Your Relationship with {agentName}
      </h2>
      <div className="rounded-xl p-5" style={{ backgroundColor: "var(--bg-secondary)" }}>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{stageName}</span>
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>Stage {state.stage}/4</span>
        </div>
        <div className="mb-3 h-1.5 rounded-full" style={{ backgroundColor: "var(--bg-tertiary)" }}>
          <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{stageDesc}</p>

        {narratives.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {narratives.map((n) => (
              <p key={n} className="text-sm italic" style={{ color: "var(--text-secondary)" }}>{n}</p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
