"use client";

import Image from "next/image";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  agentName?: string;
  agentAvatar?: string;
  agentId?: string;
  timestamp?: string;
}

function formatTime(ts?: string): string {
  if (!ts) return "";
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function MessageBubble({ role, content, agentName, agentAvatar, timestamp }: MessageBubbleProps) {
  const isUser = role === "user";
  const timeStr = formatTime(timestamp);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2`}>
      {!isUser && (
        agentAvatar ? (
          <div className="relative mt-1 h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-[var(--agent-accent)]/30">
            <Image src={agentAvatar} alt={agentName || ""} fill className="object-cover" sizes="28px" />
          </div>
        ) : (
          <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--bg-elevated)] ring-1 ring-[var(--agent-accent)]/30 text-[10px] font-bold text-[var(--text-muted)]">
            {agentName?.[0] || "?"}
          </div>
        )
      )}
      <div className="max-w-[78%]">
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "rounded-br-sm bg-[var(--bubble-user-bg)] text-[var(--bubble-user-text)] shadow-[0_2px_12px_rgba(79,70,229,0.2)]"
              : "rounded-bl-sm bg-[var(--bubble-agent-bg)] text-[var(--bubble-agent-text)] border border-[var(--border)]"
          }`}
        >
          {!isUser && agentName && (
            <div className="mb-1 text-[10px] font-semibold tracking-widest uppercase text-[var(--agent-accent)]">{agentName}</div>
          )}
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
        {timeStr && (
          <div className={`mt-0.5 text-[10px] ${isUser ? "text-right" : "text-left"} text-[var(--text-faint)]`}>
            {timeStr}
          </div>
        )}
      </div>
    </div>
  );
}
