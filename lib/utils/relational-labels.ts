/**
 * Converts numeric relationship state into natural language labels.
 * The user never sees numbers — only qualitative descriptions.
 */

interface RelationshipStateInput {
  interest: number;
  trust: number;
  comfort: number;
  tension: number;
  respect: number;
  attachment: number;
  emotionalOpenness: number;
  conversationDepth: number;
  dynamicAlignment: number;
  stage: number;
}

export interface RelationalLabel {
  text: string;
  sentiment: "positive" | "neutral" | "negative" | "warning";
  priority: number; // higher = more important to show
}

export function getRelationalLabels(state: RelationshipStateInput): RelationalLabel[] {
  const labels: RelationalLabel[] = [];

  // --- Interest ---
  if (state.interest < 20) {
    labels.push({ text: "parece desinteressada", sentiment: "negative", priority: 90 });
  } else if (state.interest < 35) {
    labels.push({ text: "não parece muito interessada", sentiment: "warning", priority: 70 });
  } else if (state.interest >= 35 && state.interest < 50) {
    labels.push({ text: "está a estudar-te", sentiment: "neutral", priority: 60 });
  } else if (state.interest >= 50 && state.interest < 70) {
    labels.push({ text: "está curiosa", sentiment: "positive", priority: 65 });
  } else if (state.interest >= 70 && state.interest < 85) {
    labels.push({ text: "está envolvida", sentiment: "positive", priority: 75 });
  } else if (state.interest >= 85) {
    labels.push({ text: "está muito interessada", sentiment: "positive", priority: 80 });
  }

  // --- Trust ---
  if (state.trust < 20) {
    labels.push({ text: "não confia em ti", sentiment: "negative", priority: 85 });
  } else if (state.trust >= 40 && state.trust < 60) {
    labels.push({ text: "começa a confiar", sentiment: "positive", priority: 50 });
  } else if (state.trust >= 60 && state.trust < 80) {
    labels.push({ text: "começou a abrir-se", sentiment: "positive", priority: 60 });
  } else if (state.trust >= 80) {
    labels.push({ text: "confia em ti", sentiment: "positive", priority: 65 });
  }

  // --- Comfort ---
  if (state.comfort < 25 && state.tension > 50) {
    labels.push({ text: "está desconfortável", sentiment: "negative", priority: 80 });
  } else if (state.comfort >= 50 && state.comfort < 70) {
    labels.push({ text: "sente-se relativamente à vontade", sentiment: "positive", priority: 40 });
  } else if (state.comfort >= 70) {
    labels.push({ text: "sente-se confortável contigo", sentiment: "positive", priority: 55 });
  }

  // --- Tension (can be positive or negative) ---
  if (state.tension > 60 && state.interest > 50) {
    labels.push({ text: "há tensão positiva", sentiment: "positive", priority: 70 });
  } else if (state.tension > 60 && state.interest < 40) {
    labels.push({ text: "está a testar-te", sentiment: "warning", priority: 75 });
  } else if (state.tension > 75) {
    labels.push({ text: "a tensão está alta", sentiment: "warning", priority: 80 });
  }

  // --- Respect ---
  if (state.respect < 25) {
    labels.push({ text: "perdeu respeito por ti", sentiment: "negative", priority: 90 });
  } else if (state.respect >= 60 && state.respect < 80) {
    labels.push({ text: "respeita-te", sentiment: "positive", priority: 50 });
  } else if (state.respect >= 80) {
    labels.push({ text: "respeita-te bastante", sentiment: "positive", priority: 55 });
  }

  // --- Attachment ---
  if (state.attachment >= 50 && state.attachment < 70) {
    labels.push({ text: "está mais envolvida", sentiment: "positive", priority: 60 });
  } else if (state.attachment >= 70) {
    labels.push({ text: "sente ligação contigo", sentiment: "positive", priority: 70 });
  }

  // --- Emotional Openness ---
  if (state.emotionalOpenness < 20 && state.stage >= 1) {
    labels.push({ text: "mantém distância emocional", sentiment: "warning", priority: 55 });
  } else if (state.emotionalOpenness >= 50 && state.emotionalOpenness < 70) {
    labels.push({ text: "está a ser mais vulnerável", sentiment: "positive", priority: 60 });
  } else if (state.emotionalOpenness >= 70) {
    labels.push({ text: "está vulnerável contigo", sentiment: "positive", priority: 70 });
  }

  // --- Conversation Depth ---
  if (state.conversationDepth < 20 && state.stage >= 1) {
    labels.push({ text: "a conversa está superficial", sentiment: "warning", priority: 45 });
  } else if (state.conversationDepth >= 50 && state.conversationDepth < 70) {
    labels.push({ text: "a conversa tem substância", sentiment: "positive", priority: 40 });
  } else if (state.conversationDepth >= 70) {
    labels.push({ text: "estão em conversa profunda", sentiment: "positive", priority: 50 });
  }

  // --- Dynamic Alignment ---
  if (state.dynamicAlignment >= 70) {
    labels.push({ text: "sentem-se em sintonia", sentiment: "positive", priority: 65 });
  } else if (state.dynamicAlignment < 25) {
    labels.push({ text: "estão dessincronizados", sentiment: "warning", priority: 55 });
  }

  // --- Compound states ---
  if (state.interest > 60 && state.trust > 60 && state.comfort > 60) {
    labels.push({ text: "a ligação está a crescer", sentiment: "positive", priority: 80 });
  }

  if (state.interest < 30 && state.respect < 30) {
    labels.push({ text: "está a perder interesse e respeito", sentiment: "negative", priority: 95 });
  }

  if (state.tension > 50 && state.comfort < 30 && state.trust < 30) {
    labels.push({ text: "está na defensiva", sentiment: "negative", priority: 85 });
  }

  if (state.interest > 50 && state.tension > 40 && state.respect > 50) {
    labels.push({ text: "estás a intrigá-la", sentiment: "positive", priority: 70 });
  }

  return labels.sort((a, b) => b.priority - a.priority);
}

/**
 * Returns the primary (most important) relational state label.
 */
export function getPrimaryLabel(state: RelationshipStateInput): RelationalLabel {
  const labels = getRelationalLabels(state);
  return labels[0] || { text: "a conhecer-te", sentiment: "neutral", priority: 0 };
}

/**
 * Returns top N labels for display.
 */
export function getTopLabels(state: RelationshipStateInput, count: number = 3): RelationalLabel[] {
  return getRelationalLabels(state).slice(0, count);
}
