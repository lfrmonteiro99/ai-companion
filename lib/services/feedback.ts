import OpenAI from "openai";
import { config } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { generateStructuredOutput } from "./llm";
import { withRetry, isTransientError } from "@/lib/utils/retry";
import { logger } from "@/lib/utils/logger";
import type {
  SessionFeedback,
  MessageFeedback,
  KeyMoment,
  SkillScores,
  AgentConfig,
  SuccessCriteria,
} from "@/lib/types";

const log = logger("feedback");
const openai = new OpenAI({ apiKey: config.openaiApiKey });

// ---------------------------------------------------------------------------
// Internal: call GPT-4o-mini with a high token budget for detailed feedback
// The shared `generateStructuredOutput` is capped at 200 tokens / Record<string, number>,
// which is insufficient for the rich SessionFeedback payload, so we use a
// dedicated call here while keeping the same model and json_object mode.
// ---------------------------------------------------------------------------
async function generateDetailedFeedback(prompt: string): Promise<SessionFeedback> {
  return withRetry(
    async () => {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a JSON-only conversation coach engine. Return ONLY valid JSON, no markdown, no explanation. All text fields that represent feedback visible to the user must be written in Brazilian Portuguese.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content || "{}";
      return JSON.parse(content) as SessionFeedback;
    },
    { maxAttempts: 2, baseDelayMs: 1500, shouldRetry: isTransientError },
  );
}

// ---------------------------------------------------------------------------
// Build the agent personality context block for the prompt
// ---------------------------------------------------------------------------
function buildAgentContext(agent: AgentConfig): string {
  return [
    `Nome: ${agent.name}`,
    `Arquétipo: ${agent.archetype}`,
    `Bio: ${agent.shortBio}`,
    `Estilo de voz: ${agent.voiceStyle}`,
    `Persona: ${agent.personaVoice}`,
    `Traços centrais: dominância ${agent.coreTraits.dominance}, calor ${agent.coreTraits.warmth}, brincadeira ${agent.coreTraits.playfulness}, paciência ${agent.coreTraits.patience}, abertura emocional ${agent.coreTraits.emotionalOpenness}`,
    `Preferências de interação: ${agent.interactionPreferences.join(", ")}`,
    `Desgosta de: ${agent.dislikes.join(", ")}`,
    `Ritmo de conversa: ${agent.conversationPace}`,
    `Perfil de humor: ${agent.humorProfile}`,
    `Tolerância a provocação: ${agent.provocationTolerance}/100`,
    `Tolerância a intensidade inicial: ${agent.earlyIntensityTolerance}/100`,
    `Sensibilidade a carência: ${agent.needinessSensitivity}/100`,
    `Resposta a assertividade: ${agent.assertivenessResponse}`,
    `Padrões de resposta: elogio genérico → ${agent.responsePatterns.toGenericCompliment}, curiosidade genuína → ${agent.responsePatterns.toGenuineCuriosity}, humor → ${agent.responsePatterns.toHumor}, pressão → ${agent.responsePatterns.toPressure}, vulnerabilidade → ${agent.responsePatterns.toVulnerability}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Build the formatted conversation transcript for the prompt
// ---------------------------------------------------------------------------
function buildTranscript(messages: { role: string; content: string }[]): string {
  return messages
    .map((m, i) => `[${i}] ${m.role === "user" ? "USUÁRIO" : "PERSONAGEM"}: ${m.content}`)
    .join("\n");
}

// ---------------------------------------------------------------------------
// Compare current skills to previous session skills
// ---------------------------------------------------------------------------
function compareSkills(
  current: SkillScores,
  previous: SkillScores,
): { improved: string[]; declined: string[]; stable: string[] } {
  const THRESHOLD = 3; // minimum delta to count as improved/declined
  const improved: string[] = [];
  const declined: string[] = [];
  const stable: string[] = [];

  const keys = Object.keys(current) as (keyof SkillScores)[];

  for (const key of keys) {
    const diff = current[key] - previous[key];
    // For inverse metrics (pressureLevel, awkwardness), improvement means decrease
    const isInverse = key === "pressureLevel" || key === "awkwardness";
    const effectiveDiff = isInverse ? -diff : diff;

    if (effectiveDiff >= THRESHOLD) {
      improved.push(key);
    } else if (effectiveDiff <= -THRESHOLD) {
      declined.push(key);
    } else {
      stable.push(key);
    }
  }

  return { improved, declined, stable };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyse a full conversation and return structured feedback.
 *
 * Design principle: suggested alternatives must be MORE NATURAL, lighter and
 * well-calibrated — never "more seductive" or scripted pickup lines.
 * The system teaches genuine communication, not manipulation.
 */
export async function generateSessionFeedback(
  messages: { role: string; content: string }[],
  agent: AgentConfig,
  scenario?: { objective: string; successCriteria: SuccessCriteria },
  previousSkills?: SkillScores,
): Promise<SessionFeedback> {
  const agentContext = buildAgentContext(agent);
  const transcript = buildTranscript(messages);

  const userMessageIndices = messages
    .map((m, i) => (m.role === "user" ? i : -1))
    .filter((i) => i !== -1);

  const scenarioBlock = scenario
    ? `
CONTEXTO DO CENÁRIO:
- Objetivo: ${scenario.objective}
- Critérios de sucesso: ${JSON.stringify(scenario.successCriteria)}
Avalie também se o usuário atingiu o objetivo do cenário.`
    : "";

  const prompt = `Você é um coach de comunicação social especializado em análise de conversas.
Analise a conversa abaixo entre um USUÁRIO e um PERSONAGEM simulado.

PERSONALIDADE DO PERSONAGEM:
${agentContext}

${scenarioBlock}

CONVERSA COMPLETA:
${transcript}

INSTRUÇÕES DE ANÁLISE:

1. **overallScore** (0-100): nota geral da performance do usuário na conversa.

2. **skills** — avalie cada habilidade de 0 a 100:
   - confidence: quão confiante (não arrogante) o usuário pareceu
   - warmth: quão caloroso e genuinamente interessado
   - curiosity: quão curioso sobre o personagem como pessoa
   - calibration: quão bem adaptou o tom/ritmo ao contexto e respostas do personagem
   - authenticity: quão genuíno e natural soou (vs. forçado ou roteirizado)
   - pressureLevel: quanta pressão colocou no personagem (0=nenhuma, 100=muita) — MENOR É MELHOR
   - awkwardness: quão desconfortável ou estranho foi (0=fluido, 100=muito estranho) — MENOR É MELHOR
   - emotionalIntelligence: quão bem leu e respondeu a sinais emocionais
   - boundaryRespect: quão bem respeitou limites e sinais de desconforto
   - conversationalMomentum: quão bem manteve a conversa fluindo naturalmente

3. **perception** (em português): descreva como o PERSONAGEM (${agent.name}) percebeu o usuário. Escreva na voz da personagem, em primeira pessoa. Ex: "Achei ele interessante no começo, mas..."

4. **summary** (em português): resumo de 2-3 frases da performance geral do usuário, pontos fortes e fracos.

5. **messageAnalysis**: para CADA mensagem do USUÁRIO (índices: ${userMessageIndices.join(", ")}), retorne:
   - messageIndex: o índice da mensagem
   - userMessage: o texto exato da mensagem
   - impact: "positive", "neutral" ou "negative" (como essa mensagem impactou a percepção do personagem)
   - issues: lista de problemas (se houver). Exemplos: "Elogio genérico demais", "Mudou de assunto abruptamente", "Ignorou o que ela disse", "Tom intenso demais para esse momento"
   - suggestion: uma alternativa MELHOR para a mensagem. IMPORTANTE: a alternativa deve ser mais NATURAL, leve e calibrada — NÃO mais "sedutora" ou intensa. Preferimos mensagens que soem como algo que uma pessoa confiante e relaxada diria naturalmente. Nunca sugira cantadas, frases prontas ou linguagem manipulativa. Se a mensagem original já foi boa, o campo pode ser null.
   - note: observação breve e útil sobre a mensagem (em português)

6. **keyMoments**: identifique até 5 momentos-chave (pode ser menos). Tipos:
   - "momentum_loss": a conversa perdeu energia por causa do usuário
   - "too_intense": o usuário foi intenso/sério demais para o momento
   - "too_cold": o usuário foi frio ou distante quando deveria demonstrar interesse
   - "good_read": o usuário leu bem o contexto e respondeu de forma calibrada
   - "ignored_signal": o usuário ignorou um sinal claro do personagem
   - "good_recovery": o usuário se recuperou bem de um momento difícil
   Cada momento: { messageIndex, type, description (em português) }

7. **improvements** (em português): lista de 3-5 dicas concretas e acionáveis para melhorar. Foque em:
   - Ser mais natural e menos "performático"
   - Calibrar o tom ao contexto
   - Ler melhor os sinais da outra pessoa
   - Manter o equilíbrio entre interesse e leveza
   NÃO sugira ser mais "sedutor", "ousado" ou "intenso". O objetivo é comunicação genuína.

REGRAS DE SUGESTÃO:
- Alternativas devem soar como uma pessoa real, relaxada e socialmente calibrada
- Prefira respostas mais curtas e naturais a longas e elaboradas
- Se o problema é excesso de intensidade, sugira algo mais leve
- Se o problema é frieza, sugira algo levemente mais caloroso mas ainda natural
- NUNCA sugira cantadas, frases de efeito ou linguagem de "pickup artist"
- O objetivo é ensinar comunicação autêntica, não manipulação

Retorne SOMENTE um JSON válido com a estrutura:
{
  "overallScore": number,
  "skills": { "confidence": number, "warmth": number, "curiosity": number, "calibration": number, "authenticity": number, "pressureLevel": number, "awkwardness": number, "emotionalIntelligence": number, "boundaryRespect": number, "conversationalMomentum": number },
  "perception": "string em português",
  "summary": "string em português",
  "messageAnalysis": [{ "messageIndex": number, "userMessage": "string", "impact": "positive|neutral|negative", "issues": ["string"] | null, "suggestion": "string" | null, "note": "string" }],
  "keyMoments": [{ "messageIndex": number, "type": "string", "description": "string em português" }],
  "improvements": ["string em português"]
}`;

  try {
    const feedback = await generateDetailedFeedback(prompt);

    // Ensure arrays exist even if LLM omits them
    feedback.messageAnalysis = feedback.messageAnalysis ?? [];
    feedback.keyMoments = (feedback.keyMoments ?? []).slice(0, 5);
    feedback.improvements = feedback.improvements ?? [];

    // Clamp skill scores to 0-100
    if (feedback.skills) {
      const skillKeys = Object.keys(feedback.skills) as (keyof SkillScores)[];
      for (const key of skillKeys) {
        feedback.skills[key] = Math.max(0, Math.min(100, Math.round(feedback.skills[key] ?? 50)));
      }
    }

    // Clamp overall score
    feedback.overallScore = Math.max(0, Math.min(100, Math.round(feedback.overallScore ?? 50)));

    // Compare with previous session if available
    if (previousSkills && feedback.skills) {
      feedback.comparedToPrevious = compareSkills(feedback.skills, previousSkills);
    }

    return feedback;
  } catch (error) {
    log.error("Failed to generate session feedback", error, { agentId: agent.id });

    // Return a minimal fallback so the caller always gets a valid structure
    const fallback: SessionFeedback = {
      overallScore: 50,
      skills: {
        confidence: 50,
        warmth: 50,
        curiosity: 50,
        calibration: 50,
        authenticity: 50,
        pressureLevel: 50,
        awkwardness: 50,
        emotionalIntelligence: 50,
        boundaryRespect: 50,
        conversationalMomentum: 50,
      },
      perception: "Não foi possível gerar a percepção do personagem.",
      summary: "Não foi possível gerar o resumo da sessão. Tente novamente.",
      messageAnalysis: [],
      keyMoments: [],
      improvements: [
        "Continue praticando conversas naturais.",
        "Preste atenção aos sinais da outra pessoa.",
        "Mantenha um tom leve e genuíno.",
      ],
    };

    if (previousSkills) {
      fallback.comparedToPrevious = compareSkills(fallback.skills, previousSkills);
    }

    return fallback;
  }
}

/**
 * Persist feedback to the ScenarioAttempt record.
 */
export async function saveFeedback(
  attemptId: string,
  feedback: SessionFeedback,
): Promise<void> {
  try {
    await prisma.scenarioAttempt.update({
      where: { id: attemptId },
      data: {
        feedback: JSON.parse(JSON.stringify(feedback)),
        score: JSON.parse(
          JSON.stringify({
            overallScore: feedback.adjustedOverallScore ?? feedback.overallScore,
            rawOverallScore: feedback.rawOverallScore ?? feedback.overallScore,
            skills: feedback.skills,
          }),
        ),
      },
    });
  } catch (error) {
    log.error("Failed to save feedback", error, { attemptId });
    throw error;
  }
}
