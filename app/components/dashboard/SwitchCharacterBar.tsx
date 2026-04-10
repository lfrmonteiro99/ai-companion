"use client";

interface SwitchCharacterItem {
  agentId: string;
  name: string;
  unreadCount: number;
  stage: number | null;
  href: string;
}

interface SwitchCharacterBarProps {
  agents: SwitchCharacterItem[];
}

export default function SwitchCharacterBar({ agents }: SwitchCharacterBarProps) {
  return (
    <section className="rounded-2xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md shadow-surface-1">
      <p className="mb-3 text-xs uppercase tracking-wider text-base-400">Switch Character</p>
      <div className="flex flex-wrap gap-2">
        {agents.map((agent) => (
          <a
            key={agent.agentId}
            href={agent.href}
            className="inline-flex items-center gap-2 rounded-full border border-base-600/70 bg-base-700/40 px-3 py-1.5 text-xs text-base-200 transition hover:border-base-400"
          >
            <span>{agent.name}</span>
            {agent.stage !== null && (
              <span className="rounded-full bg-base-600 px-1.5 py-0.5 text-[10px] text-base-300">
                S{agent.stage}
              </span>
            )}
            {agent.unreadCount > 0 && (
              <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] text-white">
                {agent.unreadCount}
              </span>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
