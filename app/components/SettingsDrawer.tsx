"use client";

import { useEffect, useRef } from "react";
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
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap + ESC to close
  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal={open}
        aria-label="Definições"
        className={`fixed right-0 top-0 z-50 h-full w-80 max-w-[calc(100vw-2rem)] transform transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"} surface-2`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-base-500/30 px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-base-50">Definições</h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="rounded-lg p-1.5 text-base-400 transition-colors hover:bg-base-600/50 hover:text-base-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mira-500/50"
              aria-label="Fechar definições"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-base-400">Aparência</h3>
              <div className="flex gap-2" role="radiogroup" aria-label="Tema">
                <button
                  onClick={() => { if (theme === "dark") toggleTheme(); }}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mira-500/50 ${
                    theme === "light"
                      ? "border-mira-500/60 bg-mira-500/10 text-mira-300"
                      : "border-base-500/40 bg-base-700/50 text-base-400 hover:border-base-400/60"
                  }`}
                  role="radio"
                  aria-checked={theme === "light"}
                >
                  <Sun size={18} className="mx-auto mb-1" aria-hidden="true" />
                  Claro
                </button>
                <button
                  onClick={() => { if (theme === "light") toggleTheme(); }}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mira-500/50 ${
                    theme === "dark"
                      ? "border-mira-500/60 bg-mira-500/10 text-mira-300"
                      : "border-base-500/40 bg-base-700/50 text-base-400 hover:border-base-400/60"
                  }`}
                  role="radio"
                  aria-checked={theme === "dark"}
                >
                  <Moon size={18} className="mx-auto mb-1" aria-hidden="true" />
                  Escuro
                </button>
              </div>
            </div>
            {onToggleMilestones !== undefined && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-base-400">Chat</h3>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showMilestones}
                    onChange={onToggleMilestones}
                    className="mt-0.5 h-5 w-5 rounded border-base-500 bg-base-700 accent-[var(--agent-accent)]"
                  />
                  <div>
                    <div className="text-sm font-medium text-base-100 group-hover:text-base-50 transition-colors">Milestones de relação</div>
                    <div className="text-xs mt-0.5 text-base-400">
                      Indicadores narrativos como &quot;Ela está a começar a abrir-se&quot;. Desativa para uma experiência mais natural.
                    </div>
                  </div>
                </label>
              </div>
            )}
          </div>
          <div className="border-t border-base-500/30 px-5 py-4">
            <p className="text-[10px] text-base-500">Conversa v0.1.0</p>
          </div>
        </div>
      </div>
    </>
  );
}
