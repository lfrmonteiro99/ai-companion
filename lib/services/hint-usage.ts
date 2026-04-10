import { prisma } from "@/lib/prisma";

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSimilarity(a: string, b: string): number {
  const aTokens = normalize(a).split(" ").filter(Boolean);
  const bTokens = normalize(b).split(" ").filter(Boolean);
  if (!aTokens.length || !bTokens.length) return 0;
  const bSet = new Set(bTokens);
  let overlap = 0;
  for (const token of aTokens) {
    if (bSet.has(token)) overlap += 1;
  }
  return overlap / Math.max(aTokens.length, bTokens.length);
}

function isDirectHintUsage(message: string, suggestions: string[]): boolean {
  const normalizedMessage = normalize(message);
  if (!normalizedMessage) return false;
  for (const suggestion of suggestions) {
    const normalizedSuggestion = normalize(suggestion);
    if (!normalizedSuggestion) continue;
    if (normalizedMessage === normalizedSuggestion) return true;
    if (tokenSimilarity(normalizedMessage, normalizedSuggestion) >= 0.9) return true;
  }
  return false;
}

function toSessionMeta(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export async function appendHintSuggestions(conversationId: string, suggestions: string[]): Promise<void> {
  if (!suggestions.length) return;
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { sessionMeta: true },
  });
  const meta = toSessionMeta(conversation?.sessionMeta);
  const existing = readStringArray(meta.hintSuggestionHistory);
  const next = [...existing, ...suggestions].slice(-40);
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      sessionMeta: {
        ...meta,
        hintSuggestionHistory: next,
      },
    },
  });
}

export async function trackDirectHintUse(conversationId: string, userMessage: string): Promise<number> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { sessionMeta: true },
  });
  const meta = toSessionMeta(conversation?.sessionMeta);
  const suggestions = readStringArray(meta.hintSuggestionHistory);
  const currentDirect = typeof meta.directHintUses === "number" ? meta.directHintUses : 0;

  if (!suggestions.length || !isDirectHintUsage(userMessage, suggestions)) {
    return currentDirect;
  }

  const nextDirect = currentDirect + 1;
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      sessionMeta: {
        ...meta,
        directHintUses: nextDirect,
      },
    },
  });
  return nextDirect;
}
