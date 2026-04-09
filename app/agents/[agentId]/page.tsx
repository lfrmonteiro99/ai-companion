import { notFound } from "next/navigation";
import { getAgent } from "@/lib/agents";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/services/auth";
import RelationshipProgress from "@/app/components/RelationshipProgress";
import MilestoneTimeline from "@/app/components/MilestoneTimeline";
import MemoryHighlights from "@/app/components/MemoryHighlights";

const archetypeColors: Record<string, string> = {
  dominant_teasing: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  soft_affectionate: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
  reserved_intellectual: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  mysterious_enigmatic: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  playful_chaotic: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
};

const avatarColors: Record<string, string> = {
  dominant_teasing: "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200",
  soft_affectionate: "bg-pink-200 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  reserved_intellectual: "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  mysterious_enigmatic: "bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  playful_chaotic: "bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
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

  const colorClass = archetypeColors[agent.archetype] || "";
  const avatarClass = avatarColors[agent.archetype] || "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200";

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {/* Hero */}
      <div className="mb-8 flex items-start gap-5">
        {agent.avatar ? (
          <img src={agent.avatar} alt={agent.name} className="h-20 w-20 shrink-0 rounded-full object-cover" />
        ) : (
          <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-3xl font-bold ${avatarClass}`}>
            {agent.name[0]}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{agent.name}</h1>
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${colorClass}`}>
            {agent.archetype.replace(/_/g, " ")}
          </span>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>{agent.shortBio}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {agent.vibeTags.map((tag) => (
              <span key={tag} className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}>
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
              <img key={i} src={img} alt={`${agent.name} ${i + 1}`} className="aspect-square w-full rounded-lg object-cover" />
            ))}
          </div>
        </section>
      )}

      {/* Backstory */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>About</h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{agent.backstory}</p>
      </section>

      {/* Personality */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Personality</h2>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(agent.coreTraits).map(([trait, value]) => (
            <div key={trait} className="rounded-lg p-3" style={{ backgroundColor: "var(--bg-secondary)" }}>
              <div className="mb-1 text-xs capitalize" style={{ color: "var(--text-muted)" }}>{trait.replace(/([A-Z])/g, " $1").trim()}</div>
              <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${(value as number) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Values / Dislikes */}
      <section className="mb-8 grid grid-cols-2 gap-6">
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Values</h2>
          <ul className="space-y-1">
            {agent.interactionPreferences.map((p) => (
              <li key={p} className="text-sm" style={{ color: "var(--text-secondary)" }}>+ {p}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Dislikes</h2>
          <ul className="space-y-1">
            {agent.dislikes.map((d) => (
              <li key={d} className="text-sm" style={{ color: "var(--text-secondary)" }}>- {d}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Relationship (only for authenticated users who have chatted) */}
      {state && (
        <RelationshipProgress state={state} agentName={agent.name} />
      )}

      {milestones.length > 0 && (
        <MilestoneTimeline milestones={milestones} />
      )}

      {memories.length > 0 && userId && (
        <MemoryHighlights memories={memories} userId={userId} agentId={agent.id} />
      )}

      {/* CTA */}
      <div className="mt-8 text-center">
        <a href={`/chat/${agent.id}`} className="inline-block rounded-xl bg-blue-600 px-8 py-3 text-sm font-medium text-white transition hover:bg-blue-500">
          {state ? "Continue Chatting" : "Start Chatting"}
        </a>
      </div>
    </div>
  );
}
