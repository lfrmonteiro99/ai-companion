import { PrismaClient } from "@prisma/client";

const challenges = [
  {
    slug: "speed-dating",
    title: "Speed Dating",
    description: "Tens apenas 5 mensagens para gerar interesse real. Cada palavra conta.",
    objective: "Gerar interesse suficiente em apenas 5 mensagens.",
    context: "Estás num evento de speed dating. Tens 5 mensagens para causar impressão antes de o tempo acabar. A personagem não te vai facilitar — precisa de ser convencida.",
    difficulty: "hard",
    category: "opening",
    maxMessages: 5,
    timeLimit: null,
    unlockRequirement: { minLevel: 5 },
    agentConstraints: { lowTolerance: true, shortResponses: true, maxResponseWords: 15 },
    successCriteria: { minInterest: 55 },
    tips: [
      "Não percas mensagens com 'olá, tudo bem?'",
      "Sê específico e interessante desde o primeiro momento",
      "5 mensagens passam rápido — cada uma tem de ter impacto",
    ],
    order: 101,
    isActive: true,
  },
  {
    slug: "ice-queen",
    title: "Ice Queen",
    description: "A personagem começa completamente fria. Tens de encontrar forma de a envolver sem forçar.",
    objective: "Fazer com que uma pessoa inicialmente fria se envolva na conversa.",
    context: "Estás a conversar com alguém que claramente não está interessada. Respostas curtas, tom distante. Tens de encontrar o ângulo certo para a envolver — sem ser insistente ou desesperado.",
    difficulty: "expert",
    category: "sustain",
    maxMessages: 12,
    timeLimit: null,
    unlockRequirement: { minLevel: 7 },
    agentConstraints: { shortResponses: true, maxResponseWords: 5, lowTolerance: true, initialMood: "distant" },
    successCriteria: { minInterest: 50, minConversationDepth: 35 },
    tips: [
      "Insistência vai piorar as coisas",
      "Tenta surpreender em vez de impressionar",
      "Às vezes menos é mais — não enches de mensagens longas",
    ],
    order: 102,
    isActive: true,
  },
  {
    slug: "social-minefield",
    title: "Campo Minado Social",
    description: "Cada erro reduz drasticamente o interesse. Precisão e cuidado são essenciais.",
    objective: "Manter uma conversa positiva sem cometer erros que afastem a personagem.",
    context: "A personagem está de bom humor mas é extremamente sensível a erros sociais. Uma frase demasiado intensa, um elogio genérico ou uma pergunta invasiva podem destruir o progresso todo. Cada palavra importa.",
    difficulty: "hard",
    category: "sustain",
    maxMessages: 10,
    timeLimit: null,
    unlockRequirement: { minLevel: 5 },
    agentConstraints: { lowTolerance: true, forcedBehavior: "high_sensitivity" },
    successCriteria: { minInterest: 55, minRespect: 55 },
    tips: [
      "Evita elogios físicos cedo demais",
      "Não faças perguntas demasiado pessoais",
      "Calibra o tom — nem demasiado intenso nem demasiado frio",
    ],
    order: 103,
    isActive: true,
  },
  {
    slug: "the-test",
    title: "O Teste",
    description: "A personagem testa-te deliberadamente com provocações e sinais mistos. Mantém a compostura.",
    objective: "Lidar com testes sociais deliberados sem perder a compostura nem cair em armadilhas.",
    context: "A personagem está deliberadamente a testar-te. Vai provocar, dar sinais mistos, fazer perguntas-armadilha e avaliar as tuas reações. O objectivo não é 'ganhar' — é manter autenticidade e compostura.",
    difficulty: "expert",
    category: "sustain",
    maxMessages: 10,
    timeLimit: null,
    unlockRequirement: { minLevel: 7 },
    agentConstraints: { lowTolerance: true, forcedBehavior: "deliberate_testing" },
    successCriteria: { minRespect: 60, minInterest: 45 },
    tips: [
      "Não reages defensivamente a provocações",
      "Humor é melhor que confronto",
      "Ser genuíno é mais forte do que tentar impressionar",
    ],
    order: 104,
    isActive: true,
  },
  {
    slug: "comeback-king",
    title: "Comeback King",
    description: "Começas em desvantagem total. Interest negativo. Tens de recuperar do zero.",
    objective: "Recuperar de uma situação inicial muito negativa e reconstruir interesse.",
    context: "A última conversa correu muito mal — foste demasiado intenso, disseste algo desajeitado e a personagem ficou com uma péssima impressão. Ela deu-te uma segunda chance por alguma razão. Não a desperdices.",
    difficulty: "hard",
    category: "recovery",
    maxMessages: 10,
    timeLimit: null,
    unlockRequirement: { minLevel: 6 },
    agentConstraints: { initialMood: "distant", lowTolerance: true },
    successCriteria: { minInterest: 45, minRespect: 50 },
    tips: [
      "Reconhece o erro sem te desculpares em excesso",
      "Mostra que mudaste o tom, não digas que mudaste",
      "Paciência é chave — não tentes recuperar tudo de uma vez",
    ],
    order: 105,
    isActive: true,
  },
];

export async function seedChallenges(prisma: PrismaClient): Promise<void> {
  console.log("Seeding challenges...");

  for (const challenge of challenges) {
    await prisma.scenario.upsert({
      where: { slug: challenge.slug },
      update: {
        title: challenge.title,
        description: challenge.description,
        objective: challenge.objective,
        context: challenge.context,
        difficulty: challenge.difficulty,
        category: challenge.category,
        maxMessages: challenge.maxMessages,
        timeLimit: challenge.timeLimit,
        unlockRequirement: challenge.unlockRequirement,
        agentConstraints: challenge.agentConstraints,
        successCriteria: challenge.successCriteria,
        tips: challenge.tips,
        order: challenge.order,
        isActive: challenge.isActive,
      },
      create: challenge,
    });
    console.log(`  ✓ ${challenge.title}`);
  }

  console.log("Challenges seeded successfully!");
}

export default seedChallenges;

// Run directly: npx ts-node prisma/seeds/challenges.ts
const prisma = new PrismaClient();
seedChallenges(prisma)
  .then(() => {
    console.log("Done");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
