"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Settings, LogOut, Users, Target, Dumbbell, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "./NotificationBell";

const NAV_LINKS = [
  { href: "/agents", label: "Agentes", icon: Users },
  { href: "/scenarios", label: "Cenários", icon: Target },
  { href: "/exercises", label: "Exercícios", icon: Dumbbell },
  { href: "/history", label: "Histórico", icon: Clock },
];

export default function Header() {
  const pathname = usePathname();
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
      <header className="sticky top-0 z-30 border-b border-base-500/30 backdrop-blur-lg bg-base-950/80">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <a href="/" className="font-display text-xl font-bold italic bg-gradient-to-r from-base-50 to-base-300 bg-clip-text text-transparent transition-all hover:from-white hover:to-base-200" aria-label="Conversa — página inicial">
              Conversa
            </a>

            {/* Main navigation — visible when authenticated */}
            {user && (
              <nav className="hidden items-center gap-1 md:flex" aria-label="Navegação principal">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-mira-500/15 text-mira-300"
                          : "text-base-400 hover:bg-base-700/60 hover:text-base-200"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon size={14} aria-hidden="true" />
                      {link.label}
                    </a>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {user ? (
              <>
                <a href="/profile" className="mr-2 hidden text-xs sm:inline text-base-400 hover:text-base-200 transition-colors" aria-label="Perfil">{user.email}</a>
                <NotificationBell userId={dbUserId} />
                <button
                  onClick={handleLogout}
                  className="rounded-lg p-2 text-base-400 transition-colors hover:bg-base-700/60 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mira-500/50"
                  aria-label="Terminar sessão"
                >
                  <LogOut size={18} aria-hidden="true" />
                </button>
              </>
            ) : (
              <a href="/login" className="rounded-lg px-3 py-1.5 text-sm font-medium text-mira-400 transition-colors hover:bg-mira-500/10">
                Entrar
              </a>
            )}
            <a
              href="/settings"
              className="rounded-lg p-2 text-base-400 transition-colors hover:bg-base-700/60 hover:text-base-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mira-500/50"
              aria-label="Definições"
            >
              <Settings size={18} aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Mobile navigation bar */}
        {user && (
          <nav className="flex items-center gap-1 overflow-x-auto border-t border-base-500/20 px-4 py-1.5 md:hidden" aria-label="Navegação principal">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              const Icon = link.icon;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-mira-500/15 text-mira-300"
                      : "text-base-400 hover:bg-base-700/60 hover:text-base-200"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={13} aria-hidden="true" />
                  {link.label}
                </a>
              );
            })}
          </nav>
        )}
      </header>
    </>
  );
}
