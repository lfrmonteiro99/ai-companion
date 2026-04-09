"use client";

import { useState, useEffect } from "react";
import { Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import SettingsDrawer from "./SettingsDrawer";
import NotificationBell from "./NotificationBell";

export default function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null);
  const [dbUserId, setDbUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        fetch(`/api/settings?authId=${data.user.id}`).then((r) => r.json()).then((d) => {
          if (d.userId) setDbUserId(d.userId);
        }).catch(() => {});
      }
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border)] px-6 py-4 backdrop-blur-lg bg-[var(--bg-base)]/80">
        <a href="/" className="font-display text-xl font-bold italic text-[var(--text-primary)] transition-opacity hover:opacity-80">
          AI Companion
        </a>
        <div className="flex items-center gap-1.5">
          {user ? (
            <>
              <a href="/profile" className="mr-2 hidden text-xs sm:inline text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">{user.email}</a>
              <NotificationBell userId={dbUserId} />
              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-rose-400"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <a href="/login" className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--agent-accent)] transition-colors hover:bg-[var(--agent-subtle)]">
              Sign in
            </a>
          )}
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
