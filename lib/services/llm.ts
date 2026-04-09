import OpenAI from "openai";
import { config } from "@/lib/config";

const openai = new OpenAI({ apiKey: config.openaiApiKey });

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function generateChatResponse(params: {
  systemPrompt: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const { systemPrompt, messages, temperature = 0.85, maxTokens = 500 } = params;

  const response = await openai.chat.completions.create({
    model: config.openaiModel,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    temperature,
    max_tokens: maxTokens,
    frequency_penalty: 0.7,
    presence_penalty: 0.5,
  });

  return response.choices[0]?.message?.content || "";
}

export async function generateStructuredOutput(prompt: string): Promise<Record<string, number>> {
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
}
