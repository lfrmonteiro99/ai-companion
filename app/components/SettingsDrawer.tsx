"use client";

import { X, Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  showMilestones?: boolean;
  onToggleMilestones?: () => void;
}

export default function SettingsDrawer({ open, onClose, showMilestones, onToggleMilestones }: SettingsDrawerProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-[var(--overlay-backdrop)] backdrop-blur-sm" onClick={onClose} />}
      <div className={`fixed right-0 top-0 z-50 h-full w-80 transform transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"} surface-2`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">Settings</h2>
            <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Appearance</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => { if (theme === "dark") toggleTheme(); }}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                    theme === "light"
                      ? "border-[var(--agent-accent)]/60 bg-[var(--agent-subtle)] text-[var(--agent-accent)]"
                      : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <Sun size={18} className="mx-auto mb-1" />Light
                </button>
                <button
                  onClick={() => { if (theme === "light") toggleTheme(); }}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                    theme === "dark"
                      ? "border-[var(--agent-accent)]/60 bg-[var(--agent-subtle)] text-[var(--agent-accent)]"
                      : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <Moon size={18} className="mx-auto mb-1" />Dark
                </button>
              </div>
            </div>
            {onToggleMilestones !== undefined && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Chat</h3>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" checked={showMilestones} onChange={onToggleMilestones} className="mt-0.5 h-5 w-5 rounded border-[var(--border-strong)] bg-[var(--bg-elevated)] accent-[var(--agent-accent)]" />
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--text-primary)] transition-colors">Relationship milestones</div>
                    <div className="text-xs mt-0.5 text-[var(--text-muted)]">Narrative hints like &quot;She is starting to open up&quot;. Disable for a more natural experience.</div>
                  </div>
                </label>
              </div>
            )}
          </div>
          <div className="border-t border-[var(--border)] px-5 py-4">
            <p className="text-[10px] text-[var(--text-faint)]">AI Companion v0.1.0</p>
          </div>
        </div>
      </div>
    </>
  );
}
