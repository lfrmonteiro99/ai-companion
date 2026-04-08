import { NextResponse } from "next/server";
import { getAllAgents } from "@/lib/agents";

export async function GET() {
  const agents = getAllAgents().map((agent) => ({
    id: agent.id,
    name: agent.name,
    shortBio: agent.shortBio,
    archetype: agent.archetype,
    voiceStyle: agent.voiceStyle,
    coreTraits: agent.coreTraits,
    interactionPreferences: agent.interactionPreferences,
    dislikes: agent.dislikes,
  }));

  return NextResponse.json(agents);
}
