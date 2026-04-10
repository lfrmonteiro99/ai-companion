"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { History } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import SessionHistory from "@/app/components/SessionHistory";
import PageHeader from "@/app/components/ui/PageHeader";
import { ErrorState } from "@/app/components/ui/StateBlocks";

interface SessionItem {
  conversationId: string;
  agentId: string;
  agentName: string;
  mode: "practice" | "scenario" | "challenge";
  updatedAt: string;
  messageCount: number;
  scenarioTitle?: string;
  score?: number | null;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-base-500/40 bg-base-800/85 backdrop-blur-md p-4">
      <div className="flex items-center gap-4">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-base-600/80" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 animate-pulse rounded bg-base-600/80" />
            <div className="h-4 w-14 animate-pulse rounded-full bg-base-600/80" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-3 w-16 animate-pulse rounded bg-base-600/60" />
            <div className="h-3 w-20 animate-pulse rounded bg-base-600/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      // Auth check
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch sessions
      try {
        const res = await fetch("/api/history");
        if (!res.ok) {
          throw new Error("Falha ao carregar histórico");
        }
        const data = await res.json();
        const normalizedSessions = Array.isArray(data) ? data : data.sessions || [];
        setSessions(normalizedSessions);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar histórico"
        );
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  return (
    <div className="relative min-h-[calc(100vh-73px)] overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[500px] w-[600px] rounded-full bg-indigo-500/[0.04] blur-[120px]" />
        <div className="absolute right-1/3 top-20 h-[400px] w-[500px] rounded-full bg-violet-500/[0.03] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 py-10">
        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <PageHeader
            title="Histórico de Sessões"
            subtitle="Revise suas conversas anteriores e acompanhe sua evolução."
            rightSlot={
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 ring-1 ring-indigo-500/25">
                <History size={20} className="text-indigo-400" />
              </div>
            }
          />
        </motion.div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                <SkeletonCard />
              </motion.div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <ErrorState message={error} />
          </motion.div>
        )}

        {/* Session list */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <SessionHistory sessions={sessions} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
