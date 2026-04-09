import { notFound, redirect } from "next/navigation";
import { getAgent } from "@/lib/agents";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/services/auth";
import ChatWindow from "@/app/components/ChatWindow";

export default async function ChatPage({ params }: { params: { agentId: string } }) {
  const agent = getAgent(params.agentId);
  if (!agent) notFound();

  // Get authenticated user
  const authUser = await getAuthUser();
  if (!authUser) redirect("/login");

  const user = await getOrCreateUser(authUser);

  // Load existing conversation and last 50 messages (desc + reverse)
  const conversation = await prisma.conversation.findUnique({
    where: { userId_agentId: { userId: user.id, agentId: agent.id } },
  });

  let initialMessages: { id: string; senderRole: "user" | "assistant"; content: string; createdAt: string }[] = [];
  if (conversation) {
    const messagesDesc = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    initialMessages = messagesDesc.reverse().map((m) => ({
      id: m.id,
      senderRole: m.senderRole as "user" | "assistant",
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  return (
    <ChatWindow
      agentId={agent.id}
      agentName={agent.name}
      agentAvatar={agent.avatar}
      userId={user.id}
      initialMessages={initialMessages}
      conversationId={conversation?.id || null}
      showMilestones={user.showMilestones}
      openers={agent.openers}
      openerChance={agent.openerChance}
      userProfile={{
        displayName: user.displayName || undefined,
        bio: user.bio || undefined,
        interests: user.interests || [],
      }}
    />
  );
}
