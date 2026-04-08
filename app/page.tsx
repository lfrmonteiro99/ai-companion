import AgentCard from "./components/AgentCard";
import { getAllAgents } from "@/lib/agents";

export default function Home() {
  const agents = getAllAgents();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-2 text-3xl font-bold text-white">Choose Your Companion</h1>
      <p className="mb-8 text-gray-400">
        Each personality is distinct. Who catches your attention?
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            id={agent.id}
            name={agent.name}
            shortBio={agent.shortBio}
            archetype={agent.archetype}
          />
        ))}
      </div>
    </div>
  );
}
