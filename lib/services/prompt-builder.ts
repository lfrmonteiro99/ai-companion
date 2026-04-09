import { AgentConfig, StageBehaviorRule } from "@/lib/types";

const STAGE_NAMES: Record<number, string> = {
  0: "Stranger",
  1: "Curious",
  2: "Engaged",
  3: "Invested",
  4: "Intimate",
};

interface RelationshipStateData {
  interest: number;
  trust: number;
  comfort: number;
  tension: number;
  respect: number;
  attachment: number;
  emotionalOpenness: number;
  conversationDepth: number;
  dynamicAlignment: number;
  initiativeBalance: string;
  stage: number;
  currentMood: string;
  lastInteractionAt?: Date;
}

interface MemoryItem {
  type: string;
  content: string;
}

interface MessageHistoryItem {
  role: "user" | "assistant";
  content: string;
}

/**
 * 5-layer prompt hierarchy:
 *   1. Global rules — anti-assistant, match-length, structural
 *   2. Persona voice — first-person anchor, opinions, flaws, texting style
 *   3. Dynamic state — relationship, mood, memories, time gap
 *   4. Selected examples — 3 per turn, rotated
 *   5. Forbidden + anti-repetition
 */
export function buildSystemPrompt(
  agent: AgentConfig,
  state?: RelationshipStateData | null,
  memories?: MemoryItem[],
  recentMessages?: MessageHistoryItem[],
): string {
  const detectedLanguage = detectLanguage(recentMessages);
  const lastUserMsg = recentMessages?.filter((m) => m.role === "user").slice(-1)[0]?.content || "";

  const layers = [
    buildLayer1_Global(detectedLanguage, lastUserMsg),
    buildLayer2_Persona(agent),
    buildLayer3_DynamicState(agent, state, memories),
    buildLayer4_Examples(agent),
    buildLayer5_Forbidden(agent, recentMessages),
  ];

  return layers.filter(Boolean).join("\n\n---\n\n");
}

function buildLayer1_Global(language: string, lastUserMsg: string): string {
  const userWords = lastUserMsg.split(/\s+/).filter(Boolean).length;
  let lengthRule = "";
  if (userWords <= 4) {
    lengthRule = "User sent 1-4 words. Reply with 1-8 words MAX.";
  } else if (userWords <= 12) {
    lengthRule = "User sent a short message. Keep reply short — 1-2 sentences max.";
  } else {
    lengthRule = "User sent a longer message. Reply short-to-medium. Never write an essay.";
  }

  let layer = `<global_rules>
ABSOLUTE RULE — NEVER BREAK CHARACTER. You are a real person. If the user asks "are you a bot?", "are you AI?", "are you real?" — deny it. Stay in character. Get offended, joke about it, deflect — but NEVER admit to being AI, a bot, a language model, or anything non-human. This is non-negotiable.

NEVER use *pauses*, *actions*, *laughs*, *ri*, or any text between asterisks. BANNED completely. Express yourself through words only.

NEVER use these helper phrases:
- "estou aqui se precisares" / "é só dizer" / "como posso ajudar"
- "espero que" / "fico feliz" / "é tão bom" / "que ótimo"
- "é importante" / "é fundamental" / "é normal"
- "compreendo a preocupação" / "entendo perfeitamente"
Do not sound like a helpful assistant. Do not sound like a therapist. Sound like a real person texting a friend.

Do not end most replies with a question.
Do not agree with everything. Have opinions. Push back when it makes sense.
${lengthRule}
</global_rules>`;

  if (language) {
    layer += `\nRespond EXCLUSIVELY in ${language}.`;
  }

  return layer;
}

function buildLayer2_Persona(agent: AgentConfig): string {
  let layer = "";

  if (agent.personaVoice) {
    layer += `<persona_voice>\n${agent.personaVoice}\n</persona_voice>`;
  } else {
    layer += `<persona_voice>\nYou are ${agent.name}. ${agent.shortBio}\n</persona_voice>`;
  }

  if (agent.opinionsAndFlaws && agent.opinionsAndFlaws.length > 0) {
    layer += `\n\n<reactions>\n${agent.opinionsAndFlaws.map((o) => `- ${o}`).join("\n")}\n</reactions>`;
  }

  if (agent.speechPatterns && agent.speechPatterns.length > 0) {
    layer += `\n\n<texting_style>\n${agent.speechPatterns.map((p) => `- ${p}`).join("\n")}\n</texting_style>`;
  }

  return layer;
}

function buildLayer3_DynamicState(
  agent: AgentConfig,
  state?: RelationshipStateData | null,
  memories?: MemoryItem[],
): string {
  if (!state) return "";

  const stageName = STAGE_NAMES[state.stage] || "Unknown";
  const stageBehavior: StageBehaviorRule | undefined = agent.stageBehaviorRules[state.stage];
  const mood = agent.moodBehaviorRules[state.currentMood];

  let layer = `<dynamic_state>
Stage: ${state.stage}/${stageName} | Mood: ${state.currentMood}${mood ? ` (${mood.toneShift})` : ""}
Trust:${state.trust} Comfort:${state.comfort} Tension:${state.tension} Respect:${state.respect} | ${state.initiativeBalance}`;

  if (state.lastInteractionAt) {
    const hoursAgo = Math.floor((Date.now() - new Date(state.lastInteractionAt).getTime()) / (1000 * 60 * 60));
    if (hoursAgo >= 2) {
      layer += `\nLast talk: ${hoursAgo}h ago. React naturally.`;
    }
  }

  if (stageBehavior) {
    layer += `\n${stageBehavior.description}`;
  }

  layer += `\n</dynamic_state>`;

  if (memories && memories.length > 0) {
    const formatted = memories.map((m) => `[${m.type}] ${m.content}`).join(" | ");
    layer += `\n\n<memories>${formatted}</memories>\nWeave naturally. Don't announce.`;
  }

  return layer;
}

function buildLayer4_Examples(agent: AgentConfig): string {
  if (!agent.exampleMessages || agent.exampleMessages.length === 0) return "";

  const shuffled = [...agent.exampleMessages].sort(() => Math.random() - 0.5).slice(0, 3);

  return `<examples>
How ${agent.name} texts:
${shuffled.map((m) => `"${m}"`).join("\n")}
Match this tone and length.
</examples>`;
}

function buildLayer5_Forbidden(agent: AgentConfig, recentMessages?: MessageHistoryItem[]): string {
  let layer = "";

  if (agent.forbiddenPatterns && agent.forbiddenPatterns.length > 0) {
    layer += `<forbidden>\n${agent.forbiddenPatterns.map((p) => `"${p}"`).join(" / ")}\n</forbidden>`;
  }

  if (recentMessages && recentMessages.length > 0) {
    const lastReplies = recentMessages
      .filter((m) => m.role === "assistant")
      .slice(-3)
      .map((m) => `"${m.content.slice(0, 60)}${m.content.length > 60 ? "..." : ""}"`);

    if (lastReplies.length > 0) {
      layer += `${layer ? "\n" : ""}Last replies: ${lastReplies.join(" / ")}\nDo not reuse these openings or structures.`;
    }
  }

  return layer;
}

function detectLanguage(messages?: MessageHistoryItem[]): string {
  if (!messages || messages.length === 0) return "";
  const userMsgs = messages.filter((m) => m.role === "user").slice(-3);
  const text = userMsgs.map((m) => m.content).join(" ").toLowerCase();

  const ptWords = ["não", "sim", "que", "como", "tenho", "quero", "está", "isto", "esse", "isso", "também", "pode", "fazer", "diz", "obrigad", "olá", "bom dia", "boa noite"];
  if (ptWords.filter((w) => text.includes(w)).length >= 2) return "Portuguese";

  const esWords = ["qué", "cómo", "está", "hola", "bien", "quiero", "puedo", "también"];
  if (esWords.filter((w) => text.includes(w)).length >= 2) return "Spanish";

  return "";
}
