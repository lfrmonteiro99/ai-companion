import AgentCard from "./components/AgentCard";
import HomeHero from "./components/HomeHero";
import RecentActivity from "./components/RecentActivity";
import { getAllAgents } from "@/lib/agents";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/supabase/server";

export default async function Home() {
  const agents = getAllAgents();
  const authUser = await getAuthUser();

  // Default progress values for unauthenticated users
  let level = 1;
  let xp = 0;
  let xpToNextLevel = 100;
  let streakDays = 0;
  let overallScore: number | null = null;
  let isLoggedIn = false;
  let recentSessions: { agentName: string; mode: string; date: string; score?: number | null }[] = [];

  // Fetch relationship stages and unread counts for authenticated user
  let stages: Record<string, number> = {};
  let unreads: Record<string, number> = {};

  if (authUser) {
    const user = await prisma.user.findUnique({ where: { authId: authUser.id } });
    if (user) {
      isLoggedIn = true;

      const [states, notifications, progress, skillScore, conversations] = await Promise.all([
        prisma.relationshipState.findMany({
          where: { userId: user.id },
          select: { agentId: true, stage: true },
        }),
        prisma.notification.groupBy({
          by: ["agentId"],
          where: { userId: user.id, read: false },
          _count: { id: true },
        }),
        prisma.userProgress.findUnique({
          where: { userId: user.id },
        }),
        prisma.userSkillScore.findUnique({
          where: { userId: user.id },
        }),
        prisma.conversation.findMany({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
          take: 3,
          select: {
            agentId: true,
            mode: true,
            updatedAt: true,
          },
        }),
      ]);

      stages = Object.fromEntries(states.map((s) => [s.agentId, s.stage]));
      unreads = Object.fromEntries(notifications.map((n) => [n.agentId, n._count.id]));

      if (progress) {
        level = progress.level;
        xp = progress.xp;
        xpToNextLevel = progress.xpToNextLevel;
        streakDays = progress.streakDays;
      }

      if (skillScore) {
        overallScore = skillScore.overallScore;
      }

      // Build agent name lookup
      const agentMap = Object.fromEntries(agents.map((a) => [a.id, a.name]));

      recentSessions = conversations.map((c) => ({
        agentName: agentMap[c.agentId] || c.agentId,
        mode: c.mode,
        date: c.updatedAt.toISOString(),
      }));
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
        {isLoggedIn ? (
          <HomeHero
            level={level}
            xp={xp}
            xpToNextLevel={xpToNextLevel}
            streakDays={streakDays}
            overallScore={overallScore}
          />
        ) : (
          <div className="mb-10 text-center">
            <h1 className="mb-3 font-display text-4xl font-bold italic text-base-50">
              Simulador de Conversas
            </h1>
            <p className="mx-auto max-w-md text-base-300">
              Pratica comunicação, confiança e leitura social com perfis interpessoais diferentes num simulador gamificado.
            </p>
          </div>
        )}

        {/* Characters heading */}
        <div className="mb-6 text-center">
          <h2 className="mb-2 font-display text-2xl font-semibold italic text-base-50">
            Escolhe a tua Personagem
          </h2>
          <p className="mx-auto max-w-lg text-sm text-base-300">
            Cinco perfis interpessoais distintos. Cada um com o seu ritmo, estilo e forma de comunicar.
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

        {/* Recent Activity */}
        {isLoggedIn && recentSessions.length > 0 && (
          <RecentActivity sessions={recentSessions} />
        )}
      </div>
    </div>
  );
}
