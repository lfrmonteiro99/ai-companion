"use client";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  agentName?: string;
}

export default function MessageBubble({ role, content, agentName }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
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
