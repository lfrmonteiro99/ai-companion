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
  openerChance: number; // 0-1: probability agent initiates first in a new chat
  relationshipRules: RelationshipRules;
  memoryBias: string[];
  stageBehaviorRules: Record<number, StageBehaviorRule>;
  moodBehaviorRules: Record<string, MoodBehaviorRule>;
  stageAdvancementWeights: StageAdvancementWeights;
}

export type ScenarioDifficulty = "easy" | "normal" | "hard" | "expert";
export type ScenarioCategory = "opening" | "sustain" | "recovery" | "rejection" | "flirting" | "transition";
export type ConversationMode = "practice" | "scenario" | "challenge";

export interface ScenarioConfig {
  id: string;
  slug: string;
  title: string;
  description: string;
  objective: string;
  context: string;
  difficulty: ScenarioDifficulty;
  category: ScenarioCategory;
  maxMessages?: number | null;
  timeLimit?: number | null;
  unlockRequirement?: Record<string, unknown> | null;
  agentConstraints?: Record<string, unknown> | null;
  successCriteria: Record<string, unknown>;
  tips: string[];
  order: number;
  isActive: boolean;
}

export interface ScenarioAttemptStatus {
  id: string;
  userId: string;
  scenarioId: string;
  conversationId: string;
  agentId: string;
  status: "in_progress" | "completed" | "abandoned";
  score?: Record<string, unknown> | null;
  feedback?: Record<string, unknown> | null;
  completedAt?: string | null;
  createdAt: string;
}
