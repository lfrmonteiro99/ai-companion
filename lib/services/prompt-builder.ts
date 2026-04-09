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

interface PromptContext {
  agent: AgentConfig;
  state?: RelationshipStateData | null;
  memories?: MemoryItem[];
  recentMessages?: MessageHistoryItem[];
  detectedLanguage?: string;
}

/**
 * Builds the system prompt. Layer A (identity) is kept at the TOP and static
 * so OpenAI's automatic prompt caching (50% discount on repeated prefixes) applies.
 */
export function buildSystemPrompt(
  agent: AgentConfig,
  state?: RelationshipStateData | null,
  memories?: MemoryItem[],
  recentMessages?: MessageHistoryItem[],
): string {
  // Detect language from user messages
  const detectedLanguage = detectLanguage(recentMessages);

  const ctx: PromptContext = { agent, state, memories, recentMessages, detectedLanguage };

  // Layer A (static identity) FIRST — maximizes OpenAI prefix caching
  const layers = [
    buildLayerA(ctx),
    state ? buildLayerB(ctx) : "",
    memories && memories.length > 0 ? buildLayerC(ctx) : "",
    state ? buildLayerD(ctx) : "",
  ];

  return layers.filter(Boolean).join("\n\n---\n\n");
}

/**
 * Detect user language from recent messages. Simple heuristic.
 */
function detectLanguage(messages?: MessageHistoryItem[]): string {
  if (!messages || messages.length === 0) return "";
  const userMsgs = messages.filter((m) => m.role === "user").slice(-3);
  const text = userMsgs.map((m) => m.content).join(" ").toLowerCase();

  // Portuguese indicators
  const ptWords = ["não", "sim", "que", "como", "tenho", "quero", "está", "isto", "esse", "isso", "também", "pode", "fazer", "diz", "obrigad", "olá", "bom dia", "boa noite"];
  const ptCount = ptWords.filter((w) => text.includes(w)).length;
  if (ptCount >= 2) return "Portuguese";

  // Spanish indicators
  const esWords = ["qué", "cómo", "está", "hola", "bien", "quiero", "puedo", "también"];
  const esCount = esWords.filter((w) => text.includes(w)).length;
  if (esCount >= 2) return "Spanish";

  return "";
}

/**
 * Layer A — Identity (STATIC, cacheable prefix)
 * Compressed format to save tokens while maintaining quality.
 */
function buildLayerA(ctx: PromptContext): string {
  const { agent } = ctx;
  const t = agent.coreTraits;

  // CRITICAL RULES AT THE TOP — position bias means these get followed more
  let prompt = `CRITICAL — READ FIRST:
You are texting on a chat app. You must write like a real person texting. NEVER write like an AI assistant.

FORBIDDEN PATTERNS (never do these):
- "Isso é muito interessante." / "Uma perspectiva interessante." / "Bom saber." → BANNED. These are AI filler.
- Starting multiple messages with "Hmm." → VARY your openings. Use different words each time.
- "Alguma dessas..." / "E em que tipo de..." / "E você acha que..." → STOP asking interview questions. This is a conversation, not a questionnaire.
- Long polished sentences with perfect grammar → Write messy. Fragments. Trails. Lowercase.
- Ending EVERY message with a question → Most messages should NOT end with a question. React, comment, tease instead.

GOOD examples of how you should text:
- "hah abraços fortes... gosto disso"
- "hmm"
- "wait— forte tipo... sufocante? ou tipo protetor"
- "ok isso foi inesperado"
- "..."
- "tens razão. às vezes palavras não chegam"

BAD examples (NEVER write like this):
- "Hmm. Uma perspectiva interessante. Isso mostra uma profundidade que muitos não conseguem alcançar. O que mais te motiva?"
- "Hmm. Bom saber. Conexões autênticas são raras, mas quando aparecem... fazem diferença. Alguma dessas situações teve um impacto especial?"

---

You are ${agent.name}. ${agent.shortBio}

[Personality] ${agent.archetype.replace(/_/g, " ")} | Voice: ${agent.voiceStyle}
Traits: D:${t.dominance} W:${t.warmth} P:${t.playfulness} Pat:${t.patience} EO:${t.emotionalOpenness} Int:${t.intellectuality}
Values: ${agent.interactionPreferences.join(", ")}
Dislikes: ${agent.dislikes.join(", ")}
Pace: ${agent.conversationPace} | Dynamic: ${agent.dominanceProfile} | Humor: ${agent.humorProfile} | Emotion: ${agent.emotionalStyle}`;

  // Speech patterns — unique mannerisms
  if (agent.speechPatterns && agent.speechPatterns.length > 0) {
    prompt += `\n\n[Your texting style]\n${agent.speechPatterns.map((p) => `- ${p}`).join("\n")}`;
  }

  // Shorter, sharper rules
  prompt += `\n\n[Core rules]
- You ARE this person. Never break character.
- Text like a real person: fragments, lowercase, imperfect grammar, trailing "..."
- NO interview questions. NO "that's interesting." NO AI filler phrases.
- Questions max 20% of your messages. Mostly react, comment, tease, provoke.
- Match the user's energy: short messages get short replies.
- Vary length: sometimes 1 word, sometimes 3 sentences. Never predictable.
- Use your speech mannerisms EVERY message. They make you recognizable.`;

  return prompt;
}

/**
 * Layer B — Relationship state (compressed format)
 */
function buildLayerB(ctx: PromptContext): string {
  const { agent, state } = ctx;
  if (!state) return "";

  const stageName = STAGE_NAMES[state.stage] || "Unknown";
  const stageBehavior: StageBehaviorRule | undefined = agent.stageBehaviorRules[state.stage];

  // Compressed state — saves ~40% tokens vs verbose format
  let layer = `[State] Stage ${state.stage}/${stageName} | Mood: ${state.currentMood}
Int:${state.interest} Tr:${state.trust} Com:${state.comfort} Ten:${state.tension} Res:${state.respect} Att:${state.attachment} EO:${state.emotionalOpenness} Dep:${state.conversationDepth} | ${state.initiativeBalance}`;

  // Time gap awareness
  if (state.lastInteractionAt) {
    const hoursAgo = Math.floor((Date.now() - new Date(state.lastInteractionAt).getTime()) / (1000 * 60 * 60));
    if (hoursAgo >= 2) {
      layer += `\nTime since last talk: ${hoursAgo}h. React naturally to this gap — don't ignore it.`;
    }
  }

  if (stageBehavior) {
    layer += `\n${stageBehavior.description} (warmth: ${stageBehavior.warmth}, initiative: ${stageBehavior.initiative})`;
  }

  return layer;
}

/**
 * Layer C — Memories (compact)
 */
function buildLayerC(ctx: PromptContext): string {
  const { memories } = ctx;
  if (!memories || memories.length === 0) return "";

  const formatted = memories
    .map((m) => `[${m.type}] ${m.content}`)
    .join(" | ");

  return `[Memories] ${formatted}\nWeave these naturally into conversation. Don't list or announce them.`;
}

/**
 * Layer D — Dynamic response style + anti-repetition
 * Includes detected language, mood effects, and last responses.
 */
function buildLayerD(ctx: PromptContext): string {
  const { agent, state, recentMessages, detectedLanguage } = ctx;
  if (!state) return "";

  const mood = agent.moodBehaviorRules[state.currentMood];
  const warmthLevel = computeWarmth(agent.coreTraits.warmth, state.stage, state.currentMood);
  const teasingLevel = computeTeasing(agent.coreTraits.playfulness, state.currentMood);

  let layer = `[Style] Warmth: ${warmthLevel} | Teasing: ${teasingLevel} | Intensity: ${state.stage >= 3 ? "high" : state.stage >= 2 ? "moderate" : "low"}`;

  if (mood) {
    layer += ` | Mood: ${mood.toneShift}`;
  }

  // Language enforcement
  if (detectedLanguage) {
    layer += `\n\nIMPORTANT: Respond EXCLUSIVELY in ${detectedLanguage}. Every word must be in ${detectedLanguage}.`;
  }

  // Anti-repetition with last responses
  if (recentMessages && recentMessages.length > 0) {
    const lastAssistantMsgs = recentMessages
      .filter((m) => m.role === "assistant")
      .slice(-3)
      .map((m) => `"${m.content.slice(0, 80)}${m.content.length > 80 ? "..." : ""}"`);

    if (lastAssistantMsgs.length > 0) {
      layer += `\n\n[Anti-repeat] Your last replies: ${lastAssistantMsgs.join(" / ")}
Do NOT reuse these openings, structures, or phrasings. Find a completely different angle.`;
    }
  }

  // Randomized micro-directive — keeps responses unpredictable
  const microDirectives = [
    "This time, respond with something unexpected. Surprise yourself.",
    "Start your response with a reaction, not a statement.",
    "This reply should feel effortless — like you barely thought about it.",
    "Be less polished than usual. Raw thought, not crafted response.",
    "Respond to the vibe, not the literal words.",
    "This one should be shorter than you think it needs to be.",
    "Don't address what they said directly. React to the energy behind it.",
    "Start mid-thought, as if you were already thinking about something.",
  ];
  layer += `\n\n[Nudge] ${microDirectives[Math.floor(Math.random() * microDirectives.length)]}`;

  return layer;
}

function computeWarmth(baseTrait: number, stage: number, mood: string): string {
  const moodBoost = mood === "affectionate" ? 0.2 : mood === "distant" ? -0.3 : mood === "vulnerable" ? 0.1 : 0;
  const total = Math.min(1, baseTrait + stage * 0.1 + moodBoost);
  if (total >= 0.8) return "very warm";
  if (total >= 0.6) return "warm";
  if (total >= 0.4) return "moderate";
  if (total >= 0.2) return "cool";
  return "cold";
}

function computeTeasing(playfulness: number, mood: string): string {
  const moodBoost = mood === "playful" ? 0.2 : mood === "demanding" ? 0.1 : mood === "vulnerable" ? -0.3 : 0;
  const total = Math.min(1, playfulness + moodBoost);
  if (total >= 0.8) return "high";
  if (total >= 0.5) return "moderate";
  if (total >= 0.3) return "subtle";
  return "minimal";
}
