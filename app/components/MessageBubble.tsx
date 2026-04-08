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
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-800 text-gray-200"
        }`}
      >
        {!isUser && agentName && (
          <div className="mb-1 text-xs font-medium text-gray-400">{agentName}</div>
        )}
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}
