"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import ScenarioList from "@/app/components/ScenarioList";

interface ScenarioWithStatus {
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
}

function ScenariosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const agentId = searchParams.get("agentId");

  const [scenarios, setScenarios] = useState<ScenarioWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScenarios() {
      try {
        const res = await fetch("/api/scenarios");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Erro ao carregar cenários");
        }
        const data = await res.json();
        setScenarios(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro inesperado");
      } finally {
        setLoading(false);
      }
    }
    fetchScenarios();
  }, [router]);

  function handleSelect(scenarioId: string) {
    const params = agentId ? `?agentId=${agentId}` : "";
    router.push(`/scenarios/${scenarioId}${params}`);
  }

  return (
    <div className="relative mx-auto max-w-3xl px-6 py-8">
      <a
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-base-400 transition-colors hover:text-base-100"
      >
        <ArrowLeft size={16} />
        Voltar ao início
      </a>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="mb-8"
      >
        <h1 className="mb-2 font-display text-3xl font-bold italic text-base-50">
          Cenários
        </h1>
        <p className="text-sm text-base-300">
          Situações guiadas com contexto e objetivo definidos. Escolhe um cenário para praticar.
        </p>
      </motion.div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-base-400" />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="mb-4 text-sm text-rose-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-base-700/80 px-4 py-2 text-sm font-medium text-base-200 transition-colors hover:bg-base-600/80"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && (
        <ScenarioList scenarios={scenarios} onSelect={handleSelect} />
      )}
    </div>
  );
}

export default function ScenariosPage() {
  return (
    <div className="relative min-h-[calc(100vh-73px)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[500px] w-[600px] rounded-full bg-mira-500/[0.06] blur-[120px]" />
        <div className="absolute right-1/4 top-20 h-[400px] w-[500px] rounded-full bg-sable-500/[0.05] blur-[100px]" />
      </div>
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-base-400" />
        </div>
      }>
        <ScenariosContent />
      </Suspense>
    </div>
  );
}
