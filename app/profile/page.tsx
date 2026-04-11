import { redirect } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/services/auth";
import { getAllAgents } from "@/lib/agents";
import DeleteAccountButton from "@/app/components/DeleteAccountButton";
import ProfileEditor from "@/app/components/ProfileEditor";

const STAGE_NAMES: Record<number, string> = {
  0: "Stranger",
  1: "Curious",
  2: "Engaged",
  3: "Invested",
  4: "Intimate",
};

export default async function ProfilePage() {
  const authUser = await getAuthUser();
  if (!authUser) redirect("/login");

  const user = await getOrCreateUser(authUser);
  const agents = getAllAgents();

  const states = await prisma.relationshipState.findMany({ where: { userId: user.id } });
  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    include: { _count: { select: { messages: true } } },
  });
  const milestoneCount = await prisma.milestone.count({ where: { userId: user.id } });
  const memoryCount = await prisma.memory.count({ where: { userId: user.id } });

  const agentStats = agents.map((agent) => {
    const state = states.find((s) => s.agentId === agent.id);
    const conv = conversations.find((c) => c.agentId === agent.id);
    return {
      id: agent.id,
      name: agent.name,
      archetype: agent.archetype,
      avatar: agent.avatar,
      stage: state?.stage ?? null,
      messageCount: conv?._count.messages ?? 0,
      lastInteraction: state?.lastInteractionAt ?? null,
    };
  });

  const activeAgents = agentStats.filter((a) => a.messageCount > 0);
  const totalMessages = agentStats.reduce((sum, a) => sum + a.messageCount, 0);

  return (
    <div className="relative min-h-[calc(100vh-73px)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-mira-500/[0.05] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* User Info */}
        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-base-700 ring-2 ring-base-500/30 text-2xl font-display font-bold text-base-200">
            {(user.displayName || user.email || "?")[0].toUpperCase()}
          </div>
          <div>
            {user.displayName && (
              <h1 className="font-display text-xl font-bold text-base-50">{user.displayName}</h1>
            )}
            <p className="text-sm text-base-300">{user.email}</p>
            <p className="mt-1 text-xs text-base-500">
              Member since {user.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <ProfileEditor
          userId={user.id}
          initialDisplayName={user.displayName || ""}
          initialBio={user.bio || ""}
          initialInterests={user.interests || []}
        />

        {/* Stats Overview */}
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-base-400">Overview</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Companions", value: activeAgents.length },
              { label: "Messages", value: totalMessages },
              { label: "Milestones", value: milestoneCount },
              { label: "Memories", value: memoryCount },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl p-4 text-center surface-1">
                <div className="text-2xl font-bold text-base-50">{stat.value}</div>
                <div className="mt-1 text-xs text-base-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Agent Relationships */}
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-base-400">Your Companions</h2>
          <div className="space-y-2">
            {agentStats.map((agent) => (
              <a
                key={agent.id}
                href={agent.messageCount > 0 ? `/agents/${agent.id}` : `/chat/${agent.id}`}
                className="flex items-center justify-between rounded-xl p-3 transition-all hover:-translate-y-0.5 hover:shadow-surface-1 surface-1"
              >
                <div className="flex items-center gap-3">
                  {agent.avatar ? (
                    <div className="relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-base-500/30">
                      <Image src={agent.avatar} alt={agent.name} fill className="object-cover" sizes="40px" />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-base-700 ring-1 ring-base-500/30 text-sm font-bold text-base-200">
                      {agent.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-display font-semibold text-base-100">{agent.name}</div>
                    <div className="text-xs text-base-400">{agent.archetype.replace(/_/g, " ")}</div>
                  </div>
                </div>
                <div className="text-right">
                  {agent.stage !== null ? (
                    <>
                      <div className="text-sm font-medium text-base-100">{STAGE_NAMES[agent.stage] || "Stranger"}</div>
                      <div className="text-xs text-base-500">{agent.messageCount} messages</div>
                    </>
                  ) : (
                    <span className="text-xs text-base-500">Not started</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Danger Zone */}
        <section className="border-t border-base-500/30 pt-8">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-rose-400">Danger Zone</h2>
          <p className="mb-4 text-sm text-base-300">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <DeleteAccountButton userId={user.id} />
        </section>
      </div>
    </div>
  );
}
