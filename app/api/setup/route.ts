import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Each statement runs individually (PgBouncer doesn't support multi-statement queries)
const statements = [
  `CREATE TABLE IF NOT EXISTS "User" ("id" TEXT NOT NULL, "username" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "User_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Agent" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "shortBio" TEXT NOT NULL, "archetype" TEXT NOT NULL, "voiceStyle" TEXT NOT NULL, "config" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Agent_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Conversation" ("id" TEXT NOT NULL, "userId" TEXT NOT NULL, "agentId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Message" ("id" TEXT NOT NULL, "conversationId" TEXT NOT NULL, "senderRole" TEXT NOT NULL, "content" TEXT NOT NULL, "toneClassification" TEXT, "responseMetadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Message_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "RelationshipState" ("id" TEXT NOT NULL, "userId" TEXT NOT NULL, "agentId" TEXT NOT NULL, "interest" INTEGER NOT NULL DEFAULT 30, "trust" INTEGER NOT NULL DEFAULT 20, "comfort" INTEGER NOT NULL DEFAULT 20, "tension" INTEGER NOT NULL DEFAULT 30, "respect" INTEGER NOT NULL DEFAULT 30, "attachment" INTEGER NOT NULL DEFAULT 10, "emotionalOpenness" INTEGER NOT NULL DEFAULT 15, "conversationDepth" INTEGER NOT NULL DEFAULT 10, "initiativeBalance" TEXT NOT NULL DEFAULT 'user_leads', "dynamicAlignment" INTEGER NOT NULL DEFAULT 30, "stage" INTEGER NOT NULL DEFAULT 0, "currentMood" TEXT NOT NULL DEFAULT 'receptive', "lastInteractionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "RelationshipState_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Memory" ("id" TEXT NOT NULL, "userId" TEXT NOT NULL, "agentId" TEXT NOT NULL, "type" TEXT NOT NULL, "content" TEXT NOT NULL, "salience" DOUBLE PRECISION NOT NULL, "confidence" DOUBLE PRECISION NOT NULL, "emotionalWeight" DOUBLE PRECISION NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Memory_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Milestone" ("id" TEXT NOT NULL, "userId" TEXT NOT NULL, "agentId" TEXT NOT NULL, "type" TEXT NOT NULL, "label" TEXT NOT NULL, "detail" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id"))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Conversation_userId_agentId_key" ON "Conversation"("userId", "agentId")`,
  `CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "RelationshipState_userId_agentId_key" ON "RelationshipState"("userId", "agentId")`,
  `CREATE INDEX IF NOT EXISTS "Memory_userId_agentId_type_idx" ON "Memory"("userId", "agentId", "type")`,
  `CREATE INDEX IF NOT EXISTS "Milestone_userId_agentId_idx" ON "Milestone"("userId", "agentId")`,
  `DO $$ BEGIN ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN ALTER TABLE "RelationshipState" ADD CONSTRAINT "RelationshipState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN ALTER TABLE "RelationshipState" ADD CONSTRAINT "RelationshipState_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN ALTER TABLE "Memory" ADD CONSTRAINT "Memory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN ALTER TABLE "Memory" ADD CONSTRAINT "Memory_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
];

const agents = [
  { id: "valeria", name: "Valeria", shortBio: "Sharp, provocative, composed, and hard to impress.", archetype: "dominant_teasing", voiceStyle: "precise, controlled, provocative" },
  { id: "luna", name: "Luna", shortBio: "Warm, gentle, and emotionally intuitive. She makes you feel seen.", archetype: "soft_affectionate", voiceStyle: "warm, gentle, expressive" },
  { id: "mira", name: "Mira", shortBio: "Thoughtful, sharp-witted, and quietly intense. She values depth over noise.", archetype: "reserved_intellectual", voiceStyle: "measured, articulate, occasionally dry" },
  { id: "sable", name: "Sable", shortBio: "Cryptic, alluring, and unpredictable. She reveals herself in fragments.", archetype: "mysterious_enigmatic", voiceStyle: "poetic, sparse, layered with subtext" },
  { id: "kira", name: "Kira", shortBio: "Spontaneous, bold, and infectiously energetic. Never a dull moment.", archetype: "playful_chaotic", voiceStyle: "casual, energetic, unpredictable, expressive" },
];

async function handleSetup() {
  const results: string[] = [];

  // Step 1: Run each SQL statement one at a time (PgBouncer requirement)
  try {
    for (let i = 0; i < statements.length; i++) {
      await prisma.$executeRawUnsafe(statements[i]);
    }
    results.push("All tables, indexes, and foreign keys created");
  } catch (error) {
    results.push(`Migration error: ${String(error)}`);
    return NextResponse.json({ success: false, results }, { status: 500 });
  }

  // Step 2: Seed data
  try {
    const user = await prisma.user.upsert({
      where: { username: "test-user" },
      update: {},
      create: { username: "test-user" },
    });
    results.push(`Test user: ${user.id}`);

    for (const agent of agents) {
      await prisma.agent.upsert({
        where: { id: agent.id },
        update: { name: agent.name, shortBio: agent.shortBio, archetype: agent.archetype, voiceStyle: agent.voiceStyle, config: agent },
        create: { ...agent, config: agent },
      });
      results.push(`Agent seeded: ${agent.name}`);
    }
  } catch (error) {
    results.push(`Seed error: ${String(error)}`);
    return NextResponse.json({ success: false, results }, { status: 500 });
  }

  return NextResponse.json({ success: true, results });
}

export async function GET() {
  return handleSetup();
}

export async function POST() {
  return handleSetup();
}
