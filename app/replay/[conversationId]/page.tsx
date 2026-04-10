"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ConversationReplay from "@/app/components/ConversationReplay";

interface ReplayMessage {
  id: string;
  senderRole: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface MessageAnalysis {
  messageIndex: number;
  impact: "positive" | "neutral" | "negative";
  issues?: string[];
  suggestion?: string;
}

interface KeyMoment {
  messageIndex: number;
  type: string;
  description: string;
}

interface SessionFeedback {
  messageAnalysis: MessageAnalysis[];
  keyMoments?: KeyMoment[];
}

function SkeletonBubble({ align }: { align: "left" | "right" }) {
  return (
    <div className={`flex ${align === "right" ? "justify-end" : "justify-start"} gap-2`}>
      {align === "left" && (
        <div className="mt-1 h-7 w-7 shrink-0 animate-pulse rounded-full bg-base-600/80" />
      )}
      <div className={`max-w-[78%] ${align === "right" ? "ml-auto" : ""}`}>
        <div
          className={`animate-pulse rounded-2xl ${
            align === "right" ? "rounded-br-sm" : "rounded-bl-sm"
          } bg-base-700/60 px-4 py-4`}
        >
          <div className="space-y-2">
            <div className="h-3 w-48 rounded bg-base-600/80" />
            <div className="h-3 w-36 rounded bg-base-600/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReplayPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  const [messages, setMessages] = useState<ReplayMessage[]>([]);
  const [agentName, setAgentName] = useState("");
  const [feedback, setFeedback] = useState<SessionFeedback | null>(null);
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

      try {
        // Fetch messages and feedback in parallel
        const [messagesRes, feedbackRes] = await Promise.all([
          fetch(`/api/conversations/${conversationId}/messages`),
          fetch(`/api/feedback/${conversationId}`).catch(() => null),
        ]);

        if (!messagesRes.ok) {
          throw new Error("Falha ao carregar conversa");
        }

        const messagesData = await messagesRes.json();

        setMessages(messagesData.messages || []);
        setAgentName(messagesData.agentName || "Agente");

        // Feedback is optional — don't fail if it's missing
        if (feedbackRes && feedbackRes.ok) {
          const feedbackData = await feedbackRes.json();
          const normalizedFeedback = feedbackData?.feedback ?? feedbackData;
          if (normalizedFeedback && normalizedFeedback.messageAnalysis) {
            setFeedback(normalizedFeedback);
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar conversa"
        );
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [conversationId, router]);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-73px)] flex-col">
        {/* Skeleton header */}
        <div className="flex items-center gap-3 border-b border-base-500/30 px-4 py-3 backdrop-blur-md bg-base-950/60">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-base-600/60" />
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 animate-pulse rounded-full bg-base-600/80" />
            <div className="h-4 w-24 animate-pulse rounded bg-base-600/80" />
          </div>
        </div>

        {/* Skeleton messages */}
        <div className="flex-1 overflow-hidden px-4 py-4">
          <div className="mx-auto max-w-2xl space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                <SkeletonBubble align={i % 2 === 0 ? "left" : "right"} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative min-h-[calc(100vh-73px)] overflow-hidden">
        <div className="relative mx-auto max-w-2xl px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 px-6 py-4 text-sm text-rose-300">
              {error}
            </div>
            <a
              href="/history"
              className="flex items-center gap-2 rounded-xl bg-base-700/80 px-4 py-2.5 text-sm font-medium text-base-200 transition-colors hover:bg-base-600/80 hover:text-base-50"
            >
              <ArrowLeft size={16} />
              Voltar ao Histórico
            </a>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <ConversationReplay
      messages={messages}
      agentName={agentName}
      conversationId={conversationId}
      feedback={feedback}
    />
  );
}
