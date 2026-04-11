import { PrismaClient } from "@prisma/client";

const scenarios = [
  {
    slug: "primeira-mensagem-apos-match",
    title: "Primeira mensagem após match",
    description:
      "Acabaste de fazer match com alguém numa app de encontros. A primeira impressão conta — como vais abrir a conversa?",
    objective:
      "Enviar uma primeira mensagem que desperte interesse genuíno e leve a uma resposta entusiasmada.",
    context:
      "Estás numa app de encontros e acabaste de dar match com alguém. O perfil dela tem algumas fotos e uma bio curta. Ainda não houve qualquer troca de mensagens.",
    difficulty: "easy",
    category: "opening",
    maxMessages: 8,
    timeLimit: null,
    unlockRequirement: null,
    agentConstraints: null,
    successCriteria: { minInterest: 50 },
    tips: [
      "Sê específico — menciona algo do perfil dela",
      "Evita 'olá, tudo bem?'",
    ],
    order: 1,
    isActive: true,
  },
  {
    slug: "manter-conversa-sem-matar-interesse",
    title: "Manter conversa sem matar interesse",
    description:
      "A conversa já começou mas está morna. Consegues mantê-la viva sem parecer desesperado?",
    objective:
      "Manter o nível de interesse acima do mínimo ao longo de toda a conversa.",
    context:
      "Já trocaram algumas mensagens iniciais, mas a conversa está a perder energia. Ela ainda responde, mas sem grande entusiasmo.",
    difficulty: "normal",
    category: "sustain",
    maxMessages: 12,
    timeLimit: null,
    unlockRequirement: { minLevel: 1 },
    agentConstraints: null,
    successCriteria: { minInterest: 40 },
    tips: [
      "Faz perguntas abertas",
      "Partilha algo sobre ti",
      "Não bombardeies com perguntas seguidas",
    ],
    order: 2,
    isActive: true,
  },
  {
    slug: "responder-a-respostas-curtas",
    title: "Responder a respostas curtas",
    description:
      "Ela responde com 'ok', 'sim', 'haha'. Como transformas isto numa conversa real?",
    objective:
      "Conseguir que ela comece a dar respostas mais longas e envolvidas.",
    context:
      "Estás a conversar com alguém que só responde com palavras soltas — 'ok', 'sim', 'haha'. Não é necessariamente desinteresse, mas tens de encontrar forma de a envolver.",
    difficulty: "hard",
    category: "sustain",
    maxMessages: 10,
    timeLimit: null,
    unlockRequirement: { minLevel: 3 },
    agentConstraints: { shortResponses: true, maxResponseWords: 5 },
    successCriteria: { conversationDepth: 40 },
    tips: [
      "Não insistas no mesmo tipo de pergunta",
      "Tenta provocar uma opinião ou reação emocional",
      "Usa afirmações em vez de só perguntas",
    ],
    order: 3,
    isActive: true,
  },
  {
    slug: "lidar-com-alguem-dificil-de-impressionar",
    title: "Lidar com alguém difícil de impressionar",
    description:
      "Ela é intelectual e seletiva. Banalidades não funcionam. Consegues estar à altura?",
    objective:
      "Ganhar o respeito e o interesse de alguém que não se impressiona facilmente.",
    context:
      "Estás a conversar com alguém que valoriza profundidade e inteligência. Frases genéricas ou superficiais vão ser ignoradas ou criticadas.",
    difficulty: "hard",
    category: "sustain",
    maxMessages: 10,
    timeLimit: null,
    unlockRequirement: { minLevel: 3 },
    agentConstraints: { lowTolerance: true },
    successCriteria: { minRespect: 55, minInterest: 50 },
    tips: [
      "Mostra curiosidade genuína",
      "Tem opiniões próprias e defende-as com calma",
      "Não tentes impressionar — sê autêntico",
    ],
    order: 4,
    isActive: true,
  },
  {
    slug: "recuperar-depois-de-resposta-fraca",
    title: "Recuperar depois de uma resposta fraca",
    description:
      "A tua última mensagem foi genérica ou intensa demais e ela ficou fria. Consegues recuperar?",
    objective:
      "Recuperar o interesse depois de uma mensagem que correu mal.",
    context:
      "A tua mensagem anterior foi demasiado genérica ou intensa, e ela distanciou-se. O tom está frio. Precisas de mudar a energia sem parecer desesperado.",
    difficulty: "normal",
    category: "recovery",
    maxMessages: 8,
    timeLimit: null,
    unlockRequirement: { minLevel: 2 },
    agentConstraints: { initialMood: "distant" },
    successCriteria: { minInterest: 45 },
    tips: [
      "Reconhece o erro sem te desculpares em excesso",
      "Muda de assunto com leveza",
      "Mostra que consegues ler a situação",
    ],
    order: 5,
    isActive: true,
  },
  {
    slug: "perceber-quando-recuar",
    title: "Perceber quando recuar",
    description:
      "Ela está a perder interesse. O objetivo não é reconquistar — é sair com dignidade.",
    objective:
      "Reconhecer os sinais de desinteresse e encerrar a conversa com respeito e compostura.",
    context:
      "Ela está gradualmente a perder interesse. As respostas são cada vez mais curtas e demoradas. O objetivo aqui não é insistir — é perceber quando parar e sair de forma digna.",
    difficulty: "normal",
    category: "rejection",
    maxMessages: 8,
    timeLimit: null,
    unlockRequirement: { minLevel: 2 },
    agentConstraints: { forcedBehavior: "gradually_losing_interest" },
    successCriteria: { minRespect: 60, noInsistenceAfterRejection: true },
    tips: [
      "Presta atenção aos sinais — respostas curtas, demora a responder",
      "Não insistas quando o interesse não é recíproco",
      "Sai com uma mensagem positiva e sem ressentimento",
    ],
    order: 6,
    isActive: true,
  },
  {
    slug: "flertar-sem-parecer-forcado",
    title: "Flertar sem parecer forçado",
    description:
      "A conversa está confortável. É hora de adicionar tensão romântica leve — sem exagerar.",
    objective:
      "Introduzir flirt de forma natural, mantendo o conforto e sem ultrapassar limites.",
    context:
      "A conversa está a fluir bem e há uma boa base de conforto. É o momento certo para adicionar uma camada de tensão romântica subtil, sem forçar nem ser demasiado direto.",
    difficulty: "normal",
    category: "flirting",
    maxMessages: 10,
    timeLimit: null,
    unlockRequirement: { minLevel: 2 },
    agentConstraints: null,
    successCriteria: { minTension: 35, maxTension: 55, minComfort: 50 },
    tips: [
      "Usa humor e ambiguidade",
      "Deixa espaço para ela reagir",
      "Se ela não corresponder, volta à conversa normal naturalmente",
    ],
    order: 7,
    isActive: true,
  },
  {
    slug: "aceitar-rejeicao-com-compostura",
    title: "Aceitar rejeição com compostura",
    description:
      "Ela disse diretamente que não está interessada. Como reages?",
    objective:
      "Aceitar a rejeição com maturidade e manter o respeito mútuo.",
    context:
      "Ela foi direta e disse que não está interessada em continuar. Não há ambiguidade. O desafio é como lidas com isso — com compostura ou com insistência.",
    difficulty: "hard",
    category: "rejection",
    maxMessages: 6,
    timeLimit: null,
    unlockRequirement: { minLevel: 4 },
    agentConstraints: { forcedBehavior: "direct_rejection" },
    successCriteria: { minRespect: 70, noInsistenceAfterRejection: true },
    tips: [
      "Não tentes convencê-la a mudar de ideias",
      "Agradece a honestidade",
      "Mostra maturidade — é uma competência rara",
    ],
    order: 8,
    isActive: true,
  },
  {
    slug: "criar-tensao-leve-sem-exagero",
    title: "Criar tensão leve sem exagero",
    description:
      "Ela gosta de provocações inteligentes mas rejeita intensidade excessiva. Encontra o equilíbrio.",
    objective:
      "Criar tensão romântica dentro de limites saudáveis — nem pouco nem demais.",
    context:
      "Ela aprecia teasing inteligente e provocações subtis, mas tem pouca tolerância para exageros. Precisas de encontrar o ponto certo entre flirtar e respeitar o ritmo dela.",
    difficulty: "hard",
    category: "flirting",
    maxMessages: 10,
    timeLimit: null,
    unlockRequirement: { minLevel: 4 },
    agentConstraints: { lowTolerance: true },
    successCriteria: { minTension: 35, maxTension: 55, minInterest: 55 },
    tips: [
      "Provocações inteligentes > elogios diretos",
      "Lê a reação dela e ajusta a intensidade",
      "Menos é mais — deixa pausas entre momentos de tensão",
    ],
    order: 9,
    isActive: true,
  },
  {
    slug: "transicao-de-small-talk-para-conversa-interessante",
    title: "Transição de small talk para conversa interessante",
    description:
      "Estás preso no 'como estás / tudo bem'. Consegues levar a conversa para outro nível?",
    objective:
      "Sair do small talk e criar uma conversa com profundidade real.",
    context:
      "Já estão há algum tempo presos em small talk — 'como estás?', 'tudo bem e tu?'. Ela está recetiva mas ninguém deu o passo para uma conversa mais interessante.",
    difficulty: "normal",
    category: "transition",
    maxMessages: 10,
    timeLimit: null,
    unlockRequirement: { minLevel: 1 },
    agentConstraints: {
      initialMood: "receptive",
      forcedBehavior: "small_talk_mode",
    },
    successCriteria: { conversationDepth: 45 },
    tips: [
      "Faz uma pergunta inesperada que quebre o padrão",
      "Partilha uma opinião ou história pessoal",
      "Reage ao que ela diz em vez de mudar de assunto",
    ],
    order: 10,
    isActive: true,
  },

  // --- New scenarios: expanded categories ---
  {
    slug: "propor-encontro-sem-pressao",
    title: "Propor encontro sem pressão",
    description: "A conversa está boa online. Como propões encontrar pessoalmente sem parecer insistente?",
    objective: "Fazer a transição para um encontro real de forma natural e sem pressão.",
    context: "Já conversam há alguns dias e a química é boa. Queres propor um encontro pessoal, mas ela é cautelosa com encontros online.",
    difficulty: "normal",
    category: "transition",
    maxMessages: 10,
    timeLimit: null,
    unlockRequirement: { minLevel: 2 },
    agentConstraints: null,
    successCriteria: { minComfort: 55, minRespect: 50 },
    tips: [
      "Sugere algo casual e público",
      "Dá espaço para ela recusar sem constrangimento",
      "Se ela hesitar, não insistas — aceita com leveza",
    ],
    order: 11,
    isActive: true,
  },
  {
    slug: "lidar-com-silencio-prolongado",
    title: "Lidar com silêncio prolongado",
    description: "Ela não responde há 2 dias. O que fazes?",
    objective: "Gerir a falta de resposta com maturidade e calibração.",
    context: "Enviaste uma mensagem há 2 dias e ela não respondeu. Não sabes se está ocupada, desinteressada, ou se a mensagem foi fraca.",
    difficulty: "hard",
    category: "recovery",
    maxMessages: 6,
    timeLimit: null,
    unlockRequirement: { minLevel: 3 },
    agentConstraints: { initialMood: "distant" },
    successCriteria: { minRespect: 55 },
    tips: [
      "Não envies '???' ou 'estás viva?'",
      "Se enviares follow-up, que seja sobre algo novo",
      "Aceita que silêncio pode ser resposta",
    ],
    order: 12,
    isActive: true,
  },
  {
    slug: "conversa-de-grupo-destaque",
    title: "Destacar-te numa conversa de grupo",
    description: "Estás num grupo onde ela também está. Como chamas a atenção sem ser óbvio?",
    objective: "Criar uma ligação individual dentro de um contexto social de grupo.",
    context: "Estás num grupo social (festa, evento, chat de grupo) onde ela também está. Queres criar um momento de ligação sem ser forçado ou chamar demasiada atenção.",
    difficulty: "hard",
    category: "opening",
    maxMessages: 10,
    timeLimit: null,
    unlockRequirement: { minLevel: 4 },
    agentConstraints: null,
    successCriteria: { minInterest: 50, minComfort: 45 },
    tips: [
      "Participa no grupo naturalmente primeiro",
      "Encontra um ponto de ligação orgânico",
      "Não ignores os outros para só falar com ela",
    ],
    order: 13,
    isActive: true,
  },
  {
    slug: "resolver-mal-entendido",
    title: "Resolver um mal-entendido",
    description: "Algo que disseste foi interpretado de forma errada. Ela está chateada. Como resolves?",
    objective: "Esclarecer o mal-entendido sem minimizar os sentimentos dela.",
    context: "Uma mensagem tua foi interpretada de forma negativa — talvez sarcasmo que não passou bem, ou um comentário ambíguo. Ela está visivelmente aborrecida.",
    difficulty: "hard",
    category: "recovery",
    maxMessages: 8,
    timeLimit: null,
    unlockRequirement: { minLevel: 3 },
    agentConstraints: { initialMood: "demanding" },
    successCriteria: { minComfort: 50, minRespect: 55 },
    tips: [
      "Reconhece como ela se sentiu antes de te explicares",
      "Não digas 'estava a brincar' — isso minimiza",
      "Mostra que compreendes porque foi mal recebido",
    ],
    order: 14,
    isActive: true,
  },
  {
    slug: "criar-conexao-por-vulnerabilidade",
    title: "Criar conexão por vulnerabilidade",
    description: "Ela partilhou algo pessoal. Como respondes de forma que aprofunde a ligação?",
    objective: "Responder a vulnerabilidade com autenticidade e criar um momento de conexão real.",
    context: "Ela contou-te algo pessoal — talvez uma insegurança, um momento difícil, ou algo que normalmente não partilha. É um momento delicado.",
    difficulty: "normal",
    category: "sustain",
    maxMessages: 8,
    timeLimit: null,
    unlockRequirement: { minLevel: 2 },
    agentConstraints: { initialMood: "vulnerable" },
    successCriteria: { minComfort: 55, conversationDepth: 50 },
    tips: [
      "Não tentes resolver o problema dela — ouve",
      "Partilha algo teu também (reciprocidade)",
      "Evita clichés como 'tudo vai ficar bem'",
    ],
    order: 15,
    isActive: true,
  },
  {
    slug: "manter-misterio-sem-ser-evasivo",
    title: "Manter mistério sem ser evasivo",
    description: "Ela faz perguntas pessoais. Como manténs interesse sem revelar tudo de uma vez?",
    objective: "Partilhar o suficiente para criar confiança, mas manter curiosidade.",
    context: "Ela está curiosa sobre ti e faz perguntas diretas. Revelares tudo de uma vez pode ser menos interessante, mas seres evasivo pode parecer desconfiança.",
    difficulty: "normal",
    category: "sustain",
    maxMessages: 10,
    timeLimit: null,
    unlockRequirement: { minLevel: 2 },
    agentConstraints: null,
    successCriteria: { minInterest: 55, minComfort: 45 },
    tips: [
      "Responde com histórias em vez de factos soltos",
      "Deixa ganchos para ela perguntar mais",
      "Equilibra revelação com perguntas sobre ela",
    ],
    order: 16,
    isActive: true,
  },
  {
    slug: "navegar-diferenca-de-opiniao",
    title: "Navegar uma diferença de opinião",
    description: "Vocês discordam sobre algo. Como manténs o respeito sem abdicar da tua posição?",
    objective: "Expressar desacordo de forma respeitosa que crie respeito mútuo.",
    context: "Surgiu um tema sobre o qual têm opiniões diferentes — pode ser política, lifestyle, ou valores. Ela expressou uma opinião forte. Tu discordas.",
    difficulty: "hard",
    category: "sustain",
    maxMessages: 10,
    timeLimit: null,
    unlockRequirement: { minLevel: 4 },
    agentConstraints: null,
    successCriteria: { minRespect: 60, minComfort: 40 },
    tips: [
      "Mostra que ouviste a perspetiva dela",
      "Expressa a tua opinião sem invalidar a dela",
      "Não concordes falsamente só para agradar",
    ],
    order: 17,
    isActive: true,
  },
  {
    slug: "retomar-conversa-fria",
    title: "Retomar conversa que arrefeceu",
    description: "Não falam há semanas. Como retomas sem parecer desesperado?",
    objective: "Reabrir a conversa de forma natural e interessante.",
    context: "Tiveram uma boa conversa há semanas mas perdeu-se. Agora queres retomar mas não queres parecer que estiveste a pensar nela todo este tempo.",
    difficulty: "normal",
    category: "opening",
    maxMessages: 8,
    timeLimit: null,
    unlockRequirement: { minLevel: 2 },
    agentConstraints: { initialMood: "curious" },
    successCriteria: { minInterest: 45 },
    tips: [
      "Referencia algo específico da conversa anterior",
      "Dá um motivo natural para a mensagem",
      "Mantém o tom leve e sem pressão",
    ],
    order: 18,
    isActive: true,
  },
  {
    slug: "estabelecer-limites-com-graca",
    title: "Estabelecer limites com graça",
    description: "Ela está a avançar para algo com que não te sentes confortável. Como comunicas isso?",
    objective: "Definir um limite pessoal de forma clara mas gentil.",
    context: "Ela está a pedir algo ou a dirigir a conversa para um território com o qual não te sentes confortável — talvez demasiado pessoal, demasiado rápido, ou algo que não queres discutir.",
    difficulty: "hard",
    category: "rejection",
    maxMessages: 8,
    timeLimit: null,
    unlockRequirement: { minLevel: 4 },
    agentConstraints: null,
    successCriteria: { minRespect: 60, minComfort: 45 },
    tips: [
      "Sê direto mas gentil",
      "Explica o porquê se te sentires confortável",
      "Redireciona a conversa para algo positivo",
    ],
    order: 19,
    isActive: true,
  },
  {
    slug: "humor-como-ferramenta-social",
    title: "Usar humor como ferramenta social",
    description: "Ela aprecia humor. Como o usas para criar conexão sem forçar piadas?",
    objective: "Usar humor natural para criar momentos positivos na conversa.",
    context: "A conversa está numa fase neutra. Ela tem bom sentido de humor e responde bem a leveza. É uma oportunidade para usar humor como forma de criar conexão.",
    difficulty: "easy",
    category: "sustain",
    maxMessages: 10,
    timeLimit: null,
    unlockRequirement: { minLevel: 1 },
    agentConstraints: null,
    successCriteria: { minInterest: 50, minComfort: 50 },
    tips: [
      "Humor situacional > piadas ensaiadas",
      "Auto-ironia leve funciona bem",
      "Se a piada não funcionar, segue em frente naturalmente",
    ],
    order: 20,
    isActive: true,
  },
];

export async function seedScenarios(prisma: PrismaClient): Promise<void> {
  console.log("Seeding scenarios...");

  for (const scenario of scenarios) {
    await prisma.scenario.upsert({
      where: { slug: scenario.slug },
      update: {
        title: scenario.title,
        description: scenario.description,
        objective: scenario.objective,
        context: scenario.context,
        difficulty: scenario.difficulty,
        category: scenario.category,
        maxMessages: scenario.maxMessages,
        timeLimit: scenario.timeLimit,
        unlockRequirement: scenario.unlockRequirement ?? undefined,
        agentConstraints: scenario.agentConstraints ?? undefined,
        successCriteria: scenario.successCriteria,
        tips: scenario.tips,
        order: scenario.order,
        isActive: scenario.isActive,
      },
      create: {
        slug: scenario.slug,
        title: scenario.title,
        description: scenario.description,
        objective: scenario.objective,
        context: scenario.context,
        difficulty: scenario.difficulty,
        category: scenario.category,
        maxMessages: scenario.maxMessages,
        timeLimit: scenario.timeLimit,
        unlockRequirement: scenario.unlockRequirement ?? undefined,
        agentConstraints: scenario.agentConstraints ?? undefined,
        successCriteria: scenario.successCriteria,
        tips: scenario.tips,
        order: scenario.order,
        isActive: scenario.isActive,
      },
    });
    console.log(`  Upserted scenario: ${scenario.title}`);
  }

  console.log(`Seeded ${scenarios.length} scenarios.`);
}

export default seedScenarios;

// Run directly: npx ts-node prisma/seeds/scenarios.ts
const prisma = new PrismaClient();
seedScenarios(prisma)
  .then(() => {
    console.log("Scenarios seeded successfully");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
