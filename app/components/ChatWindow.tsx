"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";
import SettingsDrawer from "./SettingsDrawer";

interface Message {
  id: string;
  senderRole: "user" | "assistant";
  content: string;
  createdAt?: string;
}

interface MilestoneEvent {
  type: string;
  label: string;
}

interface UserProfile {
  displayName?: string;
  bio?: string;
  interests?: string[];
}

interface ChatWindowProps {
  agentId: string;
  agentName: string;
  agentAvatar?: string;
  userId: string;
  initialMessages: Message[];
  conversationId: string | null;
  showMilestones: boolean;
  openers?: string[];
  openerChance?: number;
  userProfile?: UserProfile;
}

export default function ChatWindow({
  agentId, agentName, agentAvatar, userId, initialMessages, conversationId: initialConvId, showMilestones: initialShowMilestones, openers, openerChance = 0.5, userProfile,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [convId, setConvId] = useState<string | null>(initialConvId);
  const [milestones, setMilestones] = useState<MilestoneEvent[]>([]);
  const [showMilestones, setShowMilestones] = useState(initialShowMilestones);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingContent, showTyping]);

  // Smart opener: agent decides whether to initiate based on personality + user profile
  useEffect(() => {
    if (initialMessages.length > 0 || !openers || openers.length === 0) return;

    // Roll dice against agent's openerChance
    // Boost chance if user has a filled profile (agents find it more interesting)
    const hasProfile = userProfile?.bio || (userProfile?.interests && userProfile.interests.length > 0);
    const effectiveChance = hasProfile ? Math.min(1, openerChance + 0.2) : openerChance;

    if (Math.random() > effectiveChance) return; // Agent doesn't initiate

    // Pick an opener — if user has profile, try to make it profile-aware
    let opener = openers[Math.floor(Math.random() * openers.length)];

    // If user has interests, sometimes reference one
    if (userProfile?.interests && userProfile.interests.length > 0 && Math.random() > 0.5) {
      const interest = userProfile.interests[Math.floor(Math.random() * userProfile.interests.length)];
      opener = `${opener.replace(/\.$/, "")} — I noticed you're into ${interest}.`;
    }

    setShowTyping(true);
    const delay = 1500 + Math.random() * 2500;
    const timer = setTimeout(() => {
      setShowTyping(false);
      setMessages([{
        id: `opener-${Date.now()}`,
        senderRole: "assistant",
        content: opener,
        createdAt: new Date().toISOString(),
      }]);
    }, delay);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleReset() {
    setResetting(true);
    try {
      await fetch("/api/conversations/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, agentId }),
      });
      setMessages([]);
      setConvId(null);
      setMilestones([]);
      setStreamingContent("");
      setShowResetConfirm(false);
    } finally {
      setResetting(false);
    }
  }

  const toggleMilestones = useCallback(async () => {
    const v = !showMilestones;
    setShowMilestones(v);
    await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, showMilestones: v }) });
  }, [showMilestones, userId]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setMessages((p) => [...p, { id: `u-${Date.now()}`, senderRole: "user", content: text, createdAt: new Date().toISOString() }]);
    setInput(""); setSending(true); setStreamingContent("");

    // Typing delay: 0.8-2s before showing streaming
    const typingDelay = 800 + Math.random() * 1200;
    setShowTyping(true);

    try {
      const res = await fetch("/api/chat/stream", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, agentId, message: text }) });

      // Wait for typing delay before showing stream
      await new Promise((r) => setTimeout(r, typingDelay));
      setShowTyping(false);

      if (!res.ok || !res.body) {
        const fb = await fetch("/api/chat/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, agentId, message: text }) });
        const d = await fb.json();
        if (!convId) setConvId(d.conversationId);
        setMessages((p) => [...p, { id: `r-${Date.now()}`, senderRole: "assistant", content: d.reply, createdAt: new Date().toISOString() }]);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const d = JSON.parse(line.slice(6));
            if (d.type === "token") { acc += d.content; setStreamingContent(acc); }
            else if (d.type === "done") { if (!convId) setConvId(d.conversationId); if (d.milestones?.length && showMilestones) setMilestones((p) => [...p, ...d.milestones]); }
          } catch { /* skip */ }
        }
      }
      if (acc) { setMessages((p) => [...p, { id: `r-${Date.now()}`, senderRole: "assistant", content: acc, createdAt: new Date().toISOString() }]); setStreamingContent(""); }
    } catch {
      setShowTyping(false);
      setMessages((p) => [...p, { id: `e-${Date.now()}`, senderRole: "assistant", content: "Something went wrong. Try again.", createdAt: new Date().toISOString() }]);
    } finally { setSending(false); }
  }

  return (
    <>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} showMilestones={showMilestones} onToggleMilestones={toggleMilestones} />
      <div className="flex h-[calc(100vh-73px)] flex-col">
        <div className="flex items-center justify-between border-b px-4 py-2" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex items-center gap-2">
            {agentAvatar && <img src={agentAvatar} alt={agentName} className="h-7 w-7 rounded-full object-cover" />}
            <div>
              <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{agentName}</span>
              {showTyping && <span className="ml-2 text-[10px]" style={{ color: "var(--text-faint)" }}>typing...</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowResetConfirm(true)} className="text-xs hover:opacity-70" style={{ color: "var(--text-muted)" }}>Reset</button>
            <button onClick={() => setSettingsOpen(true)} className="text-xs hover:opacity-70" style={{ color: "var(--text-muted)" }}>Settings</button>
          </div>
        </div>

        {/* Reset confirmation modal */}
        <AnimatePresence>
          {showResetConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
                className="mx-4 w-full max-w-sm rounded-xl p-6 shadow-xl"
                style={{ backgroundColor: "var(--bg-primary)" }}
              >
                <h3 className="mb-2 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Reset conversation?</h3>
                <p className="mb-5 text-sm" style={{ color: "var(--text-muted)" }}>
                  This will erase all messages, memories, milestones, and relationship progress with {agentName}. This cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    disabled={resetting}
                    className="rounded-lg px-4 py-2 text-sm disabled:opacity-50"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={resetting}
                    className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-70"
                  >
                    {resetting ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Resetting...
                      </>
                    ) : (
                      "Reset"
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Milestone notifications */}
        <AnimatePresence>
          {milestones.length > 0 && showMilestones && (
            <div className="space-y-1 px-4 py-2">
              {milestones.map((m, i) => (
                <motion.div
                  key={`${m.type}-${i}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between rounded-lg bg-purple-100 px-3 py-2 text-sm text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                >
                  <span>{m.label}</span>
                  <button onClick={() => setMilestones((p) => p.filter((_, j) => j !== i))} className="ml-2 text-purple-400 hover:text-purple-600 dark:hover:text-purple-200">x</button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto max-w-2xl space-y-3">
            {messages.length === 0 && !showTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center"
                style={{ color: "var(--text-muted)" }}
              >
                Start a conversation with {agentName}
              </motion.div>
            )}
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MessageBubble
                    role={msg.senderRole}
                    content={msg.content}
                    agentName={msg.senderRole === "assistant" ? agentName : undefined}
                    agentAvatar={msg.senderRole === "assistant" ? agentAvatar : undefined}
                    timestamp={msg.createdAt}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {streamingContent && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <MessageBubble role="assistant" content={streamingContent} agentName={agentName} agentAvatar={agentAvatar} />
              </motion.div>
            )}
            {showTyping && !streamingContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-2"
              >
                {agentAvatar ? (
                  <img src={agentAvatar} alt={agentName} className="mt-1 h-8 w-8 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}>
                    {agentName[0]}
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm" style={{ backgroundColor: "var(--bubble-agent)", color: "var(--text-muted)" }}>
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t px-4 py-3" style={{ borderColor: "var(--border-color)" }}>
          <div className="mx-auto flex max-w-2xl gap-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()} placeholder={`Message ${agentName}...`} disabled={sending}
              className="flex-1 rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
            <button onClick={handleSend} disabled={sending || !input.trim()} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50">Send</button>
          </div>
        </div>
      </div>
    </>
  );
}
