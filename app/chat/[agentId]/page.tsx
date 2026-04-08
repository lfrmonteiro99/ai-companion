import { notFound } from "next/navigation";
import { getAgent } from "@/lib/agents";
import { prisma } from "@/lib/prisma";
import ChatWindow from "@/app/components/ChatWindow";

// Hardcoded test user for MVP — replace with auth later
const TEST_USERNAME = "test-user";

async function getOrCreateTestUser() {
  return prisma.user.upsert({
    where: { username: TEST_USERNAME },
    update: {},
    create: { username: TEST_USERNAME },
  });
}

export default async function ChatPage({
  params,
}: {
  params: { agentId: string };
}) {
  const agent = getAgent(params.agentId);
  if (!agent) notFound();

  const user = await getOrCreateTestUser();

  // Load existing conversation and messages if any
  const conversation = await prisma.conversation.findUnique({
    where: { userId_agentId: { userId: user.id, agentId: agent.id } },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 50,
      },
    },
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
    />
  );
}
