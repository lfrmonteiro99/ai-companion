"use client";

interface RecentSessionItem {
  conversationId: string;
  agentName: string;
  mode: string;
  updatedAt: string;
  scenarioTitle: string | null;
  adjustedScore: number | null;
  rawScore: number | null;
  hintsUsed: number;
  directHintUses: number;
  hintPenaltyScore: number;
  hintPenaltyXp: number;
}

interface RecentSessionsPanelProps {
  sessions: RecentSessionItem[];
}

export default function RecentSessionsPanel({ sessions }: RecentSessionsPanelProps) {
  return (
    <section className="rounded-2xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md shadow-surface-1">
      <p className="mb-3 text-xs uppercase tracking-wider text-base-400">Recent Sessions</p>
      {sessions.length === 0 ? (
        <p className="text-sm text-base-300">No sessions yet. Start one to populate your dashboard.</p>
      ) : (
        <div className="space-y-2">
          {sessions.slice(0, 5).map((session) => (
            <div key={session.conversationId} className="rounded-xl border border-base-600/60 bg-base-700/40 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-base-100">
                  {session.agentName} • {session.mode}
                </p>
                <p className="text-xs text-base-300">
                  {new Date(session.updatedAt).toLocaleDateString("en-US")}
                </p>
              </div>
              {session.scenarioTitle && (
                <p className="mt-1 text-xs text-base-300">Scenario: {session.scenarioTitle}</p>
              )}
              <p className="mt-1 text-xs text-base-300">
                Adjusted score: {session.adjustedScore === null ? "--" : Math.round(session.adjustedScore)}
                {" • "}
                Raw score: {session.rawScore === null ? "--" : Math.round(session.rawScore)}
              </p>
              <p className="mt-1 text-xs text-base-400">
                Hints: {session.hintsUsed} (direct: {session.directHintUses}) • Penalty: -
                {session.hintPenaltyScore.toFixed(1)} score / -{session.hintPenaltyXp} XP
              </p>
              <div className="mt-2 flex gap-2 text-xs">
                <a href={`/replay/${session.conversationId}`} className="text-mira-300 hover:text-mira-200">
                  Replay
                </a>
                <a href={`/analysis/${session.conversationId}`} className="text-mira-300 hover:text-mira-200">
                  Analysis
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
