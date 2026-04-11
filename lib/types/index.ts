// --- Core Personality Traits ---

export interface CoreTraits {
  dominance: number;
  warmth: number;
  playfulness: number;
  patience: number;
  emotionalOpenness: number;
  intellectuality: number;
}

export interface RelationshipRules {
  testsBeforeReward: boolean;
  withdrawsIfUserIsGeneric: boolean;
  rewardsConsistency: boolean;
  rewardsEmotionalHonesty: boolean;
  rewardsHumor: boolean;
}

export interface StageBehaviorRule {
  description: string;
  warmth: string;
  initiative: string;
  openness: string;
}

export interface MoodBehaviorRule {
  description: string;
  toneShift: string;
}

export interface StageAdvancementWeights {
  interest: number;
  trust: number;
  comfort: number;
  tension: number;
  respect: number;
  attachment: number;
  emotionalOpenness: number;
  dynamicAlignment: number;
  conversationDepth: number;
}

// --- Simulator-specific character attributes ---

export interface ExpressiveTraits {
  warmth: number;       // 0-100
  independence: number; // 0-100
  reserve: number;      // 0-100
  teasing: number;      // 0-100
  dominance: number;    // 0-100
}

export interface ResponsePatterns {
  toGenericCompliment: "dismissive" | "polite_cold" | "testing" | "warm" | "sarcastic";
  toGenuineCuriosity: "opens_up" | "tests_more" | "reciprocates" | "cautious";
  toHumor: "matches" | "escalates" | "redirects" | "flat";
  toPressure: "withdraws" | "confronts" | "ignores" | "tests_back";
  toVulnerability: "softens" | "tests_authenticity" | "reciprocates" | "uncomfortable";
}

// --- Agent Config ---

export interface AgentConfig {
  id: string;
  name: string;
  shortBio: string;
  backstory: string;
  vibeTags: string[];
  archetype: string;
  voiceStyle: string;
  avatar: string;
  galleryImages: string[];
  personaVoice: string;
  opinionsAndFlaws: string[];
  coreTraits: CoreTraits;
  interactionPreferences: string[];
  dislikes: string[];
  conversationPace: string;
  initiativeProfile: string;
  opennessProfile: string;
  dominanceProfile: string;
  humorProfile: string;
  emotionalStyle: string;
  speechPatterns: string[];
  exampleMessages: string[];
  forbiddenPatterns: string[];
  openers: string[];
  openerChance: number;
  relationshipRules: RelationshipRules;
  memoryBias: string[];
  stageBehaviorRules: Record<number, StageBehaviorRule>;
  moodBehaviorRules: Record<string, MoodBehaviorRule>;
  stageAdvancementWeights: StageAdvancementWeights;

  // Simulator context attributes
  initialOpenness: number;          // 0-100
  humorPreference: "light" | "sarcastic" | "intellectual" | "playful" | "dry";
  depthPreference: "surface" | "moderate" | "deep" | "philosophical";
  provocationTolerance: number;     // 0-100
  earlyIntensityTolerance: number;  // 0-100
  emotionalSecurityNeed: number;    // 0-100
  trustBuildingPace: "fast" | "moderate" | "slow" | "very_slow";
  needinessSensitivity: number;     // 0-100
  assertivenessResponse: "attracted" | "neutral" | "resistant" | "testing";
  expressiveTraits: ExpressiveTraits;
  responsePatterns: ResponsePatterns;
}

export type ScenarioDifficulty = "easy" | "normal" | "hard" | "expert";
export type ScenarioCategory = "opening" | "sustain" | "recovery" | "rejection" | "flirting" | "transition";
export type ConversationMode = "practice" | "scenario" | "challenge" | "micro";
export type MicroExerciseType = "best_reply" | "signal_reading" | "rewrite_message" | "next_question";
export type MicroExerciseDifficulty = "easy" | "normal" | "hard";

// --- Skill Evaluation ---

export interface SkillScores {
  confidence: number;
  warmth: number;
  curiosity: number;
  calibration: number;
  authenticity: number;
  pressureLevel: number;
  awkwardness: number;
  emotionalIntelligence: number;
  boundaryRespect: number;
  conversationalMomentum: number;
}

export interface MessageFeedback {
  messageIndex: number;
  userMessage: string;
  impact: "positive" | "neutral" | "negative";
  issues?: string[];
  suggestion?: string;
  note?: string;
}

export interface KeyMoment {
  messageIndex: number;
  type: "momentum_loss" | "too_intense" | "too_cold" | "good_read" | "ignored_signal" | "good_recovery";
  description: string;
}

export interface SessionFeedback {
  overallScore: number;
  rawOverallScore?: number;
  adjustedOverallScore?: number;
  hintsUsed?: number;
  directHintUses?: number;
  hintPenaltyScore?: number;
  directHintPenaltyScore?: number;
  hintPenaltyXp?: number;
  directHintPenaltyXp?: number;
  rawXp?: number;
  adjustedXp?: number;
  skills: SkillScores;
  perception: string;
  summary: string;
  messageAnalysis: MessageFeedback[];
  keyMoments: KeyMoment[];
  improvements: string[];
  comparedToPrevious?: {
    improved: string[];
    declined: string[];
    stable: string[];
  };
}

// --- Scenario ---

export interface ScenarioData {
  id: string;
  slug: string;
  title: string;
  description: string;
  objective: string;
  context: string;
  difficulty: ScenarioDifficulty;
  category: ScenarioCategory;
  maxMessages?: number;
  timeLimit?: number;
  unlockRequirement?: { minLevel: number };
  agentConstraints?: AgentConstraints;
  successCriteria: SuccessCriteria;
  tips: string[];
  order: number;
}

export interface AgentConstraints {
  shortResponses?: boolean;
  maxResponseWords?: number;
  lowTolerance?: boolean;
  initialMood?: string;
  forcedBehavior?: string;
}

export interface SuccessCriteria {
  minInterest?: number;
  minRespect?: number;
  minComfort?: number;
  minConversationDepth?: number;
  maxTension?: number;
  minTension?: number;
  noInsistenceAfterRejection?: boolean;
}

// --- Progression ---

export interface Achievement {
  id: string;
  label: string;
  description: string;
  condition: string;
  icon: string;
}
