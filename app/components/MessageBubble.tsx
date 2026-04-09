"use client";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  agentName?: string;
  agentAvatar?: string;
}

export default function MessageBubble({ role, content, agentName, agentAvatar }: MessageBubbleProps) {
  const isUser = role === "user";

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
      <div
        className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
        style={{ backgroundColor: isUser ? "var(--bubble-user)" : "var(--bubble-agent)", color: isUser ? "#ffffff" : "var(--bubble-agent-text)" }}
      >
        {!isUser && agentName && (
          <div className="mb-1 text-xs font-medium" style={{ color: "var(--text-muted)" }}>{agentName}</div>
        )}
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}
