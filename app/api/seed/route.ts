import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function POST() {
  try {
    // Create test user
    const user = await prisma.user.upsert({
      where: { username: "test-user" },
      update: {},
      create: { username: "test-user" },
    });

    // Create agents
    for (const agent of agents) {
      await prisma.agent.upsert({
        where: { id: agent.id },
        update: { name: agent.name, shortBio: agent.shortBio, archetype: agent.archetype, voiceStyle: agent.voiceStyle, config: agent },
        create: { ...agent, config: agent },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Seeded 5 agents and test user",
      userId: user.id,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed", details: String(error) }, { status: 500 });
  }
}
