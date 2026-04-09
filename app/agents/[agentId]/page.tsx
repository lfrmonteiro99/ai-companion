import { notFound } from "next/navigation";
import Image from "next/image";
import { getAgent } from "@/lib/agents";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/services/auth";
import RelationshipProgress from "@/app/components/RelationshipProgress";
import MilestoneTimeline from "@/app/components/MilestoneTimeline";
import MemoryHighlights from "@/app/components/MemoryHighlights";

const archetypeBadge: Record<string, string> = {
  dominant_teasing: "bg-valeria-500/15 text-valeria-400 ring-1 ring-valeria-500/25",
  soft_affectionate: "bg-luna-500/15 text-luna-400 ring-1 ring-luna-500/25",
  reserved_intellectual: "bg-mira-500/15 text-mira-400 ring-1 ring-mira-500/25",
  mysterious_enigmatic: "bg-sable-500/15 text-sable-400 ring-1 ring-sable-500/25",
  playful_chaotic: "bg-kira-500/15 text-kira-400 ring-1 ring-kira-500/25",
};

const AGENT_THEME: Record<string, string> = {
  valeria: "agent-valeria",
  luna: "agent-luna",
  mira: "agent-mira",
  sable: "agent-sable",
  kira: "agent-kira",
};

export default async function AgentProfilePage({ params }: { params: { agentId: string } }) {
  const agent = getAgent(params.agentId);
  if (!agent) notFound();

  const authUser = await getAuthUser();
  let state = null;
  let milestones: { type: string; label: string; createdAt: Date }[] = [];
  let memories: { id: string; type: string; content: string }[] = [];
  let userId: string | null = null;

  if (authUser) {
    const user = await getOrCreateUser(authUser);
    userId = user.id;
    state = await prisma.relationshipState.findUnique({
      where: { userId_agentId: { userId: user.id, agentId: agent.id } },
    });
    milestones = await prisma.milestone.findMany({
      where: { userId: user.id, agentId: agent.id },
      orderBy: { createdAt: "desc" },
    });
    memories = await prisma.memory.findMany({
      where: { userId: user.id, agentId: agent.id },
      orderBy: { salience: "desc" },
      take: 10,
      select: { id: true, type: true, content: true },
    });
  }

  const badgeClass = archetypeBadge[agent.archetype] || "bg-base-600 text-base-300";
  const themeClass = AGENT_THEME[agent.id] || "";

  return (
    <div className={`relative min-h-[calc(100vh-73px)] ${themeClass}`}>
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[var(--agent-accent)]/[0.08] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-2xl px-6 py-10">
        {/* Hero */}
        <div className="mb-8 flex items-start gap-5">
          {agent.avatar ? (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-[var(--agent-accent)]/30 shadow-[0_0_32px_var(--agent-glow)]">
              <Image src={agent.avatar} alt={agent.name} fill className="object-cover" sizes="80px" />
            </div>
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-base-700 ring-2 ring-[var(--agent-accent)]/30 text-3xl font-display font-bold text-base-100">
              {agent.name[0]}
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold italic text-base-50">{agent.name}</h1>
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase ${badgeClass}`}>
              {agent.archetype.replace(/_/g, " ")}
            </span>
            <p className="mt-2 text-sm leading-relaxed text-base-200">{agent.shortBio}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {agent.vibeTags.map((tag) => (
                <span key={tag} className="rounded-full bg-base-700/80 px-2.5 py-0.5 text-xs font-medium text-base-300">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Photo Gallery */}
        {agent.galleryImages.length > 0 && (
          <section className="mb-8">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {agent.galleryImages.map((img, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl ring-1 ring-base-500/20">
                  <Image src={img} alt={`${agent.name} ${i + 1}`} fill className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Backstory */}
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-base-400">About</h2>
          <p className="text-sm leading-relaxed text-base-200">{agent.backstory}</p>
        </section>

        {/* Personality */}
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-base-400">Personality</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(agent.coreTraits).map(([trait, value]) => (
              <div key={trait} className="rounded-xl p-3 surface-1">
                <div className="mb-1.5 text-xs capitalize text-base-300">{trait.replace(/([A-Z])/g, " $1").trim()}</div>
                <div className="h-1.5 rounded-full bg-base-600/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--agent-accent)] transition-all duration-700 shadow-[0_0_8px_var(--agent-glow)]"
                    style={{ width: `${(value as number) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Values / Dislikes */}
        <section className="mb-8 grid grid-cols-2 gap-6">
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-base-400">Values</h2>
            <ul className="space-y-1.5">
              {agent.interactionPreferences.map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm text-base-200">
                  <span className="font-bold text-emerald-400">+</span> {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-base-400">Dislikes</h2>
            <ul className="space-y-1.5">
              {agent.dislikes.map((d) => (
                <li key={d} className="flex items-center gap-2 text-sm text-base-200">
                  <span className="font-bold text-rose-400">&minus;</span> {d}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Relationship */}
        {state && <RelationshipProgress state={state} agentName={agent.name} />}
        {milestones.length > 0 && <MilestoneTimeline milestones={milestones} />}
        {memories.length > 0 && userId && <MemoryHighlights memories={memories} userId={userId} agentId={agent.id} />}

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <a
            href={`/chat/${agent.id}`}
            className="inline-block rounded-xl bg-[var(--agent-accent)] px-8 py-3 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_24px_var(--agent-glow)]"
          >
            {state ? "Continuar a conversar" : "Começar a conversar"}
          </a>
          <a
            href={`/scenarios?agentId=${agent.id}`}
            className="text-xs font-medium text-base-400 transition-colors hover:text-sky-400"
          >
            Treinar com cenários &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
