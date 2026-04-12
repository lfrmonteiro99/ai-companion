import OpenAI from "openai";
import { config } from "@/lib/config";
import { withRetry, isTransientError } from "@/lib/utils/retry";
import { logger } from "@/lib/utils/logger";
import type { AgentConfig, CoachingFeedback } from "@/lib/types";

const log = logger("coaching");
const openai = new OpenAI({ apiKey: config.openaiApiKey });

export interface CoachingInput {
  userMessage: string;
  agentReply: string;
  agent: AgentConfig;
  recentMessages: { role: string; content: string }[];
  relationshipState: {
    stage: number;
    currentMood: string;
    trust: number;
    comfort: number;
    tension: number;
    respect: number;
  };
  messageIndex: number;
}

const FALLBACK: CoachingFeedback = {
  impact: "neutral",
  feedback: "Continua a conversa naturalmente.",
  suggestion: null,
  dominantSkill: "calibration",
  scores: {},
};

/**
 * Evaluate a single user message in context and return real-time coaching feedback.
 * Uses gpt-4o-mini with a tight token budget for speed and cost.
 */
export async function evaluateSingleMessage(input: CoachingInput): Promise<CoachingFeedback> {
  const { userMessage, agentReply, agent, recentMessages, relationshipState, messageIndex } = input;

  // Build minimal context from last 4 messages
  const context = recentMessages.slice(-4)
    .map((m) => `${m.role === "user" ? "USER" : agent.name}: ${m.content}`)
    .join("\n");

  const prompt = `Analisa a ÚLTIMA mensagem do utilizador numa conversa simulada e dá feedback em tempo real.

PERSONAGEM: ${agent.name} (${agent.archetype})
- Valoriza: ${agent.interactionPreferences.slice(0, 3).join(", ")}
- Não gosta de: ${agent.dislikes.slice(0, 3).join(", ")}
- Humor: ${agent.humorProfile} | Profundidade: ${agent.depthPreference}

ESTADO: Stage ${relationshipState.stage}, Mood: ${relationshipState.currentMood}
Trust: ${relationshipState.trust}, Comfort: ${relationshipState.comfort}, Tension: ${relationshipState.tension}

CONTEXTO RECENTE:
${context}

ÚLTIMA TROCA:
USER: ${userMessage}
${agent.name}: ${agentReply}

INSTRUÇÕES:
Avalia APENAS a mensagem do USER. Sê conciso e direto.
- impact: "positive" se a mensagem foi bem calibrada, "neutral" se ok mas podia melhorar, "negative" se prejudicou a interação
- feedback: 1 frase curta em Português descrevendo o que foi bom ou mau
- suggestion: se impact != "positive", sugere uma alternativa NATURAL e mais calibrada (1 frase). Se positive, null.
- dominantSkill: a skill mais relevante (confidence, warmth, curiosity, calibration, authenticity, pressureLevel, awkwardness, emotionalIntelligence, boundaryRespect, conversationalMomentum)
- scores: 2-3 skills mais relevantes com score 0-100

Retorna APENAS JSON válido:
{"impact":"...","feedback":"...","suggestion":"..." ou null,"dominantSkill":"...","scores":{"skill":score}}`;

  try {
    return await withRetry(
      async () => {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a JSON-only conversation coaching engine. Return ONLY valid JSON." },
            { role: "user", content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 200,
          response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content) as CoachingFeedback;

        // Validate required fields
        if (!parsed.impact || !parsed.feedback || !parsed.dominantSkill) {
          log.warn("Incomplete coaching response", { messageIndex });
          return FALLBACK;
        }

        // Normalize impact
        if (!["positive", "neutral", "negative"].includes(parsed.impact)) {
          parsed.impact = "neutral";
        }

        return {
          impact: parsed.impact,
          feedback: parsed.feedback,
          suggestion: parsed.suggestion || null,
          dominantSkill: parsed.dominantSkill,
          scores: parsed.scores || {},
        };
      },
      { maxAttempts: 2, baseDelayMs: 500, shouldRetry: isTransientError },
    );
  } catch (error) {
    log.error("Coaching evaluation failed", error, { messageIndex });
    return FALLBACK;
  }
}

/**
 * Determine if a message should be evaluated for coaching.
 * Evaluates every 2nd user message, always the first 2, and skips very short messages.
 */
export function shouldEvaluate(userMessageIndex: number, messageText: string): boolean {
  const wordCount = messageText.trim().split(/\s+/).length;

  // Always evaluate first 2 messages
  if (userMessageIndex < 2) return true;

  // Skip very short messages (< 3 words) unless it's a question
  if (wordCount < 3 && !messageText.includes("?")) return false;

  // Evaluate every 2nd message after that
  return userMessageIndex % 2 === 0;
}
