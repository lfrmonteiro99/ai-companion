"use client";

interface AgentCardProps {
  id: string;
  name: string;
  shortBio: string;
  archetype: string;
  vibeTags: string[];
  stage?: number | null;
  unreadCount?: number;
}

const archetypeColors: Record<string, string> = {
  dominant_teasing: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  soft_affectionate: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
  reserved_intellectual: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  mysterious_enigmatic: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  playful_chaotic: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
};

const STAGE_NAMES: Record<number, string> = { 0: "Stranger", 1: "Curious", 2: "Engaged", 3: "Invested", 4: "Intimate" };

export default function AgentCard({ id, name, shortBio, archetype, vibeTags, stage, unreadCount = 0 }: AgentCardProps) {
  const colorClass = archetypeColors[archetype] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  const label = archetype.replace(/_/g, " ");

  return (
    <div className="rounded-xl border transition hover:shadow-lg" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}>
      <a href={`/agents/${id}`} className="block p-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
              {name[0]}
            </div>
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{name}</h2>
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>{label}</span>
          </div>
        </div>
        <p className="mb-3 text-sm" style={{ color: "var(--text-muted)" }}>{shortBio}</p>
        <div className="flex flex-wrap gap-1.5">
          {vibeTags.map((tag) => (
            <span key={tag} className="rounded-full px-2 py-0.5 text-[10px]" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-faint)" }}>
              {tag}
            </span>
          ))}
        </div>
      </a>
      <div className="flex items-center justify-between border-t px-5 py-3" style={{ borderColor: "var(--border-color)" }}>
        {stage !== null && stage !== undefined ? (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{STAGE_NAMES[stage] || "Stranger"}</span>
        ) : (
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>New</span>
        )}
        <a href={`/chat/${id}`} className="text-xs font-medium text-blue-500 hover:underline">Chat</a>
      </div>
    </div>
  );
}
