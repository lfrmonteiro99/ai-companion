import { getAuthUser } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/services/auth";
import { getAllAgents } from "@/lib/agents";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";

const AGENT_COLORS: Record<string, string> = {
  valeria: "bg-rose-500",
  luna: "bg-pink-400",
  mira: "bg-indigo-500",
  sable: "bg-violet-500",
  kira: "bg-amber-400",
};

const STAGE_NAMES: Record<number, string> = {
  0: "Desconhecida",
  1: "Curiosa",
  2: "Envolvida",
  3: "Investida",
  4: "Íntima",
};

export default async function AgentsPage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect("/login");

  const user = await getOrCreateUser(authUser);
  const agents = getAllAgents();

  const states = await prisma.relationshipState.findMany({
    where: { userId: user.id },
    select: { agentId: true, stage: true },
  });

  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    select: { agentId: true, _count: { select: { messages: true } } },
  });

  const stateMap = new Map(states.map((s) => [s.agentId, s]));
  const convMap = new Map(conversations.map((c) => [c.agentId, c._count.messages]));

  return (
    <div className="relative min-h-[calc(100vh-73px)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[500px] w-[600px] rounded-full bg-mira-500/[0.06] blur-[120px]" />
        <div className="absolute right-1/4 top-20 h-[400px] w-[500px] rounded-full bg-sable-500/[0.05] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-base-50">Personalidades</h1>
          <p className="mt-1 text-sm text-base-300">
            Cinco personalidades distintas. Cada uma reage de forma diferente ao teu estilo de comunicação.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const state = stateMap.get(agent.id);
            const msgCount = convMap.get(agent.id) ?? 0;
            const color = AGENT_COLORS[agent.id] || "bg-base-500";
            const hasInteraction = msgCount > 0;

            return (
              <a
                key={agent.id}
                href={`/agents/${agent.id}`}
                className="group rounded-2xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-base-300/60 hover:shadow-surface-2"
              >
                <div className="mb-4 flex items-center gap-3">
                  {agent.avatar ? (
                    <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-base-500/30 group-hover:ring-base-400/50 transition-all">
                      <Image src={agent.avatar} alt={agent.name} fill className="object-cover" sizes="56px" />
                    </div>
                  ) : (
                    <div className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-display font-bold text-white ${color}`}>
                      {agent.name[0]}
                    </div>
                  )}
                  <div>
                    <h2 className="font-display text-lg font-semibold text-base-50">{agent.name}</h2>
                    <p className="text-xs text-base-400">{agent.archetype.replace(/_/g, " ")}</p>
                  </div>
                </div>

                <p className="mb-3 text-sm leading-relaxed text-base-300 line-clamp-3">{agent.shortBio}</p>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {agent.vibeTags.slice(0, 4).map((tag) => (
                    <span key={tag} className="rounded-full bg-base-700/80 px-2.5 py-0.5 text-[10px] text-base-400">
                      {tag}
                    </span>
                  ))}
                </div>

                {hasInteraction ? (
                  <div className="flex items-center justify-between border-t border-base-600/40 pt-3 text-xs">
                    <span className="text-base-400">
                      {STAGE_NAMES[state?.stage ?? 0] || "Desconhecida"}
                    </span>
                    <span className="text-base-500">{msgCount} mensagens</span>
                  </div>
                ) : (
                  <div className="border-t border-base-600/40 pt-3">
                    <span className="text-xs text-mira-400 group-hover:text-mira-300 transition-colors">
                      Começar conversa →
                    </span>
                  </div>
                )}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
