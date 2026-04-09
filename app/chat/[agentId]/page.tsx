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

  // Load existing conversation and messages
  const conversation = await prisma.conversation.findUnique({
    where: { userId_agentId: { userId: user.id, agentId: agent.id } },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } },
  });

  const initialMessages = (conversation?.messages || []).map((m) => ({
    id: m.id,
    senderRole: m.senderRole as "user" | "assistant",
    content: m.content,
  }));

  return (
    <ChatWindow
      agentId={agent.id}
      agentName={agent.name}
      userId={user.id}
      initialMessages={initialMessages}
      conversationId={conversation?.id || null}
      showMilestones={user.showMilestones}
    />
  );
}
