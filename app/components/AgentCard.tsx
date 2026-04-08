"use client";

interface AgentCardProps {
  id: string;
  name: string;
  shortBio: string;
  archetype: string;
}

const archetypeColors: Record<string, string> = {
  dominant_teasing: "bg-red-900/50 text-red-300",
  soft_affectionate: "bg-pink-900/50 text-pink-300",
  reserved_intellectual: "bg-blue-900/50 text-blue-300",
  mysterious_enigmatic: "bg-purple-900/50 text-purple-300",
  playful_chaotic: "bg-amber-900/50 text-amber-300",
};

export default function AgentCard({ id, name, shortBio, archetype }: AgentCardProps) {
  const colorClass = archetypeColors[archetype] || "bg-gray-800 text-gray-300";
  const label = archetype.replace(/_/g, " ");

  return (
    <a
      href={`/chat/${id}`}
      className="block rounded-xl border border-gray-800 bg-gray-900 p-6 transition hover:border-gray-600 hover:bg-gray-800/80"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 text-lg font-bold">
          {name[0]}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">{name}</h2>
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
            {label}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-400">{shortBio}</p>
    </a>
  );
}
