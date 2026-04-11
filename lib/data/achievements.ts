import { Achievement } from "@/lib/types";

export const ACHIEVEMENTS: Achievement[] = [
  // --- First Steps ---
  {
    id: "first_conversation",
    label: "Ice Breaker",
    description: "Complete your first practice conversation",
    condition: "totalSessions >= 1",
    icon: "MessageCircle",
  },
  {
    id: "first_scenario",
    label: "Challenge Accepted",
    description: "Complete your first scenario",
    condition: "scenariosCompleted >= 1",
    icon: "Target",
  },
  {
    id: "first_analysis",
    label: "Self-Aware",
    description: "Receive your first session analysis",
    condition: "totalSessions >= 1",
    icon: "Brain",
  },

  // --- Skill Milestones ---
  {
    id: "confidence_75",
    label: "Cool & Collected",
    description: "Reach a confidence score of 75 or higher",
    condition: "skills.confidence >= 75",
    icon: "Shield",
  },
  {
    id: "emotional_intelligence_80",
    label: "Empathy Expert",
    description: "Reach an emotional intelligence score of 80 or higher",
    condition: "skills.emotionalIntelligence >= 80",
    icon: "Heart",
  },
  {
    id: "warmth_80",
    label: "Warm Presence",
    description: "Reach a warmth score of 80 or higher",
    condition: "skills.warmth >= 80",
    icon: "Sun",
  },
  {
    id: "calibration_75",
    label: "Room Reader",
    description: "Reach a calibration score of 75 or higher",
    condition: "skills.calibration >= 75",
    icon: "Compass",
  },
  {
    id: "boundary_respect_85",
    label: "Respectful Presence",
    description: "Reach a boundary respect score of 85 or higher",
    condition: "skills.boundaryRespect >= 85",
    icon: "ShieldCheck",
  },

  // --- Scenario Completions ---
  {
    id: "scenarios_5",
    label: "Getting Serious",
    description: "Complete 5 scenarios",
    condition: "scenariosCompleted >= 5",
    icon: "Star",
  },
  {
    id: "scenarios_10",
    label: "Scenario Veteran",
    description: "Complete 10 scenarios",
    condition: "scenariosCompleted >= 10",
    icon: "Award",
  },
  {
    id: "all_mvp_scenarios",
    label: "Full Curriculum",
    description: "Complete all 10 MVP scenarios",
    condition: "scenariosCompleted >= 10",
    icon: "GraduationCap",
  },

  // --- Character Breadth ---
  {
    id: "talked_all_characters",
    label: "Social Butterfly",
    description: "Have a conversation with all 5 characters",
    condition: "uniqueAgents >= 5",
    icon: "Users",
  },
  {
    id: "scenario_each_character",
    label: "Well-Rounded",
    description: "Complete a scenario with each of the 5 characters",
    condition: "uniqueAgentsScenario >= 5",
    icon: "Globe",
  },

  // --- Special Achievements ---
  {
    id: "graceful_rejection",
    label: "Graceful Exit",
    description: "Handle a rejection scenario without insisting",
    condition: "lastScenarioCategory == rejection && lastScore.boundaryRespect >= 70",
    icon: "HeartHandshake",
  },
  {
    id: "recovery_master",
    label: "Recovery Master",
    description: "Score above 70 in a recovery scenario",
    condition: "lastScenarioCategory == recovery && lastScore.overallScore >= 70",
    icon: "RotateCcw",
  },
  {
    id: "no_pressure_streak",
    label: "Zero Pressure",
    description: "Keep pressure level below 30 for 3 consecutive sessions",
    condition: "skills.pressureLevel <= 30 && totalSessions >= 3",
    icon: "Feather",
  },

  // --- Streak Milestones ---
  {
    id: "streak_3",
    label: "Momentum",
    description: "Mantém uma streak de 3 dias consecutivos",
    condition: "streakDays >= 3",
    icon: "Flame",
  },
  {
    id: "streak_7",
    label: "Dedicado",
    description: "Mantém uma streak de 7 dias consecutivos",
    condition: "streakDays >= 7",
    icon: "Flame",
  },
  {
    id: "streak_14",
    label: "Consistente",
    description: "Mantém uma streak de 14 dias consecutivos",
    condition: "streakDays >= 14",
    icon: "Flame",
  },
  {
    id: "streak_30",
    label: "Imparável",
    description: "Mantém uma streak de 30 dias consecutivos",
    condition: "streakDays >= 30",
    icon: "Flame",
  },

  // --- Level Milestones ---
  {
    id: "level_5",
    label: "Rising Star",
    description: "Reach level 5",
    condition: "level >= 5",
    icon: "TrendingUp",
  },
  {
    id: "level_10",
    label: "Conversation Master",
    description: "Reach level 10",
    condition: "level >= 10",
    icon: "Crown",
  },
];
