"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import MessageBubble from "./MessageBubble";
import SettingsDrawer from "./SettingsDrawer";

interface Message {
  id: string;
  senderRole: "user" | "assistant";
  content: string;
}

interface MilestoneEvent {
  type: string;
  label: string;
}

interface ChatWindowProps {
  agentId: string;
  agentName: string;
  userId: string;
  initialMessages: Message[];
  conversationId: string | null;
  showMilestones: boolean;
}

export default function ChatWindow({
  agentId,
  agentName,
  userId,
  initialMessages,
  conversationId: initialConvId,
  showMilestones: initialShowMilestones,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [convId, setConvId] = useState<string | null>(initialConvId);
  const [milestones, setMilestones] = useState<MilestoneEvent[]>([]);
  const [showMilestones, setShowMilestones] = useState(initialShowMilestones);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const toggleMilestones = useCallback(async () => {
    const newValue = !showMilestones;
    setShowMilestones(newValue);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, showMilestones: newValue }),
    });
  }, [showMilestones, userId]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Message = { id: `temp-${Date.now()}`, senderRole: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setStreamingContent("");

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, agentId, message: text }),
      });

      if (!res.ok || !res.body) {
        const fallback = await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, agentId, message: text }),
        });
        const data = await fallback.json();
        if (!convId) setConvId(data.conversationId);
        setMessages((prev) => [...prev, { id: `resp-${Date.now()}`, senderRole: "assistant", content: data.reply }]);
        setSending(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "token") {
              accumulated += data.content;
              setStreamingContent(accumulated);
            } else if (data.type === "done") {
              if (!convId) setConvId(data.conversationId);
              if (data.milestones?.length > 0 && showMilestones) {
                setMilestones((prev) => [...prev, ...data.milestones]);
              }
            }
          } catch {
            // skip
          }
        }
      }

      if (accumulated) {
        setMessages((prev) => [...prev, { id: `resp-${Date.now()}`, senderRole: "assistant", content: accumulated }]);
        setStreamingContent("");
      }
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
    <>
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        showMilestones={showMilestones}
        onToggleMilestones={toggleMilestones}
      />

      <div className="flex h-[calc(100vh-73px)] flex-col">
        {/* Agent top bar */}
        <div
          className="flex items-center justify-between border-b px-4 py-2"
          style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-primary)" }}
        >
          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{agentName}</span>
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-xs transition hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            Settings
          </button>
        </div>

        {/* Milestone notifications */}
        {milestones.length > 0 && showMilestones && (
          <div className="space-y-1 px-4 py-2">
            {milestones.map((m, i) => (
              <div
                key={`${m.type}-${i}`}
                className="flex items-center justify-between rounded-lg bg-purple-100 px-3 py-2 text-sm text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
              >
                <span>{m.label}</span>
                <button
                  onClick={() => setMilestones((prev) => prev.filter((_, j) => j !== i))}
                  className="ml-2 text-purple-400 hover:text-purple-600 dark:hover:text-purple-200"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto max-w-2xl space-y-3">
            {messages.length === 0 && (
              <div className="py-20 text-center" style={{ color: "var(--text-muted)" }}>
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
            {streamingContent && (
              <MessageBubble role="assistant" content={streamingContent} agentName={agentName} />
            )}
            {sending && !streamingContent && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl px-4 py-2.5 text-sm"
                  style={{ backgroundColor: "var(--bubble-agent)", color: "var(--text-muted)" }}
                >
                  {agentName} is typing...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t px-4 py-3" style={{ borderColor: "var(--border-color)" }}>
          <div className="mx-auto flex max-w-2xl gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={`Message ${agentName}...`}
              disabled={sending}
              className="flex-1 rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              style={{
                backgroundColor: "var(--bg-input)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)",
              }}
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
    </>
  );
}
