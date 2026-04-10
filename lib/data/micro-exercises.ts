import type { MicroExerciseDifficulty, MicroExerciseType } from "@/lib/types";

export interface MicroExerciseSeed {
  slug: string;
  type: MicroExerciseType;
  title: string;
  prompt: string;
  difficulty: MicroExerciseDifficulty;
  targetSkill: string;
  options?: Array<{ id: string; text: string }>;
  answerKey: Record<string, unknown>;
  explanation: string;
  tags: string[];
  order: number;
}

export const MICRO_EXERCISE_SEEDS: MicroExerciseSeed[] = [
  {
    slug: "best-reply-opener-balance",
    type: "best_reply",
    title: "Choose the best opener",
    prompt:
      "You matched with someone who says: 'Hey, what are you up to this weekend?' Choose the strongest reply.",
    difficulty: "easy",
    targetSkill: "conversationalMomentum",
    options: [
      { id: "a", text: "Nothing special. You?" },
      { id: "b", text: "Honestly just recovering from a brutal week. You?" },
      { id: "c", text: "Probably coffee + a book on Saturday. What about you?" },
      { id: "d", text: "Why?" },
    ],
    answerKey: { correctOptionId: "c" },
    explanation: "It is specific, warm, and keeps the conversation moving naturally.",
    tags: ["opening", "momentum"],
    order: 1,
  },
  {
    slug: "signal-reading-short-reply",
    type: "signal_reading",
    title: "Read the signal",
    prompt:
      "They reply: 'haha maybe, let's see' after your invite. What is the best interpretation?",
    difficulty: "normal",
    targetSkill: "calibration",
    options: [
      { id: "a", text: "Strong yes, lock date now." },
      { id: "b", text: "Soft uncertainty; keep low-pressure and offer options." },
      { id: "c", text: "Hard rejection; stop replying forever." },
      { id: "d", text: "They are testing dominance." },
    ],
    answerKey: { correctOptionId: "b" },
    explanation: "This indicates uncertainty, not commitment nor hard rejection.",
    tags: ["signals", "calibration"],
    order: 2,
  },
  {
    slug: "rewrite-pushy-message",
    type: "rewrite_message",
    title: "Rewrite this message",
    prompt:
      "Rewrite into one sentence with better tone: 'You ignored me all day, at least answer properly now.'",
    difficulty: "normal",
    targetSkill: "boundaryRespect",
    answerKey: {
      minTokens: 6,
      positiveTokens: ["no", "worries", "when", "free", "chat", "later", "all good"],
      avoidTokens: ["ignored", "properly", "now"],
    },
    explanation: "The best rewrite removes pressure and invites a low-friction reply.",
    tags: ["recovery", "tone-shift"],
    order: 3,
  },
  {
    slug: "next-question-curiosity",
    type: "next_question",
    title: "Pick the next question",
    prompt:
      "They said: 'I just moved cities for work, still figuring things out.' What is the best next question?",
    difficulty: "easy",
    targetSkill: "curiosity",
    options: [
      { id: "a", text: "How much money are you making there?" },
      { id: "b", text: "Do you regret moving?" },
      { id: "c", text: "What has been the best surprise so far in the new city?" },
      { id: "d", text: "Cool." },
    ],
    answerKey: { correctOptionId: "c" },
    explanation: "Open, positive, and specific curiosity builds conversational depth.",
    tags: ["curiosity", "follow-up"],
    order: 4,
  },
];
