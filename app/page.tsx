import AgentCard from "./components/AgentCard";
import { getAllAgents } from "@/lib/agents";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/supabase/server";

export default async function Home() {
  const agents = getAllAgents();
  const authUser = await getAuthUser();

  // Fetch relationship stages for authenticated user
  let stages: Record<string, number> = {};
  if (authUser) {
    const user = await prisma.user.findUnique({ where: { authId: authUser.id } });
    if (user) {
      const states = await prisma.relationshipState.findMany({
        where: { userId: user.id },
        select: { agentId: true, stage: true },
      });
      stages = Object.fromEntries(states.map((s) => [s.agentId, s.stage]));
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-2 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Choose Your Companion</h1>
      <p className="mb-8" style={{ color: "var(--text-muted)" }}>Each personality is distinct. Who catches your attention?</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            id={agent.id}
            name={agent.name}
            shortBio={agent.shortBio}
            archetype={agent.archetype}
            vibeTags={agent.vibeTags}
            stage={stages[agent.id] ?? null}
          />
        ))}
      </div>
    </div>
  );
}
