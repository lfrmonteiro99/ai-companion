import { prisma } from "@/lib/prisma";
import { getAgent } from "@/lib/agents";
import { generateChatResponse } from "./llm";
import { buildSystemPrompt } from "./prompt-builder";
import { retrieveMemories } from "./memory";

interface InitiativeTrigger {
  type: string;
  reason: string;
}

const INITIATIVE_TEMPLATES: Record<string, string> = {
  check_in: "You haven't heard from the user in a while. Send a brief, in-character message checking in. Keep it natural — 1-2 sentences max.",
  provocation: "You've been thinking about something the user said before. Reference it and provoke a response. Stay in character.",
  curiosity: "Something reminded you of your conversations. Share a thought or ask a question that shows you've been thinking about them.",
  mystery: "Send a cryptic, intriguing one-liner that makes the user want to respond. No context needed.",
  playful_poke: "Send a spontaneous, fun, playful message to get the user's attention. Be yourself.",
  unresolved_thread: "There's something unresolved between you and the user. Bring it up naturally.",
};

const AGENT_INITIATIVE_STYLES: Record<string, string[]> = {
  dominant_teasing: ["provocation", "mystery"],
  soft_affectionate: ["check_in", "curiosity"],
  reserved_intellectual: ["curiosity", "unresolved_thread"],
  mysterious_enigmatic: ["mystery", "curiosity"],
  playful_chaotic: ["playful_poke", "check_in"],
};

/**
 * Check if an initiative message should be sent for a given user-agent pair.
 */
export function checkInitiativeTrigger(
  hoursSinceLastInteraction: number,
  stage: number,
  attachment: number,
  agentArchetype: string,
): InitiativeTrigger | null {
  // Minimum time gap before initiative (varies by personality)
  const isEager = ["playful_chaotic", "soft_affectionate"].includes(agentArchetype);
  const minHours = isEager ? 12 : 24;

  if (hoursSinceLastInteraction < minHours) return null;

  // Must have at least stage 1 for initiative
  if (stage < 1) return null;

  // Higher attachment = more likely to reach out
  const attachmentThreshold = isEager ? 20 : 40;
  if (attachment < attachmentThreshold && hoursSinceLastInteraction < 48) return null;

  // Select initiative type based on agent personality
  const styles = AGENT_INITIATIVE_STYLES[agentArchetype] || ["check_in"];
  const type = styles[Math.floor(Math.random() * styles.length)];

  return {
    type,
    reason: `${hoursSinceLastInteraction.toFixed(0)}h since last interaction, stage ${stage}, attachment ${attachment}`,
  };
}

/**
 * Generate and store an initiative message from an agent.
 */
export async function generateInitiativeMessage(
  userId: string,
  agentId: string,
  initiativeType: string,
): Promise<string | null> {
  const agent = getAgent(agentId);
  if (!agent) return null;

  const state = await prisma.relationshipState.findUnique({
    where: { userId_agentId: { userId, agentId } },
  });
  if (!state) return null;

  const memories = await retrieveMemories(userId, agentId, agent, 5);
  const systemPrompt = buildSystemPrompt(agent, state, memories);

  const initiativeInstruction = INITIATIVE_TEMPLATES[initiativeType] || INITIATIVE_TEMPLATES.check_in;

  const message = await generateChatResponse({
    systemPrompt,
    messages: [
      { role: "user", content: `[SYSTEM: ${initiativeInstruction}]` },
    ],
    temperature: 0.9,
    maxTokens: 150,
  });

  if (!message) return null;

  // Store in practice conversation
  const existing = await prisma.conversation.findFirst({
    where: { userId, agentId, mode: "practice" },
  });
  const conversation = existing || await prisma.conversation.create({
    data: { userId, agentId, mode: "practice" },
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderRole: "assistant",
      content: message,
    },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId,
      agentId,
      type: "initiative_message",
      title: agent.name,
      body: message.length > 100 ? message.slice(0, 97) + "..." : message,
    },
  });

  return message;
}

/**
 * Check if current time is within user's quiet hours.
 */
export function isQuietHours(quietStart: string, quietEnd: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = quietStart.split(":").map(Number);
  const [endH, endM] = quietEnd.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  // Crosses midnight (e.g., 23:00 - 08:00)
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}
