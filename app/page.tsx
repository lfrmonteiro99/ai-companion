import AgentCard from "./components/AgentCard";
import { getAllAgents } from "@/lib/agents";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/supabase/server";

export default async function Home() {
  const agents = getAllAgents();
  const authUser = await getAuthUser();

  // Fetch relationship stages and unread counts for authenticated user
  let stages: Record<string, number> = {};
  let unreads: Record<string, number> = {};
  if (authUser) {
    const user = await prisma.user.findUnique({ where: { authId: authUser.id } });
    if (user) {
      const [states, notifications] = await Promise.all([
        prisma.relationshipState.findMany({
          where: { userId: user.id },
          select: { agentId: true, stage: true },
        }),
        prisma.notification.groupBy({
          by: ["agentId"],
          where: { userId: user.id, read: false },
          _count: { id: true },
        }),
      ]);
      stages = Object.fromEntries(states.map((s) => [s.agentId, s.stage]));
      unreads = Object.fromEntries(notifications.map((n) => [n.agentId, n._count.id]));
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-73px)] overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[500px] w-[600px] rounded-full bg-mira-500/[0.06] blur-[120px]" />
        <div className="absolute right-1/4 top-20 h-[400px] w-[500px] rounded-full bg-sable-500/[0.05] blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[800px] -translate-x-1/2 rounded-full bg-valeria-500/[0.04] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 py-12">
        {/* Hero */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 font-display text-4xl font-bold italic text-[var(--text-primary)]">
            Choose Your Companion
          </h1>
          <p className="mx-auto max-w-md text-[var(--text-muted)]">
            Five distinct personalities. Each with her own rhythm, standards, and way of connecting. Who catches your attention?
          </p>
        </div>

        {/* Agent grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              id={agent.id}
              name={agent.name}
              shortBio={agent.shortBio}
              archetype={agent.archetype}
              vibeTags={agent.vibeTags}
              avatar={agent.avatar}
              stage={stages[agent.id] ?? null}
              unreadCount={unreads[agent.id] ?? 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
