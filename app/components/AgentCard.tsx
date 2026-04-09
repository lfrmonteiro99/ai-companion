"use client";

interface AgentCardProps {
  id: string;
  name: string;
  shortBio: string;
  archetype: string;
}

const archetypeColors: Record<string, string> = {
  dominant_teasing: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  soft_affectionate: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
  reserved_intellectual: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  mysterious_enigmatic: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  playful_chaotic: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
};

export default function AgentCard({ id, name, shortBio, archetype }: AgentCardProps) {
  const colorClass = archetypeColors[archetype] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  const label = archetype.replace(/_/g, " ");

  return (
    <a href={`/chat/${id}`} className="block rounded-xl border p-6 transition hover:shadow-lg" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}>
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
          {name[0]}
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{name}</h2>
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>{label}</span>
        </div>
      </div>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{shortBio}</p>
    </a>
  );
}
