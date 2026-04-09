"use client";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  agentName?: string;
  agentAvatar?: string;
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
          <img src={agentAvatar} alt={agentName || ""} className="mt-1 h-8 w-8 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}>
            {agentName?.[0] || "?"}
          </div>
        )
      )}
      <div className="max-w-[80%]">
        <div
          className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
          style={{ backgroundColor: isUser ? "var(--bubble-user)" : "var(--bubble-agent)", color: isUser ? "#ffffff" : "var(--bubble-agent-text)" }}
        >
          {!isUser && agentName && (
            <div className="mb-1 text-xs font-medium" style={{ color: "var(--text-muted)" }}>{agentName}</div>
          )}
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
        {timeStr && (
          <div className={`mt-0.5 text-[10px] ${isUser ? "text-right" : "text-left"}`} style={{ color: "var(--text-faint)" }}>
            {timeStr}
          </div>
        )}
      </div>
    </div>
  );
}
