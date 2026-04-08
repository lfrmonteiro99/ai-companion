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
  });

  return response.choices[0]?.message?.content || "";
}
