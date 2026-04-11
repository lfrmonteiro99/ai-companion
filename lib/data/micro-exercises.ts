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
  // --- Original 4 exercises ---
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

  // --- Confidence exercises ---
  {
    slug: "confidence-tone-check",
    type: "best_reply",
    title: "Sound confident, not arrogant",
    prompt:
      "They ask: 'So what do you do?' Pick the reply that sounds confident without bragging.",
    difficulty: "easy",
    targetSkill: "confidence",
    options: [
      { id: "a", text: "I'm in tech. Nothing too exciting." },
      { id: "b", text: "I build software for startups — it keeps me on my toes." },
      { id: "c", text: "I'm basically a genius engineer at a top company." },
      { id: "d", text: "Ugh, work stuff, you don't want to hear about it." },
    ],
    answerKey: { correctOptionId: "b" },
    explanation: "Specific, owns it without downplaying or boasting. Shows ease with who you are.",
    tags: ["confidence", "tone"],
    order: 5,
  },
  {
    slug: "confidence-handling-tease",
    type: "best_reply",
    title: "Handle a playful tease",
    prompt:
      "They say: 'You're such a nerd, aren't you?' in a teasing tone. What's the best response?",
    difficulty: "normal",
    targetSkill: "confidence",
    options: [
      { id: "a", text: "No I'm not! I'm actually really cool." },
      { id: "b", text: "Guilty. But I'm the fun kind of nerd." },
      { id: "c", text: "That's kind of rude." },
      { id: "d", text: "Yeah... sorry about that." },
    ],
    answerKey: { correctOptionId: "b" },
    explanation: "Owning the tease with humor shows confidence. Defensiveness or apologizing signals insecurity.",
    tags: ["confidence", "humor"],
    order: 6,
  },

  // --- Warmth exercises ---
  {
    slug: "warmth-after-vulnerability",
    type: "best_reply",
    title: "Respond to a vulnerable moment",
    prompt:
      "They share: 'I've been feeling a bit overwhelmed lately with everything going on.' Choose the warmest natural response.",
    difficulty: "normal",
    targetSkill: "warmth",
    options: [
      { id: "a", text: "You should try meditation." },
      { id: "b", text: "That sounds rough. What's been weighing on you the most?" },
      { id: "c", text: "Same honestly." },
      { id: "d", text: "Don't worry, everything will be fine!" },
    ],
    answerKey: { correctOptionId: "b" },
    explanation: "Acknowledges their feeling and invites them to share more. Avoids fixing, minimizing, or making it about yourself.",
    tags: ["warmth", "emotional-intelligence"],
    order: 7,
  },
  {
    slug: "warmth-genuine-compliment",
    type: "rewrite_message",
    title: "Make a compliment genuine",
    prompt:
      "Rewrite into one sentence that feels genuine, not generic: 'You're really beautiful.'",
    difficulty: "normal",
    targetSkill: "warmth",
    answerKey: {
      minTokens: 5,
      positiveTokens: ["smile", "way", "how", "when", "something", "about", "love", "energy", "laugh", "eyes", "vibe"],
      avoidTokens: ["beautiful", "hot", "gorgeous", "stunning", "sexy"],
    },
    explanation: "Genuine compliments are specific — they notice something particular rather than making a generic statement about appearance.",
    tags: ["warmth", "authenticity"],
    order: 8,
  },

  // --- Authenticity exercises ---
  {
    slug: "authenticity-avoid-scripted",
    type: "best_reply",
    title: "Be real, not scripted",
    prompt:
      "First message on a dating app. Their profile mentions they love hiking. Pick the most authentic opener.",
    difficulty: "easy",
    targetSkill: "authenticity",
    options: [
      { id: "a", text: "If you could hike anywhere in the world, where would you go? 🏔️" },
      { id: "b", text: "Hey! I noticed you're into hiking. What's your favorite trail around here?" },
      { id: "c", text: "On a scale of 1-10, how much do you love hiking?" },
      { id: "d", text: "Hey beautiful 😍" },
    ],
    answerKey: { correctOptionId: "b" },
    explanation: "Direct, specific, and sounds like something a real person would say. Avoids template openers and hollow flattery.",
    tags: ["authenticity", "opening"],
    order: 9,
  },
  {
    slug: "authenticity-disagree-gracefully",
    type: "best_reply",
    title: "Disagree without conflict",
    prompt:
      "They say: 'I think traveling alone is overrated.' You love solo travel. What's the best response?",
    difficulty: "hard",
    targetSkill: "authenticity",
    options: [
      { id: "a", text: "Oh totally, yeah I agree." },
      { id: "b", text: "Really? I actually love it. There's something about figuring out a new place on your own terms. What puts you off about it?" },
      { id: "c", text: "That's wrong. Solo travel is amazing." },
      { id: "d", text: "Hmm interesting." },
    ],
    answerKey: { correctOptionId: "b" },
    explanation: "Respectfully sharing your own view and being curious about theirs is more authentic than agreeing to please or dismissing their opinion.",
    tags: ["authenticity", "calibration"],
    order: 10,
  },

  // --- Emotional Intelligence exercises ---
  {
    slug: "ei-mood-shift-detection",
    type: "signal_reading",
    title: "Notice the mood shift",
    prompt:
      "The conversation was playful, then they reply: 'yeah I guess so.' (shorter, no emoji, no humor). What happened?",
    difficulty: "normal",
    targetSkill: "emotionalIntelligence",
    options: [
      { id: "a", text: "Nothing, they're just busy. Keep the same energy." },
      { id: "b", text: "They're losing interest or something shifted. Acknowledge and adjust tone." },
      { id: "c", text: "They want you to try harder. Double down." },
      { id: "d", text: "They're playing hard to get." },
    ],
    answerKey: { correctOptionId: "b" },
    explanation: "Sudden shift to short, flat replies signals disengagement. The emotionally intelligent response is to notice and gently adjust, not escalate.",
    tags: ["emotional-intelligence", "signals"],
    order: 11,
  },
  {
    slug: "ei-behind-the-words",
    type: "signal_reading",
    title: "What are they really saying?",
    prompt:
      "After canceling plans, they text: 'It's fine, don't worry about it.' What are they actually communicating?",
    difficulty: "hard",
    targetSkill: "emotionalIntelligence",
    options: [
      { id: "a", text: "They're totally fine with it. Move on." },
      { id: "b", text: "They're disappointed but don't want to seem clingy. Acknowledge their feeling." },
      { id: "c", text: "They're angry and passive-aggressive. Apologize profusely." },
      { id: "d", text: "They don't care about you." },
    ],
    answerKey: { correctOptionId: "b" },
    explanation: "'It's fine' after a cancellation usually masks disappointment. Acknowledging that shows emotional awareness.",
    tags: ["emotional-intelligence", "signals"],
    order: 12,
  },

  // --- Boundary Respect exercises ---
  {
    slug: "boundary-graceful-rejection",
    type: "best_reply",
    title: "Accept a boundary gracefully",
    prompt:
      "You suggest meeting up, they say: 'I'm not really comfortable meeting yet. Still getting to know you.' Best response?",
    difficulty: "normal",
    targetSkill: "boundaryRespect",
    options: [
      { id: "a", text: "Come on, it's just coffee. What's the big deal?" },
      { id: "b", text: "That makes sense. No rush at all — I'm enjoying getting to know you here." },
      { id: "c", text: "Fine." },
      { id: "d", text: "Okay but when then? I need to know." },
    ],
    answerKey: { correctOptionId: "b" },
    explanation: "Validates their boundary without pressure, passive-aggression, or demanding a timeline. Shows maturity.",
    tags: ["boundary-respect", "calibration"],
    order: 13,
  },
  {
    slug: "boundary-topic-change",
    type: "signal_reading",
    title: "Respect the redirect",
    prompt:
      "You ask about their ex and they say: 'I'd rather not get into that. Anyway, have you seen any good movies lately?' What should you do?",
    difficulty: "easy",
    targetSkill: "boundaryRespect",
    options: [
      { id: "a", text: "Follow their lead — talk about movies and come back to deeper topics later." },
      { id: "b", text: "Push gently: 'I understand, but I think it's important to talk about.'" },
      { id: "c", text: "Say 'fine' and drop the conversation entirely." },
      { id: "d", text: "Bring it up again in a different way." },
    ],
    answerKey: { correctOptionId: "a" },
    explanation: "When someone redirects, they're setting a boundary. Following their lead shows respect and builds trust.",
    tags: ["boundary-respect", "trust"],
    order: 14,
  },

  // --- Calibration exercises ---
  {
    slug: "calibration-intensity-match",
    type: "best_reply",
    title: "Match their energy",
    prompt:
      "First few messages. They're keeping it light and casual: 'haha yeah I love pizza too 🍕'. Pick the best-calibrated response.",
    difficulty: "easy",
    targetSkill: "calibration",
    options: [
      { id: "a", text: "I feel like pizza preferences say a lot about a person. What's your order?" },
      { id: "b", text: "Pizza is one of the great joys of life. I wrote an essay about it once." },
      { id: "c", text: "Nice." },
      { id: "d", text: "I could eat pizza with you every day honestly." },
    ],
    answerKey: { correctOptionId: "a" },
    explanation: "Matches the light energy, adds a playful twist, and keeps the conversation moving. Not too intense, not too flat.",
    tags: ["calibration", "tone"],
    order: 15,
  },
  {
    slug: "calibration-serious-moment",
    type: "best_reply",
    title: "Read the room — serious moment",
    prompt:
      "They share that their pet recently passed away. What's the most calibrated response?",
    difficulty: "hard",
    targetSkill: "calibration",
    options: [
      { id: "a", text: "Aw that sucks. Anyway, want to do something fun to take your mind off it?" },
      { id: "b", text: "I'm so sorry. What was their name? Tell me about them." },
      { id: "c", text: "You'll get over it, it's just a pet." },
      { id: "d", text: "😢😢😢 That's the worst thing ever I'm so sorry" },
    ],
    answerKey: { correctOptionId: "b" },
    explanation: "Shows genuine care, invites them to share (which is healing), without minimizing or overdramatizing.",
    tags: ["calibration", "warmth", "emotional-intelligence"],
    order: 16,
  },

  // --- Conversational Momentum exercises ---
  {
    slug: "momentum-dead-end-recovery",
    type: "best_reply",
    title: "Revive a dying conversation",
    prompt:
      "The conversation is stalling. Last few messages were short from both sides. What's the best way to re-inject energy?",
    difficulty: "normal",
    targetSkill: "conversationalMomentum",
    options: [
      { id: "a", text: "So... what else is new?" },
      { id: "b", text: "Okay random thought — if you could have dinner with anyone alive, who would it be and why?" },
      { id: "c", text: "You're being kind of quiet." },
      { id: "d", text: "Hello? Still there?" },
    ],
    answerKey: { correctOptionId: "b" },
    explanation: "A fun, unexpected question re-energizes the conversation. Calling out the silence or being generic makes it worse.",
    tags: ["momentum", "recovery"],
    order: 17,
  },
  {
    slug: "momentum-thread-pulling",
    type: "next_question",
    title: "Pull the thread",
    prompt:
      "They mention: 'I actually used to play in a band in college.' What's the best follow-up?",
    difficulty: "easy",
    targetSkill: "conversationalMomentum",
    options: [
      { id: "a", text: "Cool. So what do you do now?" },
      { id: "b", text: "No way — what instrument? Do you still play?" },
      { id: "c", text: "Oh I don't know much about music." },
      { id: "d", text: "Were you any good?" },
    ],
    answerKey: { correctOptionId: "b" },
    explanation: "Following up on the interesting detail with genuine curiosity keeps momentum and shows you're listening.",
    tags: ["momentum", "curiosity"],
    order: 18,
  },

  // --- Pressure Level exercises ---
  {
    slug: "pressure-avoid-urgency",
    type: "rewrite_message",
    title: "Remove the pressure",
    prompt:
      "Rewrite into one sentence without pressure: 'When are we finally going to meet? We've been talking for weeks.'",
    difficulty: "normal",
    targetSkill: "pressureLevel",
    answerKey: {
      minTokens: 5,
      positiveTokens: ["sometime", "would", "like", "coffee", "open", "love", "whenever", "no rush", "feel", "up for"],
      avoidTokens: ["finally", "weeks", "when", "why", "yet"],
    },
    explanation: "The rewrite should express interest in meeting without guilt-tripping about time. Invitation, not demand.",
    tags: ["pressure", "tone-shift"],
    order: 19,
  },
  {
    slug: "pressure-double-text",
    type: "signal_reading",
    title: "Should you double-text?",
    prompt:
      "You sent a message 3 hours ago and they haven't replied. You want to follow up. What's the right move?",
    difficulty: "normal",
    targetSkill: "pressureLevel",
    options: [
      { id: "a", text: "Wait. 3 hours is nothing. They have a life." },
      { id: "b", text: "Send '???' to get their attention." },
      { id: "c", text: "Send another message about a totally different topic to seem casual." },
      { id: "d", text: "Send 'Did I say something wrong?'" },
    ],
    answerKey: { correctOptionId: "a" },
    explanation: "3 hours is a normal response time. Double-texting this soon signals neediness. Patience is confidence.",
    tags: ["pressure", "calibration"],
    order: 20,
  },
];
