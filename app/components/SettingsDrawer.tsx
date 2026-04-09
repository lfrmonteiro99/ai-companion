"use client";

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
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-80 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundColor: "var(--bg-secondary)" }}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--border-color)" }}>
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Settings</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 transition hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
            {/* Appearance */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Appearance
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => { if (theme === "dark") toggleTheme(); }}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition ${
                    theme === "light"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-transparent text-gray-400 hover:text-gray-300"
                  }`}
                  style={theme === "dark" ? { backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-color)" } : {}}
                >
                  <div className="mb-1 text-lg">&#9728;</div>
                  Light
                </button>
                <button
                  onClick={() => { if (theme === "light") toggleTheme(); }}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition ${
                    theme === "dark"
                      ? "border-blue-500 bg-blue-950 text-blue-300"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                  style={theme === "light" ? { backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-color)" } : {}}
                >
                  <div className="mb-1 text-lg">&#9790;</div>
                  Dark
                </button>
              </div>
            </div>

            {/* Chat Settings */}
            {onToggleMilestones !== undefined && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Chat
                </h3>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMilestones}
                    onChange={onToggleMilestones}
                    className="mt-0.5 h-5 w-5 rounded"
                  />
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      Relationship milestones
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Narrative hints like &quot;She is starting to open up&quot;. Disable for a more natural experience.
                    </div>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-5 py-4" style={{ borderColor: "var(--border-color)" }}>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              AI Companion v0.1.0
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
