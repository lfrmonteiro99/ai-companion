import { AgentConfig } from "@/lib/types";
import { valeria } from "./valeria";
import { luna } from "./luna";
import { mira } from "./mira";
import { sable } from "./sable";
import { kira } from "./kira";

const agents: Map<string, AgentConfig> = new Map([
  [valeria.id, valeria],
  [luna.id, luna],
  [mira.id, mira],
  [sable.id, sable],
  [kira.id, kira],
]);

export function getAgent(id: string): AgentConfig | undefined {
  return agents.get(id);
}

export function getAllAgents(): AgentConfig[] {
  return Array.from(agents.values());
}
