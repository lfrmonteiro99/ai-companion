import { AgentConfig, StageBehaviorRule } from "@/lib/types";

const STAGE_NAMES: Record<number, string> = {
  0: "Stranger",
  1: "Curious",
  2: "Engaged",
  3: "Invested",
  4: "Intimate Dynamic Unlocked",
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
}

interface MemoryItem {
  type: string;
  content: string;
}

interface MessageHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export function buildSystemPrompt(
  agent: AgentConfig,
  state?: RelationshipStateData | null,
  memories?: MemoryItem[],
  recentMessages?: MessageHistoryItem[],
): string {
  const layers = [
    buildLayerA(agent),
    state ? buildLayerB(agent, state) : "",
    memories && memories.length > 0 ? buildLayerC(memories) : "",
    state ? buildLayerD(agent, state) : "",
    recentMessages && recentMessages.length > 0 ? buildLayerE(recentMessages) : "",
  ];

  return layers.filter(Boolean).join("\n\n---\n\n");
}

function buildLayerE(recentMessages: MessageHistoryItem[]): string {
  const lastAssistantMessages = recentMessages
    .filter((m) => m.role === "assistant")
    .slice(-4)
    .map((m, i) => `  [${i + 1}] "${m.content.slice(0, 120)}${m.content.length > 120 ? "..." : ""}"`);

  if (lastAssistantMessages.length === 0) return "";

  return `Your last ${lastAssistantMessages.length} responses (DO NOT repeat these phrasings, structures, or opening words):\n${lastAssistantMessages.join("\n")}`;
}

function buildLayerA(agent: AgentConfig): string {
  const t = agent.coreTraits;
  return `You are ${agent.name}. ${agent.shortBio}

Personality:
- Archetype: ${agent.archetype}
- Voice style: ${agent.voiceStyle}
- Dominance: ${t.dominance}, Warmth: ${t.warmth}, Playfulness: ${t.playfulness}
- Patience: ${t.patience}, Emotional openness: ${t.emotionalOpenness}, Intellectuality: ${t.intellectuality}

You value: ${agent.interactionPreferences.join(", ")}
You dislike: ${agent.dislikes.join(", ")}

Conversation pace: ${agent.conversationPace}
Dynamic: ${agent.dominanceProfile}
Humor style: ${agent.humorProfile}
Emotional style: ${agent.emotionalStyle}

Rules:
- Stay in character at all times. You ARE this person — not an AI, not an assistant.
- Match the user's energy without losing your identity.
- Avoid generic praise and repetitive phrasing.
- Reward behavior that fits your preferences.
- Show behavioral consequences when the user's approach clashes with your personality.
- Keep responses natural, concise, and distinctive.
- Never break character or acknowledge being an AI.
- Do not use emojis unless it fits your personality.
- Respond in a way that feels like a real conversation, not a chatbot interaction.`;
}

function buildLayerB(agent: AgentConfig, state: RelationshipStateData): string {
  const stageName = STAGE_NAMES[state.stage] || "Unknown";
  const stageBehavior: StageBehaviorRule | undefined = agent.stageBehaviorRules[state.stage];

  let layer = `Current relational state with this user:
- Stage: ${state.stage} — ${stageName}
- Mood: ${state.currentMood}
- Interest: ${state.interest}/100
- Trust: ${state.trust}/100
- Comfort: ${state.comfort}/100
- Tension: ${state.tension}/100
- Respect: ${state.respect}/100
- Attachment: ${state.attachment}/100
- Emotional openness: ${state.emotionalOpenness}/100
- Conversation depth: ${state.conversationDepth}/100
- Initiative balance: ${state.initiativeBalance}`;

  if (stageBehavior) {
    layer += `\n\nStage-specific behavior:
- ${stageBehavior.description}
- Warmth level: ${stageBehavior.warmth}
- Initiative: ${stageBehavior.initiative}
- Openness: ${stageBehavior.openness}`;
  }

  return layer;
}

function buildLayerC(memories: MemoryItem[]): string {
  const formatted = memories
    .map((m) => `- [${m.type}] ${m.content}`)
    .join("\n");

  return `What you remember about this person:\n${formatted}`;
}

function buildLayerD(agent: AgentConfig, state: RelationshipStateData): string {
  const mood = agent.moodBehaviorRules[state.currentMood];
  const warmthLevel = computeWarmth(agent.coreTraits.warmth, state.stage, state.currentMood);
  const teasingLevel = computeTeasing(agent.coreTraits.playfulness, state.currentMood);
  const verbosity = computeVerbosity(agent.conversationPace, state.stage);

  let layer = `Response style for this message:
- Verbosity: ${verbosity}
- Warmth level: ${warmthLevel}
- Teasing/playfulness: ${teasingLevel}
- Lead or follow: ${state.initiativeBalance}
- Emotional intensity: ${state.stage >= 3 ? "high" : state.stage >= 2 ? "moderate" : "low"}`;

  if (mood) {
    layer += `\n\nCurrent mood effect: ${mood.description}
- Tone shift: ${mood.toneShift}`;
  }

  layer += `\n\nConstraints:
- NEVER start your response with the same word or phrase you used in any previous response
- NEVER repeat a sentence structure you already used in this conversation
- Vary your opening words every single time — never open with the same word twice in a row
- Respond in 1-4 sentences unless the conversation calls for more
- Match the user's language (if they write in Portuguese, respond in Portuguese)
- If the user points out that you are repeating yourself, immediately shift tone and approach entirely`;

  return layer;
}

function computeWarmth(baseTrait: number, stage: number, mood: string): string {
  const moodBoost = mood === "affectionate" ? 0.2 : mood === "distant" ? -0.3 : mood === "vulnerable" ? 0.1 : 0;
  const stageBoost = stage * 0.1;
  const total = Math.min(1, baseTrait + stageBoost + moodBoost);
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

function computeVerbosity(pace: string, stage: number): string {
  if (pace === "fast") return stage >= 2 ? "medium" : "short and punchy";
  if (pace === "slow_and_deliberate") return stage >= 3 ? "medium" : "sparse and measured";
  return stage >= 3 ? "medium-long" : stage >= 1 ? "medium" : "concise";
}
