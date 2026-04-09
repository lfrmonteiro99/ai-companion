"use client";

import { useState, useEffect, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import ScenarioBriefing from "@/app/components/ScenarioBriefing";

interface ScenarioData {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "normal" | "hard" | "expert";
  context: string;
  objective: string;
  tips: string[];
  maxMessages: number | null;
}

interface AgentOption {
  id: string;
  name: string;
  archetype: string;
  avatar?: string;
}

interface ScenarioFromAPI {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: "easy" | "normal" | "hard" | "expert";
  category: string;
  locked: boolean;
  bestScore: number | null;
  attemptCount: number;
  tips: string[];
  maxMessages: number | null;
  context?: string;
  objective?: string;
}

const AGENTS: AgentOption[] = [
  { id: "valeria", name: "Valeria", archetype: "dominant_teasing", avatar: "/agents/valeria.png" },
  { id: "luna", name: "Luna", archetype: "soft_affectionate", avatar: "/agents/luna.png" },
  { id: "mira", name: "Mira", archetype: "reserved_intellectual", avatar: "/agents/mira.png" },
  { id: "sable", name: "Sable", archetype: "mysterious_enigmatic", avatar: "/agents/sable.png" },
  { id: "kira", name: "Kira", archetype: "playful_chaotic", avatar: "/agents/kira.png" },
];

export default function ScenarioBriefingPage({ params }: { params: Promise<{ scenarioId: string }> }) {
  const { scenarioId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedAgentId = searchParams.get("agentId");

  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScenario() {
      try {
        const res = await fetch("/api/scenarios");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Erro ao carregar cenário");
        }
        const data: ScenarioFromAPI[] = await res.json();
        const found = data.find((s) => s.id === scenarioId);
        if (!found) {
          throw new Error("Cenário não encontrado");
        }
        setScenario({
          id: found.id,
          title: found.title,
          description: found.description,
          difficulty: found.difficulty,
          context: found.context || found.description,
          objective: found.objective || "Completa o cenário com sucesso.",
          tips: found.tips,
          maxMessages: found.maxMessages,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro inesperado");
      } finally {
        setLoading(false);
      }
    }
    fetchScenario();
  }, [scenarioId, router]);

  async function handleStart(agentId: string) {
    setStarting(true);
    try {
      const res = await fetch("/api/scenarios/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, agentId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Erro ao iniciar cenário" }));
        throw new Error(errData.error || "Erro ao iniciar cenário");
      }

      const data = await res.json();
      const attemptId = data.attempt?.id || "";
      router.push(`/chat/${agentId}?mode=scenario&scenarioId=${scenarioId}&attemptId=${attemptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      setStarting(false);
    }
  }

  function handleBack() {
    const params = preselectedAgentId ? `?agentId=${preselectedAgentId}` : "";
    router.push(`/scenarios${params}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-base-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] flex-col items-center justify-center gap-4">
        <p className="text-sm text-rose-400">{error}</p>
        <button
          onClick={handleBack}
          className="rounded-xl bg-base-700/80 px-4 py-2 text-sm font-medium text-base-200 transition-colors hover:bg-base-600/80"
        >
          Voltar aos cenários
        </button>
      </div>
    );
  }

  if (!scenario) {
    return null;
  }

  // If preselectedAgentId is given, re-order agents so it's first
  const orderedAgents = preselectedAgentId
    ? [
        ...AGENTS.filter((a) => a.id === preselectedAgentId),
        ...AGENTS.filter((a) => a.id !== preselectedAgentId),
      ]
    : AGENTS;

  return (
    <div className="relative min-h-[calc(100vh-73px)] overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[500px] w-[600px] rounded-full bg-mira-500/[0.06] blur-[120px]" />
        <div className="absolute right-1/4 top-20 h-[400px] w-[500px] rounded-full bg-sable-500/[0.05] blur-[100px]" />
      </div>

      <div className="relative">
        {starting && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-base-950/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin text-base-200" />
              <span className="text-sm text-base-300">A preparar o cenário...</span>
            </div>
          </div>
        )}
        <ScenarioBriefing
          scenario={scenario}
          agents={orderedAgents}
          onStart={handleStart}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}
