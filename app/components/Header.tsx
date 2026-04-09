"use client";

import { useState, useEffect } from "react";
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
        // Fetch DB user ID
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
      <header className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-primary)" }}>
        <a href="/" className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>AI Companion</a>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <a href="/profile" className="hidden text-xs hover:underline sm:inline" style={{ color: "var(--text-muted)" }}>{user.email}</a>
              <NotificationBell userId={dbUserId} />
              <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-400">Logout</button>
            </>
          ) : (
            <a href="/login" className="text-sm text-blue-500 hover:underline">Sign in</a>
          )}
          <button onClick={() => setSettingsOpen(true)} className="rounded-lg p-2 hover:opacity-70" style={{ color: "var(--text-muted)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </header>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
