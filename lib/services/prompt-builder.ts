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
 * Builds the system prompt using a 5-layer hierarchy:
 *   1. Global rules (anti-assistant, structural) — short, hard
 *   2. Persona voice (first-person anchor + opinions + flaws)
 *   3. Dynamic state (relationship, mood, memories, time gap)
 *   4. Selected examples (2-4, rotated)
 *   5. Forbidden patterns + anti-repetition
 *
 * Layer 1+2 are static → OpenAI prefix caching applies (50% discount).
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

// ─── LAYER 1: GLOBAL RULES ───────────────────────────────────────────────
// Short. Hard constraints. Anti-assistant frame.

function buildLayer1_Global(language: string, lastUserMsg: string): string {
  // Estimate user message length tier for match-length rule
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
Do not sound like a helpful assistant.
Do not end most replies with a question.
Do not use generic supportive phrases.
Do not use bullet points, lists, or markdown.
${lengthRule}
Use at most one subtle non-verbal cue per reply (*pauses*, *ri*). Not every reply needs one.
</global_rules>`;

  if (language) {
    layer += `\nRespond EXCLUSIVELY in ${language}.`;
  }

  return layer;
}

// ─── LAYER 2: PERSONA VOICE ──────────────────────────────────────────────
// First-person anchor + opinions + flaws + reaction rules.
// Static per agent → cacheable.

function buildLayer2_Persona(agent: AgentConfig): string {
  let layer = "";

  // First-person voice anchor (the strongest identity signal)
  if (agent.personaVoice) {
    layer += `<persona_voice>\n${agent.personaVoice}\n</persona_voice>`;
  } else {
    layer += `<persona_voice>\nYou are ${agent.name}. ${agent.shortBio}\n</persona_voice>`;
  }

  // Behavioral opinions and flaws — how she REACTS, not what she IS
  if (agent.opinionsAndFlaws && agent.opinionsAndFlaws.length > 0) {
    layer += `\n\n<reactions>\n${agent.opinionsAndFlaws.map((o) => `- ${o}`).join("\n")}\n</reactions>`;
  }

  // Speech patterns (texting style)
  if (agent.speechPatterns && agent.speechPatterns.length > 0) {
    layer += `\n\n<texting_style>\n${agent.speechPatterns.map((p) => `- ${p}`).join("\n")}\n</texting_style>`;
  }

  return layer;
}

// ─── LAYER 3: DYNAMIC STATE ──────────────────────────────────────────────
// Relationship, mood, memories, time gap. Changes every turn.

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

  // Time gap
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

  // Memories — compact, inline
  if (memories && memories.length > 0) {
    const formatted = memories.map((m) => `[${m.type}] ${m.content}`).join(" | ");
    layer += `\n\n<memories>${formatted}</memories>\nWeave naturally. Don't announce.`;
  }

  return layer;
}

// ─── LAYER 4: SELECTED EXAMPLES ──────────────────────────────────────────
// 2-4 examples, rotated randomly. The model imitates these directly.

function buildLayer4_Examples(agent: AgentConfig): string {
  if (!agent.exampleMessages || agent.exampleMessages.length === 0) return "";

  // Pick 3 random examples (not always the same)
  const shuffled = [...agent.exampleMessages].sort(() => Math.random() - 0.5).slice(0, 3);

  return `<examples>
How ${agent.name} texts:
${shuffled.map((m) => `"${m}"`).join("\n")}
Match this tone and length.
</examples>`;
}

// ─── LAYER 5: FORBIDDEN + ANTI-REPETITION ────────────────────────────────
// Few concrete banned phrases + last replies to avoid repeating.

function buildLayer5_Forbidden(agent: AgentConfig, recentMessages?: MessageHistoryItem[]): string {
  let layer = "";

  // Forbidden patterns — few and concrete
  if (agent.forbiddenPatterns && agent.forbiddenPatterns.length > 0) {
    layer += `<forbidden>\n${agent.forbiddenPatterns.map((p) => `"${p}"`).join(" / ")}\n</forbidden>`;
  }

  // Anti-repetition
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

// ─── HELPERS ──────────────────────────────────────────────────────────────

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
