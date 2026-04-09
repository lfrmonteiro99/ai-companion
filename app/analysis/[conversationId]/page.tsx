"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { SessionFeedback as SessionFeedbackType } from "@/lib/types";
import SessionFeedback from "@/app/components/SessionFeedback";

type Status = "loading" | "error" | "ready";

export default function AnalysisPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [feedback, setFeedback] = useState<SessionFeedbackType | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!conversationId) return;

    let cancelled = false;

    async function load() {
      setStatus("loading");
      setErrorMsg("");

      try {
        const res = await fetch(`/api/feedback/${conversationId}`);

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.error ?? `Erro ${res.status}`,
          );
        }

        const data = await res.json();

        if (!cancelled) {
          setFeedback(data.feedback);
          setStatus("ready");
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(
            err instanceof Error ? err.message : "Erro ao carregar feedback",
          );
          setStatus("error");
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  return (
    <div className="min-h-screen bg-base-950 text-base-100">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Back link */}
        <a
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-base-400 transition-colors hover:text-base-200"
        >
          <ArrowLeft size={16} />
          Voltar
        </a>

        <h1 className="mb-8 font-display text-2xl font-bold text-base-50">
          Analise da Sessao
        </h1>

        {/* Loading */}
        {status === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-24"
          >
            <Loader2 size={32} className="animate-spin text-base-400" />
            <p className="text-sm text-base-400">
              Gerando analise detalhada da conversa...
            </p>
            <p className="text-xs text-base-500">
              Isso pode levar alguns segundos.
            </p>
          </motion.div>
        )}

        {/* Error */}
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6 text-center"
          >
            <p className="mb-2 text-sm font-medium text-rose-400">
              Nao foi possivel gerar o feedback
            </p>
            <p className="text-xs text-base-400">{errorMsg}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-base-700 px-4 py-2 text-sm font-medium text-base-200 transition-colors hover:bg-base-600"
            >
              Tentar novamente
            </button>
          </motion.div>
        )}

        {/* Ready */}
        {status === "ready" && feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <SessionFeedback feedback={feedback} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
