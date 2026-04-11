import { prisma } from "@/lib/prisma";
import { AgentConfig } from "@/lib/types";
import { generateStructuredOutput } from "./llm";
import { logger } from "@/lib/utils/logger";

const log = logger("memory");

interface MemoryCandidate {
  content: string;
  type: string;
  salience: number;
  confidence: number;
  emotionalWeight: number;
}

const VALID_TYPES = ["fact", "preference", "boundary", "milestone", "inside_joke", "relational_pattern", "conflict", "repair"];

/**
 * Extract memories from recent messages using GPT-4o-mini.
 * Called every ~3 turns or when exchange seems significant.
 */
export async function extractMemories(
  userId: string,
  agentId: string,
  recentMessages: { senderRole: string; content: string }[],
  agent: AgentConfig,
): Promise<number> {
  const last6 = recentMessages.slice(-6);
  if (last6.length < 2) return 0;

  const conversation = last6
    .map((m) => `${m.senderRole === "user" ? "User" : agent.name}: ${m.content}`)
    .join("\n");

  const prompt = `Analyze this conversation and extract any memorable information about the user.

Agent personality: ${agent.name} (${agent.archetype})
Memory preferences: ${agent.memoryBias.join(", ")}

Conversation:
${conversation}

Extract memories as a JSON object with a "memories" array. Each memory should have:
- "content": what to remember (1 sentence)
- "type": one of [fact, preference, boundary, milestone, inside_joke, relational_pattern, conflict, repair]
- "salience": importance 0.0-1.0
- "confidence": how sure 0.0-1.0
- "emotionalWeight": emotional significance 0.0-1.0

Only extract genuinely memorable things. If nothing notable, return {"memories":[]}.
Return ONLY valid JSON.`;

  try {
    const result = await generateStructuredOutput(prompt);
    const candidates: MemoryCandidate[] = (result.memories as unknown as MemoryCandidate[]) || [];
    let stored = 0;

    for (const mem of candidates) {
      if (!mem.content || !VALID_TYPES.includes(mem.type)) continue;
      if ((mem.salience || 0) < 0.5 || (mem.confidence || 0) < 0.6) continue;

      // Check for duplicate content using normalized token overlap
      const existing = await findDuplicateMemory(userId, agentId, mem.content);

      if (!existing) {
        await prisma.memory.create({
          data: {
            userId,
            agentId,
            type: mem.type,
            content: mem.content,
            salience: Math.min(1, Math.max(0, mem.salience)),
            confidence: Math.min(1, Math.max(0, mem.confidence)),
            emotionalWeight: Math.min(1, Math.max(0, mem.emotionalWeight || 0)),
          },
        });
        stored++;
      }
    }

    return stored;
  } catch (err) {
    log.error("Memory extraction failed", err, { userId, agentId });
    return 0;
  }
}

/**
 * Improved duplicate detection: normalize text and check token overlap >= 70%.
 * Falls back to substring check for very short memories.
 */
async function findDuplicateMemory(
  userId: string,
  agentId: string,
  content: string,
): Promise<{ id: string } | null> {
  const candidates = await prisma.memory.findMany({
    where: { userId, agentId },
    select: { id: true, content: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const normalizedNew = normalizeForComparison(content);
  const newTokens = normalizedNew.split(" ").filter(Boolean);

  for (const candidate of candidates) {
    const normalizedExisting = normalizeForComparison(candidate.content);

    // Exact match after normalization
    if (normalizedNew === normalizedExisting) return candidate;

    // Token overlap check
    const existingTokens = normalizedExisting.split(" ").filter(Boolean);
    if (newTokens.length === 0 || existingTokens.length === 0) continue;

    const existingSet = new Set(existingTokens);
    let overlap = 0;
    for (const token of newTokens) {
      if (existingSet.has(token)) overlap++;
    }

    const similarity = overlap / Math.max(newTokens.length, existingTokens.length);
    if (similarity >= 0.7) return candidate;
  }

  return null;
}

function normalizeForComparison(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Retrieve relevant memories for prompt injection (Layer C).
 * Combines recency + salience + agent memory bias.
 */
export async function retrieveMemories(
  userId: string,
  agentId: string,
  agent: AgentConfig,
  limit = 10,
): Promise<{ type: string; content: string }[]> {
  // Get recent memories
  const recentMemories = await prisma.memory.findMany({
    where: { userId, agentId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Get high-salience memories of types the agent cares about
  const biasedMemories = await prisma.memory.findMany({
    where: {
      userId,
      agentId,
      type: { in: agent.memoryBias },
    },
    orderBy: { salience: "desc" },
    take: 5,
  });

  // Merge and deduplicate
  const seen = new Set<string>();
  const merged: { type: string; content: string }[] = [];

  for (const mem of [...biasedMemories, ...recentMemories]) {
    if (!seen.has(mem.id)) {
      seen.add(mem.id);
      merged.push({ type: mem.type, content: mem.content });
    }
    if (merged.length >= limit) break;
  }

  return merged;
}
