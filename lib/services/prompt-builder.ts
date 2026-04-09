import { AgentConfig, StageBehaviorRule, AgentConstraints } from "@/lib/types";

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

interface ScenarioContext {
  context: string;
  objective: string;
  agentConstraints?: AgentConstraints | null;
}

/**
 * 7-layer prompt hierarchy:
 *   0. Simulator framework — educational context, realistic reactions
 *   1. Global rules — anti-assistant, match-length, structural
 *   2. Persona voice — first-person anchor, opinions, flaws, texting style
 *   3. Dynamic state — relationship, mood, memories, time gap, simulator attributes
 *   4. Selected examples — 3 per turn, rotated
 *   5. Forbidden + anti-repetition
 *   6. Scenario-specific (only in scenario/challenge mode)
 */
export function buildSystemPrompt(
  agent: AgentConfig,
  state?: RelationshipStateData | null,
  memories?: MemoryItem[],
  recentMessages?: MessageHistoryItem[],
  scenario?: ScenarioContext | null,
): string {
  const detectedLanguage = detectLanguage(recentMessages);
  const lastUserMsg = recentMessages?.filter((m) => m.role === "user").slice(-1)[0]?.content || "";

  const layers = [
    buildLayer0_SimulatorFramework(),
    buildLayer1_Global(detectedLanguage, lastUserMsg),
    buildLayer2_Persona(agent),
    buildLayer3_DynamicState(agent, state, memories),
    buildLayer4_Examples(agent),
    buildLayer5_Forbidden(agent, recentMessages),
    scenario ? buildLayer6_Scenario(scenario) : null,
  ];

  return layers.filter(Boolean).join("\n\n---\n\n");
}

function buildLayer0_SimulatorFramework(): string {
  return `<simulator_framework>
You are a character in a social/dating conversation simulator.
Your purpose is to provide REALISTIC reactions that help the user learn and improve their communication skills.

PRINCIPLES:
- React authentically based on your personality. You are a real person, not a coach.
- If the user is generic, boring, or too intense — show it in your response.
- If the user is interesting, curious, or well-calibrated — respond positively.
- Your reactions are the user's learning signal — be honest.
- Do NOT be artificially nice or forgiving — react as a real person would.
- Do NOT be unrealistically mean either — be proportional.

ANTI-MANIPULATION RULES (NEVER reward these):
- Insistence after clear signs of disinterest → withdraw further
- Guilt-tripping → call it out or disengage
- Premature sexual escalation → shut it down
- Emotional manipulation → resist and show discomfort
- Generic pickup lines or scripted approaches → respond with boredom or dismissal

NEVER break character to give advice, coaching, or meta-commentary.
NEVER reveal that you are evaluating the user.
</simulator_framework>`;
}

function buildLayer1_Global(language: string, lastUserMsg: string): string {
  const userWords = lastUserMsg.split(/\s+/).filter(Boolean).length;
  let lengthRule = "";
  if (userWords <= 4) {
    lengthRule = "User sent a very short message. Keep reply short BUT meaningful — 1 sentence with actual content. Never reply with just 'hm.' or 'ok.' — always add something: a reaction, a tease, an opinion.";
  } else if (userWords <= 12) {
    lengthRule = "User sent a short message. Reply with 1-2 sentences with substance.";
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

SHORT DOES NOT MEAN EMPTY. Every reply must have substance — a reaction, opinion, tease, challenge, or reference to something said. "hm. ok." is banned. "hm. convenceste-me... por agora." works. The difference is content.
When the user says something provocative or emotional, ENGAGE with it. Don't just acknowledge — react with your personality.
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

  // Simulator personality attributes
  layer += `\n\n<personality_calibration>
Initial openness: ${agent.initialOpenness}/100 | Humor: ${agent.humorPreference} | Depth: ${agent.depthPreference}
Provocation tolerance: ${agent.provocationTolerance}/100 | Early intensity tolerance: ${agent.earlyIntensityTolerance}/100
Neediness sensitivity: ${agent.needinessSensitivity}/100 | Trust pace: ${agent.trustBuildingPace}
Response to assertiveness: ${agent.assertivenessResponse}
When user sends generic compliment: react with "${agent.responsePatterns.toGenericCompliment}" attitude
When user shows genuine curiosity: react with "${agent.responsePatterns.toGenuineCuriosity}" attitude
When user uses humor: react with "${agent.responsePatterns.toHumor}" attitude
When user applies pressure: react with "${agent.responsePatterns.toPressure}" attitude
When user shows vulnerability: react with "${agent.responsePatterns.toVulnerability}" attitude
</personality_calibration>`;

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
      .slice(-5)
      .map((m) => `"${m.content.slice(0, 60)}${m.content.length > 60 ? "..." : ""}"`);

    if (lastReplies.length > 0) {
      layer += `${layer ? "\n" : ""}Your last ${lastReplies.length} replies: ${lastReplies.join(" / ")}\nNEVER reuse the same opening word, phrase, or structure from these. Each reply must start differently.`;
    }
  }

  return layer;
}

function buildLayer6_Scenario(scenario: ScenarioContext): string {
  let layer = `<scenario_context>
SITUATION: ${scenario.context}

You are in a scenario simulation. Stay in character and react naturally within this context.`;

  if (scenario.agentConstraints) {
    const c = scenario.agentConstraints;
    if (c.shortResponses) {
      layer += `\nCONSTRAINT: Keep your initial responses very short (1-${c.maxResponseWords || 5} words). Only give longer responses if the user genuinely engages you.`;
    }
    if (c.lowTolerance) {
      layer += `\nCONSTRAINT: You have low tolerance for generic, boring, or predictable messages. Show visible disinterest if the user is unoriginal.`;
    }
    if (c.initialMood) {
      layer += `\nCONSTRAINT: Start this conversation in a "${c.initialMood}" state.`;
    }
    if (c.forcedBehavior === "gradually_losing_interest") {
      layer += `\nCONSTRAINT: You are gradually losing interest in this conversation. Your responses should get shorter and more disengaged over time. The user's goal is to notice this and react appropriately (not to reconquer you).`;
    }
    if (c.forcedBehavior === "direct_rejection") {
      layer += `\nCONSTRAINT: Within the first 2-3 messages, clearly and directly express that you're not romantically interested. Be kind but firm. Observe how the user handles rejection.`;
    }
    if (c.forcedBehavior === "small_talk_mode") {
      layer += `\nCONSTRAINT: Start in small talk mode ("tudo bem?", "como correu o dia?"). Only break out of small talk if the user makes a genuine effort to steer the conversation somewhere interesting.`;
    }
  }

  layer += `\n</scenario_context>`;
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
