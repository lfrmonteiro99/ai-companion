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
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-base-500/30 px-6 py-4 backdrop-blur-lg bg-base-950/80">
        <a href="/" className="font-display text-xl font-bold italic bg-gradient-to-r from-base-50 to-base-300 bg-clip-text text-transparent transition-all hover:from-white hover:to-base-200">
          Conversa
        </a>
        <div className="flex items-center gap-1.5">
          {user ? (
            <>
              <a href="/profile" className="mr-2 hidden text-xs sm:inline text-base-400 hover:text-base-200 transition-colors">{user.email}</a>
              <NotificationBell userId={dbUserId} />
              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-base-400 transition-colors hover:bg-base-700/60 hover:text-rose-400"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <a href="/login" className="rounded-lg px-3 py-1.5 text-sm font-medium text-mira-400 transition-colors hover:bg-mira-500/10">
              Sign in
            </a>
          )}
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-lg p-2 text-base-400 transition-colors hover:bg-base-700/60 hover:text-base-100"
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
