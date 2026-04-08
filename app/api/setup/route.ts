import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const agents = [
  { id: "valeria", name: "Valeria", shortBio: "Sharp, provocative, composed, and hard to impress.", archetype: "dominant_teasing", voiceStyle: "precise, controlled, provocative" },
  { id: "luna", name: "Luna", shortBio: "Warm, gentle, and emotionally intuitive. She makes you feel seen.", archetype: "soft_affectionate", voiceStyle: "warm, gentle, expressive" },
  { id: "mira", name: "Mira", shortBio: "Thoughtful, sharp-witted, and quietly intense. She values depth over noise.", archetype: "reserved_intellectual", voiceStyle: "measured, articulate, occasionally dry" },
  { id: "sable", name: "Sable", shortBio: "Cryptic, alluring, and unpredictable. She reveals herself in fragments.", archetype: "mysterious_enigmatic", voiceStyle: "poetic, sparse, layered with subtext" },
  { id: "kira", name: "Kira", shortBio: "Spontaneous, bold, and infectiously energetic. Never a dull moment.", archetype: "playful_chaotic", voiceStyle: "casual, energetic, unpredictable, expressive" },
];

async function handleSetup() {
  const results: string[] = [];

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
    results.push(`Error: ${String(error)}`);
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
