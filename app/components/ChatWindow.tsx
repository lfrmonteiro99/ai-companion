"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Settings as SettingsIcon, X, Send, ArrowLeft } from "lucide-react";
import Image from "next/image";
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

const AGENT_THEME: Record<string, string> = {
  valeria: "agent-valeria chat-bg-valeria",
  luna: "agent-luna chat-bg-luna",
  mira: "agent-mira chat-bg-mira",
  sable: "agent-sable chat-bg-sable",
  kira: "agent-kira chat-bg-kira",
};

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
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(initialMessages.length >= 50);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingContent, showTyping]);

  // Smart opener
  useEffect(() => {
    if (initialMessages.length > 0 || !openers || openers.length === 0) return;
    const hasProfile = userProfile?.bio || (userProfile?.interests && userProfile.interests.length > 0);
    const effectiveChance = hasProfile ? Math.min(1, openerChance + 0.2) : openerChance;
    if (Math.random() > effectiveChance) return;
    let opener = openers[Math.floor(Math.random() * openers.length)];
    if (userProfile?.interests && userProfile.interests.length > 0 && Math.random() > 0.5) {
      const interest = userProfile.interests[Math.floor(Math.random() * userProfile.interests.length)];
      opener = `${opener.replace(/\.$/, "")} — I noticed you're into ${interest}.`;
    }
    setShowTyping(true);
    const delay = 1500 + Math.random() * 2500;
    const timer = setTimeout(() => {
      setShowTyping(false);
      setMessages([{ id: `opener-${Date.now()}`, senderRole: "assistant", content: opener, createdAt: new Date().toISOString() }]);
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
      setMessages([]); setConvId(null); setMilestones([]); setStreamingContent(""); setShowResetConfirm(false);
    } finally { setResetting(false); }
  }

  async function loadOlderMessages() {
    if (loadingOlder || !hasMore || !convId || messages.length === 0) return;
    setLoadingOlder(true);
    try {
      const oldestId = messages[0].id;
      const res = await fetch(`/api/conversations/${convId}/messages?before=${oldestId}&limit=50`);
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        const scrollEl = scrollRef.current;
        const prevHeight = scrollEl?.scrollHeight || 0;
        setMessages((prev) => [...data.messages, ...prev]);
        setHasMore(data.hasMore);
        requestAnimationFrame(() => { if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight - prevHeight; });
      } else { setHasMore(false); }
    } finally { setLoadingOlder(false); }
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
    const typingDelay = 800 + Math.random() * 1200;
    setShowTyping(true);

    try {
      const res = await fetch("/api/chat/stream", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, agentId, message: text }) });
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

  const themeClass = AGENT_THEME[agentId] || "";

  return (
    <>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} showMilestones={showMilestones} onToggleMilestones={toggleMilestones} />

      <div className={`flex h-[calc(100vh-73px)] flex-col ${themeClass}`}>
        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-base-500/30 px-4 py-2.5 backdrop-blur-md bg-base-950/60">
          <div className="flex items-center gap-2.5">
            <a href={`/agents/${agentId}`} className="group flex items-center gap-2.5">
              {agentAvatar ? (
                <div className="relative h-8 w-8 overflow-hidden rounded-full ring-1 ring-[var(--agent-accent)]/30 group-hover:ring-[var(--agent-accent)]/60 transition-all">
                  <Image src={agentAvatar} alt={agentName} fill className="object-cover" sizes="32px" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-base-700 ring-1 ring-[var(--agent-accent)]/30 text-xs font-bold text-base-200">
                  {agentName[0]}
                </div>
              )}
              <div>
                <span className="font-display text-sm font-semibold text-base-50">{agentName}</span>
                {showTyping && (
                  <span className="ml-2 text-[10px] text-[var(--agent-accent)] animate-pulse">typing...</span>
                )}
              </div>
            </a>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="rounded-lg p-1.5 text-base-400 transition-colors hover:bg-base-700/60 hover:text-rose-400"
              title="Reset conversation"
            >
              <RotateCcw size={15} />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded-lg p-1.5 text-base-400 transition-colors hover:bg-base-700/60 hover:text-base-100"
              title="Settings"
            >
              <SettingsIcon size={15} />
            </button>
          </div>
        </div>

        {/* Reset confirmation modal */}
        <AnimatePresence>
          {showResetConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                className="surface-3 mx-4 w-full max-w-sm rounded-2xl p-6"
              >
                <h3 className="mb-2 text-lg font-semibold text-base-50">Reset conversation?</h3>
                <p className="mb-5 text-sm text-base-300">
                  This will erase all messages, memories, milestones, and relationship progress with {agentName}. This cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    disabled={resetting}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-base-200 transition-colors hover:bg-base-600/50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={resetting}
                    className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-rose-500 disabled:opacity-70 shadow-[0_0_16px_rgba(225,29,72,0.25)]"
                  >
                    {resetting ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Resetting...
                      </>
                    ) : "Reset"}
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
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                  className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm bg-[var(--agent-subtle)] text-base-100 border border-[var(--agent-accent)]/20"
                >
                  <span className="font-medium">{m.label}</span>
                  <button onClick={() => setMilestones((p) => p.filter((_, j) => j !== i))} className="ml-2 text-base-400 hover:text-base-100 transition-colors">
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Messages area */}
        <div className="relative flex-1 overflow-hidden">
          {/* Top fade */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-base-950 to-transparent" />

          <div
            ref={scrollRef}
            className="h-full overflow-y-auto px-4 py-4"
            onScroll={(e) => {
              const el = e.currentTarget;
              if (el.scrollTop < 80 && hasMore && !loadingOlder) loadOlderMessages();
            }}
          >
            <div className="mx-auto max-w-2xl space-y-3">
              {loadingOlder && (
                <div className="flex justify-center py-2">
                  <svg className="h-5 w-5 animate-spin text-base-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}

              {/* Empty state */}
              {messages.length === 0 && !showTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="flex flex-col items-center justify-center gap-5 py-20"
                >
                  {agentAvatar ? (
                    <div className="relative h-24 w-24 overflow-hidden rounded-full ring-4 ring-[var(--agent-accent)]/20 shadow-[0_0_40px_var(--agent-glow)]">
                      <Image src={agentAvatar} alt={agentName} fill className="object-cover" sizes="96px" />
                    </div>
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-base-700 ring-4 ring-[var(--agent-accent)]/20 text-3xl font-display font-bold text-base-100">
                      {agentName[0]}
                    </div>
                  )}
                  <div className="text-center space-y-1.5 max-w-xs">
                    <p className="font-display text-xl font-semibold italic text-base-50">{agentName}</p>
                    <p className="text-sm text-base-300">Start a conversation and see where it goes...</p>
                  </div>
                </motion.div>
              )}

              {/* Messages */}
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <MessageBubble
                      role={msg.senderRole}
                      content={msg.content}
                      agentName={msg.senderRole === "assistant" ? agentName : undefined}
                      agentAvatar={msg.senderRole === "assistant" ? agentAvatar : undefined}
                      agentId={agentId}
                      timestamp={msg.createdAt}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Streaming message */}
              {streamingContent && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <MessageBubble role="assistant" content={streamingContent} agentName={agentName} agentAvatar={agentAvatar} agentId={agentId} />
                </motion.div>
              )}

              {/* Typing indicator */}
              {showTyping && !streamingContent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2"
                >
                  {agentAvatar ? (
                    <div className="relative mt-1 h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-[var(--agent-accent)]/30">
                      <Image src={agentAvatar} alt={agentName} fill className="object-cover" sizes="28px" />
                    </div>
                  ) : (
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-base-700 ring-1 ring-[var(--agent-accent)]/30 text-[10px] font-bold text-base-300">
                      {agentName[0]}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-base-700/80 backdrop-blur-sm border border-base-500/30 px-4 py-3">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="block h-1.5 w-1.5 rounded-full bg-[var(--agent-accent)] animate-typing-dot"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Bottom fade */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-base-950 to-transparent" />
        </div>

        {/* Input area */}
        <div className="border-t border-base-500/30 px-4 py-3 backdrop-blur-md bg-base-950/60">
          <div className="mx-auto flex max-w-2xl gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={`Message ${agentName}...`}
              disabled={sending}
              className="flex-1 rounded-xl border border-base-500/50 bg-base-700/60 backdrop-blur-sm px-4 py-2.5 text-sm text-base-100 placeholder:text-base-400 transition-all duration-200 focus:outline-none focus:border-[var(--agent-accent)]/60 focus:shadow-[0_0_0_3px_var(--agent-glow)] disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="rounded-xl bg-[var(--agent-accent)] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_16px_var(--agent-glow)] disabled:opacity-40 disabled:shadow-none"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
