"use client";

import Image from "next/image";

interface AgentCardProps {
  id: string;
  name: string;
  shortBio: string;
  archetype: string;
  vibeTags: string[];
  avatar?: string;
  stage?: number | null;
  unreadCount?: number;
}

const archetypeBadge: Record<string, string> = {
  dominant_teasing: "bg-valeria-500/15 text-valeria-400 ring-1 ring-valeria-500/25",
  soft_affectionate: "bg-luna-500/15 text-luna-400 ring-1 ring-luna-500/25",
  reserved_intellectual: "bg-mira-500/15 text-mira-400 ring-1 ring-mira-500/25",
  mysterious_enigmatic: "bg-sable-500/15 text-sable-400 ring-1 ring-sable-500/25",
  playful_chaotic: "bg-kira-500/15 text-kira-400 ring-1 ring-kira-500/25",
};

const avatarRing: Record<string, string> = {
  dominant_teasing: "ring-valeria-500/40",
  soft_affectionate: "ring-luna-500/40",
  reserved_intellectual: "ring-mira-500/40",
  mysterious_enigmatic: "ring-sable-500/40",
  playful_chaotic: "ring-kira-500/40",
};

const accentText: Record<string, string> = {
  dominant_teasing: "text-valeria-400",
  soft_affectionate: "text-luna-400",
  reserved_intellectual: "text-mira-400",
  mysterious_enigmatic: "text-sable-400",
  playful_chaotic: "text-kira-400",
};

const STAGE_NAMES: Record<number, string> = { 0: "Stranger", 1: "Curious", 2: "Engaged", 3: "Invested", 4: "Intimate" };

export default function AgentCard({ id, name, shortBio, archetype, vibeTags, avatar, stage, unreadCount = 0 }: AgentCardProps) {
  const badgeClass = archetypeBadge[archetype] || "bg-[var(--bg-elevated)] text-[var(--text-muted)] ring-1 ring-[var(--border)]";
  const label = archetype.replace(/_/g, " ");

  return (
    <div className="group relative rounded-2xl surface-1 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-surface-2">
      <a href={`/agents/${id}`} className="block p-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="relative">
            {avatar ? (
              <div className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ${avatarRing[archetype] || "ring-[var(--border)]"}`}>
                <Image src={avatar} alt={name} fill className="object-cover" sizes="48px" />
              </div>
            ) : (
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--bg-elevated)] ring-2 text-lg font-display font-semibold text-[var(--text-primary)] ${avatarRing[archetype] || "ring-[var(--border)]"}`}>
                {name[0]}
              </div>
            )}
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg shadow-rose-500/30">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold italic text-[var(--text-primary)]">{name}</h2>
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase ${badgeClass}`}>{label}</span>
          </div>
        </div>
        <p className="mb-3 text-sm leading-relaxed text-[var(--text-secondary)]">{shortBio}</p>
        <div className="flex flex-wrap gap-1.5">
          {vibeTags.map((tag) => (
            <span key={tag} className="rounded-full bg-[var(--bg-elevated)] px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-[var(--text-muted)]">
              {tag}
            </span>
          ))}
        </div>
      </a>
      <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3">
        {stage !== null && stage !== undefined ? (
          <span className="rounded-full bg-[var(--bg-elevated)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
            {STAGE_NAMES[stage] || "Stranger"}
          </span>
        ) : (
          <span className="text-xs text-[var(--text-faint)]">New</span>
        )}
        <a href={`/chat/${id}`} className={`text-xs font-semibold tracking-wide transition-colors hover:brightness-125 ${accentText[archetype] || "text-[var(--agent-accent)]"}`}>
          Chat &rarr;
        </a>
      </div>
    </div>
  );
}
