import OpenAI from "openai";
import { config } from "@/lib/config";
import { withRetry, isTransientError } from "@/lib/utils/retry";
import { logger } from "@/lib/utils/logger";

const log = logger("llm");
const openai = new OpenAI({ apiKey: config.openaiApiKey });

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Select model based on relationship stage.
 * Stage 0-1: gpt-4o-mini (16x cheaper, sufficient for simple interactions)
 * Stage 2+:  gpt-4o (nuanced personality needed)
 */
function selectModel(stage?: number): string {
  if (stage !== undefined && stage <= 1) return "gpt-4o-mini";
  return config.openaiModel;
}

/**
 * Dynamic max_tokens based on context.
 * Earlier stages = shorter responses. Keeps costs down and feels natural.
 */
function selectMaxTokens(stage?: number): number {
  if (stage !== undefined && stage <= 0) return 200;
  if (stage !== undefined && stage <= 1) return 300;
  return 400;
}

export async function generateChatResponse(params: {
  systemPrompt: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stage?: number;
}): Promise<string> {
  const { systemPrompt, messages, temperature = 0.9, stage } = params;
  const model = selectModel(stage);
  const maxTokens = params.maxTokens || selectMaxTokens(stage);

  return withRetry(
    async () => {
      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature,
        max_tokens: maxTokens,
        frequency_penalty: 0.7,
        presence_penalty: 0.5,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        log.warn("Empty response from OpenAI", { model, stage });
      }
      return content || "";
    },
    { maxAttempts: 3, baseDelayMs: 1000, shouldRetry: isTransientError },
  );
}

export async function generateStructuredOutput(prompt: string): Promise<Record<string, number>> {
  return withRetry(
    async () => {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a JSON-only analysis engine. Return ONLY valid JSON, no markdown, no explanation." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content || "{}";
      return JSON.parse(content);
    },
    { maxAttempts: 3, baseDelayMs: 1000, shouldRetry: isTransientError },
  );
}
