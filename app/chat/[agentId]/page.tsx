import { notFound, redirect } from "next/navigation";
import { getAgent } from "@/lib/agents";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/services/auth";
import ChatWindow from "@/app/components/ChatWindow";

interface ChatPageProps {
  params: { agentId: string };
  searchParams: { mode?: string; scenarioId?: string; attemptId?: string };
}

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const agent = getAgent(params.agentId);
  if (!agent) notFound();

  const authUser = await getAuthUser();
  if (!authUser) redirect("/login");

  const user = await getOrCreateUser(authUser);

  const mode = searchParams.mode || "practice";
  const scenarioId = searchParams.scenarioId;
  const attemptId = searchParams.attemptId;

  // Load scenario data if in scenario/challenge mode
  let scenarioData = null;
  if (scenarioId) {
    scenarioData = await prisma.scenario.findUnique({
      where: { id: scenarioId },
      select: { id: true, title: true, objective: true, maxMessages: true, timeLimit: true },
    });
  }

  // Load conversation — scenario mode creates fresh conversations, practice uses existing
  let conversation;
  let initialMessages: { id: string; senderRole: "user" | "assistant"; content: string; createdAt: string }[] = [];

  if (mode === "scenario" || mode === "challenge") {
    // For scenario mode, find the conversation linked to the attempt
    if (attemptId) {
      const attempt = await prisma.scenarioAttempt.findUnique({
        where: { id: attemptId },
        select: { conversationId: true },
      });
      if (attempt) {
        conversation = await prisma.conversation.findUnique({
          where: { id: attempt.conversationId },
        });
      }
    }
  } else {
    // Practice mode: one conversation per user-agent pair
    conversation = await prisma.conversation.findUnique({
      where: { userId_agentId: { userId: user.id, agentId: agent.id } },
    });
  }

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
      openers={mode === "practice" ? agent.openers : undefined}
      openerChance={mode === "practice" ? agent.openerChance : 0}
      userProfile={{
        displayName: user.displayName || undefined,
        bio: user.bio || undefined,
        interests: user.interests || [],
      }}
      mode={mode}
      scenarioData={scenarioData}
      attemptId={attemptId}
    />
  );
}
