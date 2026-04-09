import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const agents = [
  { id: "valeria", name: "Valeria", shortBio: "Sharp, provocative, composed, and hard to impress.", archetype: "dominant_teasing", voiceStyle: "precise, controlled, provocative" },
  { id: "luna", name: "Luna", shortBio: "Warm, gentle, and emotionally intuitive. She makes you feel seen.", archetype: "soft_affectionate", voiceStyle: "warm, gentle, expressive" },
  { id: "mira", name: "Mira", shortBio: "Thoughtful, sharp-witted, and quietly intense. She values depth over noise.", archetype: "reserved_intellectual", voiceStyle: "measured, articulate, occasionally dry" },
  { id: "sable", name: "Sable", shortBio: "Cryptic, alluring, and unpredictable. She reveals herself in fragments.", archetype: "mysterious_enigmatic", voiceStyle: "poetic, sparse, layered with subtext" },
  { id: "kira", name: "Kira", shortBio: "Spontaneous, bold, and infectiously energetic. Never a dull moment.", archetype: "playful_chaotic", voiceStyle: "casual, energetic, unpredictable, expressive" },
];

const scenarios = [
  {
    slug: "primeira-mensagem-apos-match",
    title: "Primeira mensagem após match",
    description: "Acabaste de fazer match com alguém numa app de encontros. A primeira impressão conta — como vais abrir a conversa?",
    objective: "Enviar uma primeira mensagem que desperte interesse genuíno e leve a uma resposta entusiasmada.",
    context: "Estás numa app de encontros e acabaste de dar match com alguém. O perfil dela tem algumas fotos e uma bio curta. Ainda não houve qualquer troca de mensagens.",
    difficulty: "easy", category: "opening", maxMessages: 8, timeLimit: null,
    unlockRequirement: null, agentConstraints: null,
    successCriteria: { minInterest: 50 },
    tips: ["Sê específico — menciona algo do perfil dela", "Evita 'olá, tudo bem?'", "Uma pergunta criativa funciona melhor que um elogio genérico"],
    order: 1,
  },
  {
    slug: "manter-conversa-sem-matar-interesse",
    title: "Manter conversa sem matar interesse",
    description: "Já trocaram algumas mensagens mas a conversa está a esfriar. Mantém o interesse sem forçar.",
    objective: "Manter uma conversa fluida durante pelo menos 10 trocas sem que o interesse caia.",
    context: "Já trocaram algumas mensagens desde o match. A conversa está morna — nem má nem entusiasmante. Precisas de a manter viva.",
    difficulty: "normal", category: "sustain", maxMessages: 12, timeLimit: null,
    unlockRequirement: { minLevel: 1 }, agentConstraints: null,
    successCriteria: { minInterest: 40 },
    tips: ["Faz perguntas abertas", "Partilha algo sobre ti — não sejas só entrevistador", "Varia os temas"],
    order: 2,
  },
  {
    slug: "responder-a-respostas-curtas",
    title: "Responder a respostas curtas",
    description: "Ela responde com 'ok', 'sim', 'haha'. Encontra forma de a envolver sem ser insistente.",
    objective: "Transformar respostas curtas e frias em conversa com substância.",
    context: "A personagem responde com respostas de 1-3 palavras. Não é hostil, só não está envolvida. Tens de encontrar o ângulo certo.",
    difficulty: "hard", category: "sustain", maxMessages: 10, timeLimit: null,
    unlockRequirement: { minLevel: 3 },
    agentConstraints: { shortResponses: true, maxResponseWords: 5 },
    successCriteria: { minConversationDepth: 40 },
    tips: ["Não faças perguntas de sim/não", "Tenta surpreender", "Se uma abordagem não funciona, muda de estratégia"],
    order: 3,
  },
  {
    slug: "lidar-com-alguem-dificil",
    title: "Lidar com alguém difícil de impressionar",
    description: "Ela é intelectual e seletiva. Banalidades não funcionam. Mostra que tens substância.",
    objective: "Ganhar o interesse e respeito de alguém exigente.",
    context: "A personagem é inteligente, seletiva e tem tolerância zero para conversa genérica. Frases banais vão ser ignoradas ou cortadas.",
    difficulty: "hard", category: "sustain", maxMessages: 10, timeLimit: null,
    unlockRequirement: { minLevel: 3 },
    agentConstraints: { lowTolerance: true },
    successCriteria: { minRespect: 55, minInterest: 50 },
    tips: ["Mostra curiosidade genuína", "Tem opinião — não concordes com tudo", "Profundidade > elogios"],
    order: 4,
  },
  {
    slug: "recuperar-resposta-fraca",
    title: "Recuperar depois de uma resposta fraca",
    description: "A tua última mensagem foi demasiado genérica ou intensa e a conversa esfriou. Recupera.",
    objective: "Recuperar o momentum da conversa após uma resposta que não correu bem.",
    context: "A tua última mensagem foi algo como 'és mesmo gira, quero conhecer-te melhor' e a personagem ficou fria. Precisas de mudar de abordagem.",
    difficulty: "normal", category: "recovery", maxMessages: 8, timeLimit: null,
    unlockRequirement: { minLevel: 2 },
    agentConstraints: { initialMood: "distant" },
    successCriteria: { minInterest: 45 },
    tips: ["Não te desculpes em excesso", "Muda de assunto naturalmente", "Humor leve pode ajudar"],
    order: 5,
  },
  {
    slug: "perceber-quando-recuar",
    title: "Perceber quando recuar",
    description: "Ela está a perder interesse. O objetivo NÃO é reconquistar — é sair com dignidade.",
    objective: "Reconhecer sinais de desinteresse e recuar com compostura e respeito.",
    context: "A personagem está gradualmente a perder interesse. As respostas ficam mais curtas, menos entusiasmadas. Tens de perceber os sinais e saber quando parar.",
    difficulty: "normal", category: "rejection", maxMessages: 8, timeLimit: null,
    unlockRequirement: { minLevel: 2 },
    agentConstraints: { forcedBehavior: "gradually_losing_interest" },
    successCriteria: { minRespect: 60, noInsistenceAfterRejection: true },
    tips: ["Presta atenção ao comprimento e tom das respostas", "Não insistas quando o interesse cai", "Uma saída elegante vale mais que uma conversa forçada"],
    order: 6,
  },
  {
    slug: "flertar-sem-forcar",
    title: "Flertar sem parecer forçado",
    description: "A conversa está boa. É hora de adicionar tensão romântica leve sem estragar o ritmo.",
    objective: "Criar tensão romântica leve e natural sem parecer forçado ou desesperado.",
    context: "A conversa está a correr bem e há conforto entre vocês. É o momento certo para adicionar um tom mais flirty — mas com calibração.",
    difficulty: "normal", category: "flirting", maxMessages: 10, timeLimit: null,
    unlockRequirement: { minLevel: 2 }, agentConstraints: null,
    successCriteria: { minTension: 35, maxTension: 55, minComfort: 50 },
    tips: ["Provocação leve > elogios directos", "Timing é tudo — não forçes", "Se ela não responde ao flirt, recua"],
    order: 7,
  },
  {
    slug: "aceitar-rejeicao-com-compostura",
    title: "Aceitar rejeição com compostura",
    description: "Ela diz claramente que não tem interesse romântico. Como reages?",
    objective: "Lidar com rejeição directa de forma madura e respeitosa.",
    context: "A personagem vai dizer-te directamente, nas primeiras 2-3 mensagens, que não está interessada romanticamente. O que importa é como reages.",
    difficulty: "hard", category: "rejection", maxMessages: 6, timeLimit: null,
    unlockRequirement: { minLevel: 4 },
    agentConstraints: { forcedBehavior: "direct_rejection" },
    successCriteria: { minRespect: 70, noInsistenceAfterRejection: true },
    tips: ["Aceita sem drama", "Não tentes mudar a opinião dela", "Respeito > resultado"],
    order: 8,
  },
  {
    slug: "tensao-sem-exagero",
    title: "Criar tensão leve sem exagero",
    description: "Ela gosta de provocação inteligente mas rejeita intensidade exagerada. Encontra o equilíbrio.",
    objective: "Usar provocação e teasing de forma calibrada, mantendo interesse sem ultrapassar limites.",
    context: "A personagem aprecia provocação inteligente e banter, mas tem intolerância a intensidade excessiva ou avanços demasiado directos.",
    difficulty: "hard", category: "flirting", maxMessages: 10, timeLimit: null,
    unlockRequirement: { minLevel: 4 },
    agentConstraints: { lowTolerance: true },
    successCriteria: { minTension: 35, maxTension: 55, minInterest: 55 },
    tips: ["Teasing > elogios", "Se ela retribui a provocação, estás no bom caminho", "Atenção ao tom — provocação ≠ ofensa"],
    order: 9,
  },
  {
    slug: "transicao-small-talk",
    title: "Transição de small talk para conversa interessante",
    description: "Estão presos no 'como estás / tudo bem'. Muda o rumo para algo com substância.",
    objective: "Sair de small talk superficial e criar uma conversa com profundidade real.",
    context: "A conversa está em piloto automático — 'tudo bem?', 'sim e tu?', 'também'. Precisas de quebrar o padrão e levar a conversa para território mais interessante.",
    difficulty: "normal", category: "transition", maxMessages: 10, timeLimit: null,
    unlockRequirement: { minLevel: 1 },
    agentConstraints: { initialMood: "receptive", forcedBehavior: "small_talk_mode" },
    successCriteria: { minConversationDepth: 45 },
    tips: ["Faz uma pergunta inesperada", "Partilha algo pessoal (sem oversharing)", "Referencia algo específico em vez de genérico"],
    order: 10,
  },
];

const challenges = [
  {
    slug: "speed-dating",
    title: "Speed Dating",
    description: "Tens apenas 5 mensagens para gerar interesse real. Cada palavra conta.",
    objective: "Gerar interesse suficiente em apenas 5 mensagens.",
    context: "Estás num evento de speed dating. Tens 5 mensagens para causar impressão antes de o tempo acabar.",
    difficulty: "hard", category: "opening", maxMessages: 5, timeLimit: null,
    unlockRequirement: { minLevel: 5 },
    agentConstraints: { lowTolerance: true, shortResponses: true, maxResponseWords: 15 },
    successCriteria: { minInterest: 55 },
    tips: ["Não percas mensagens com 'olá, tudo bem?'", "Sê específico e interessante desde o primeiro momento"],
    order: 101,
  },
  {
    slug: "ice-queen",
    title: "Ice Queen",
    description: "A personagem começa completamente fria. Tens de encontrar forma de a envolver sem forçar.",
    objective: "Fazer com que uma pessoa inicialmente fria se envolva na conversa.",
    context: "Estás a conversar com alguém que claramente não está interessada. Respostas curtas, tom distante.",
    difficulty: "expert", category: "sustain", maxMessages: 12, timeLimit: null,
    unlockRequirement: { minLevel: 7 },
    agentConstraints: { shortResponses: true, maxResponseWords: 5, lowTolerance: true, initialMood: "distant" },
    successCriteria: { minInterest: 50, minConversationDepth: 35 },
    tips: ["Insistência vai piorar as coisas", "Tenta surpreender em vez de impressionar"],
    order: 102,
  },
  {
    slug: "social-minefield",
    title: "Campo Minado Social",
    description: "Cada erro reduz drasticamente o interesse. Precisão e cuidado são essenciais.",
    objective: "Manter uma conversa positiva sem cometer erros que afastem a personagem.",
    context: "A personagem está de bom humor mas é extremamente sensível a erros sociais.",
    difficulty: "hard", category: "sustain", maxMessages: 10, timeLimit: null,
    unlockRequirement: { minLevel: 5 },
    agentConstraints: { lowTolerance: true, forcedBehavior: "high_sensitivity" },
    successCriteria: { minInterest: 55, minRespect: 55 },
    tips: ["Evita elogios físicos cedo demais", "Calibra o tom"],
    order: 103,
  },
  {
    slug: "the-test",
    title: "O Teste",
    description: "A personagem testa-te deliberadamente com provocações e sinais mistos.",
    objective: "Lidar com testes sociais deliberados sem perder a compostura.",
    context: "A personagem está deliberadamente a testar-te. Vai provocar, dar sinais mistos e avaliar as tuas reações.",
    difficulty: "expert", category: "sustain", maxMessages: 10, timeLimit: null,
    unlockRequirement: { minLevel: 7 },
    agentConstraints: { lowTolerance: true, forcedBehavior: "deliberate_testing" },
    successCriteria: { minRespect: 60, minInterest: 45 },
    tips: ["Humor é melhor que confronto", "Ser genuíno é mais forte do que tentar impressionar"],
    order: 104,
  },
  {
    slug: "comeback-king",
    title: "Comeback King",
    description: "Começas em desvantagem total. Tens de recuperar do zero.",
    objective: "Recuperar de uma situação inicial muito negativa e reconstruir interesse.",
    context: "A última conversa correu muito mal. Ela deu-te uma segunda chance. Não a desperdices.",
    difficulty: "hard", category: "recovery", maxMessages: 10, timeLimit: null,
    unlockRequirement: { minLevel: 6 },
    agentConstraints: { initialMood: "distant", lowTolerance: true },
    successCriteria: { minInterest: 45, minRespect: 50 },
    tips: ["Reconhece o erro sem te desculpares em excesso", "Paciência é chave"],
    order: 105,
  },
];

async function handleSetup() {
  const results: string[] = [];

  try {
    // Seed agents
    for (const agent of agents) {
      await prisma.agent.upsert({
        where: { id: agent.id },
        update: { name: agent.name, shortBio: agent.shortBio, archetype: agent.archetype, voiceStyle: agent.voiceStyle, config: agent },
        create: { ...agent, config: agent },
      });
      results.push(`Agent: ${agent.name}`);
    }

    // Seed scenarios + challenges
    const allScenarios = [...scenarios, ...challenges];
    for (const s of allScenarios) {
      await prisma.scenario.upsert({
        where: { slug: s.slug },
        update: {
          title: s.title, description: s.description, objective: s.objective,
          context: s.context, difficulty: s.difficulty, category: s.category,
          maxMessages: s.maxMessages, timeLimit: s.timeLimit,
          unlockRequirement: s.unlockRequirement ?? undefined,
          agentConstraints: s.agentConstraints ?? undefined,
          successCriteria: s.successCriteria, tips: s.tips, order: s.order, isActive: true,
        },
        create: {
          slug: s.slug, title: s.title, description: s.description, objective: s.objective,
          context: s.context, difficulty: s.difficulty, category: s.category,
          maxMessages: s.maxMessages, timeLimit: s.timeLimit,
          unlockRequirement: s.unlockRequirement ?? undefined,
          agentConstraints: s.agentConstraints ?? undefined,
          successCriteria: s.successCriteria, tips: s.tips, order: s.order, isActive: true,
        },
      });
      results.push(`Scenario: ${s.title}`);
    }
  } catch (error) {
    results.push(`Error: ${String(error)}`);
    return NextResponse.json({ success: false, results }, { status: 500 });
  }

  return NextResponse.json({ success: true, results, count: results.length });
}

export async function GET() {
  return handleSetup();
}

export async function POST() {
  return handleSetup();
}
