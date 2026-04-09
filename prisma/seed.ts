import { PrismaClient } from "@prisma/client";

// Import agent configs directly to avoid path alias issues in ts-node
const prisma = new PrismaClient();

const agents = [
  {
    id: "valeria",
    name: "Valeria",
    shortBio: "Sharp, provocative, composed, and hard to impress.",
    archetype: "dominant_teasing",
    voiceStyle: "precise, controlled, provocative",
  },
  {
    id: "luna",
    name: "Luna",
    shortBio: "Warm, gentle, and emotionally intuitive. She makes you feel seen.",
    archetype: "soft_affectionate",
    voiceStyle: "warm, gentle, expressive",
  },
  {
    id: "mira",
    name: "Mira",
    shortBio: "Thoughtful, sharp-witted, and quietly intense. She values depth over noise.",
    archetype: "reserved_intellectual",
    voiceStyle: "measured, articulate, occasionally dry",
  },
  {
    id: "sable",
    name: "Sable",
    shortBio: "Cryptic, alluring, and unpredictable. She reveals herself in fragments.",
    archetype: "mysterious_enigmatic",
    voiceStyle: "poetic, sparse, layered with subtext",
  },
  {
    id: "kira",
    name: "Kira",
    shortBio: "Spontaneous, bold, and infectiously energetic. Never a dull moment.",
    archetype: "playful_chaotic",
    voiceStyle: "casual, energetic, unpredictable, expressive",
  },
];

async function main() {
  console.log("Seeding database...");

  // Create test user
  const user = await prisma.user.upsert({
    where: { username: "test-user" },
    update: {},
    create: { username: "test-user" },
  });
  console.log(`Created test user: ${user.id}`);

  // Create agents
  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { id: agent.id },
      update: {
        name: agent.name,
        shortBio: agent.shortBio,
        archetype: agent.archetype,
        voiceStyle: agent.voiceStyle,
        config: agent,
      },
      create: {
        id: agent.id,
        name: agent.name,
        shortBio: agent.shortBio,
        archetype: agent.archetype,
        voiceStyle: agent.voiceStyle,
        config: agent,
      },
    });
    console.log(`Upserted agent: ${agent.name}`);
  }

  // Seed scenarios
  console.log("Seeding scenarios...");
  const { seedScenarios } = await import("./seeds/scenarios");
  await seedScenarios(prisma);

  // Seed challenges
  console.log("Seeding challenges...");
  const { seedChallenges } = await import("./seeds/challenges");
  await seedChallenges(prisma);

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
