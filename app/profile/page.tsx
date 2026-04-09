import { redirect } from "next/navigation";
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

  // Fetch all relationship states for this user
  const states = await prisma.relationshipState.findMany({
    where: { userId: user.id },
  });

  // Fetch conversation stats
  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    include: { _count: { select: { messages: true } } },
  });

  // Fetch total milestones
  const milestoneCount = await prisma.milestone.count({
    where: { userId: user.id },
  });

  // Fetch total memories
  const memoryCount = await prisma.memory.count({
    where: { userId: user.id },
  });

  // Build agent stats
  const agentStats = agents.map((agent) => {
    const state = states.find((s) => s.agentId === agent.id);
    const conv = conversations.find((c) => c.agentId === agent.id);
    return {
      id: agent.id,
      name: agent.name,
      archetype: agent.archetype,
      stage: state?.stage ?? null,
      messageCount: conv?._count.messages ?? 0,
      lastInteraction: state?.lastInteractionAt ?? null,
    };
  });

  const activeAgents = agentStats.filter((a) => a.messageCount > 0);
  const totalMessages = agentStats.reduce((sum, a) => sum + a.messageCount, 0);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {/* User Info */}
      <div className="mb-8 flex items-start gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold"
          style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
        >
          {(user.displayName || user.email || "?")[0].toUpperCase()}
        </div>
        <div>
          {user.displayName && (
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{user.displayName}</h1>
          )}
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{user.email}</p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>
            Member since {user.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Profile Editor */}
      <ProfileEditor
        userId={user.id}
        initialDisplayName={user.displayName || ""}
        initialBio={user.bio || ""}
        initialInterests={user.interests || []}
      />

      {/* Stats Overview */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Overview
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Companions", value: activeAgents.length },
            { label: "Messages", value: totalMessages },
            { label: "Milestones", value: milestoneCount },
            { label: "Memories", value: memoryCount },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg p-4 text-center" style={{ backgroundColor: "var(--bg-secondary)" }}>
              <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{stat.value}</div>
              <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Agent Relationships */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Your Companions
        </h2>
        <div className="space-y-2">
          {agentStats.map((agent) => (
            <a
              key={agent.id}
              href={agent.messageCount > 0 ? `/agents/${agent.id}` : `/chat/${agent.id}`}
              className="flex items-center justify-between rounded-lg p-3 transition hover:opacity-80"
              style={{ backgroundColor: "var(--bg-secondary)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                  style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                >
                  {agent.name[0]}
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{agent.name}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {agent.archetype.replace(/_/g, " ")}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {agent.stage !== null ? (
                  <>
                    <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {STAGE_NAMES[agent.stage] || "Stranger"}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-faint)" }}>
                      {agent.messageCount} messages
                    </div>
                  </>
                ) : (
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>Not started</span>
                )}
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Delete Account */}
      <section className="border-t pt-8" style={{ borderColor: "var(--border-color)" }}>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-red-500">Danger Zone</h2>
        <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <DeleteAccountButton userId={user.id} />
      </section>
    </div>
  );
}
