"use client";

import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";

interface Message {
  id: string;
  senderRole: "user" | "assistant";
  content: string;
}

interface ChatWindowProps {
  agentId: string;
  agentName: string;
  userId: string;
  initialMessages: Message[];
  conversationId: string | null;
}

export default function ChatWindow({
  agentId,
  agentName,
  userId,
  initialMessages,
  conversationId: initialConvId,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [convId, setConvId] = useState<string | null>(initialConvId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      senderRole: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, agentId, message: text }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const data = await res.json();
      if (!convId) setConvId(data.conversationId);

      const assistantMsg: Message = {
        id: `resp-${Date.now()}`,
        senderRole: "assistant",
        content: data.reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, senderRole: "assistant", content: "Something went wrong. Try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-73px)] flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {messages.length === 0 && (
            <div className="py-20 text-center text-gray-500">
              Start a conversation with {agentName}
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.senderRole}
              content={msg.content}
              agentName={msg.senderRole === "assistant" ? agentName : undefined}
            />
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-gray-800 px-4 py-2.5 text-sm text-gray-400">
                {agentName} is typing...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-gray-800 px-4 py-3">
        <div className="mx-auto flex max-w-2xl gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={`Message ${agentName}...`}
            disabled={sending}
            className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-gray-500 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
