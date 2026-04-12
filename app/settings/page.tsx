"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon, Bell, BellOff, Clock, MessageSquare, Trash2, Download, ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/app/components/ThemeProvider";

interface UserSettings {
  userId: string;
  displayName: string | null;
  bio: string | null;
  interests: string[];
  showMilestones: boolean;
  enableInitiative: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile fields
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");

  // Notification fields
  const [enableInitiative, setEnableInitiative] = useState(true);
  const [quietHoursStart, setQuietHoursStart] = useState("23:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState("08:00");

  // Chat fields
  const [showMilestones, setShowMilestones] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      try {
        const res = await fetch(`/api/settings?authId=${user.id}`);
        const data = await res.json();
        if (data.userId) {
          setSettings(data);
          setDisplayName(data.displayName || "");
          setBio(data.bio || "");
          setInterests(data.interests || []);
          setShowMilestones(data.showMilestones);
          setEnableInitiative(data.enableInitiative);
          setQuietHoursStart(data.quietHoursStart || "23:00");
          setQuietHoursEnd(data.quietHoursEnd || "08:00");
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: settings.userId,
          displayName: displayName.trim() || null,
          bio: bio.trim() || null,
          interests,
          showMilestones,
          enableInitiative,
          quietHoursStart,
          quietHoursEnd,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    setSaving(false);
  }

  function addInterest() {
    const trimmed = interestInput.trim();
    if (!trimmed || interests.length >= 10 || interests.includes(trimmed)) return;
    setInterests([...interests, trimmed]);
    setInterestInput("");
  }

  function removeInterest(interest: string) {
    setInterests(interests.filter((i) => i !== interest));
  }

  async function handleExport() {
    if (!settings) return;
    try {
      const res = await fetch(`/api/history?limit=1000`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `conversa-history-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="relative min-h-[calc(100vh-73px)]">
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <div className="space-y-4">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-base-700/60" />
            <div className="h-64 animate-pulse rounded-2xl bg-base-700/60" />
            <div className="h-48 animate-pulse rounded-2xl bg-base-700/60" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-73px)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-mira-500/[0.05] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <a
            href="/"
            className="rounded-lg p-1.5 text-base-400 transition-colors hover:bg-base-700/60 hover:text-base-100"
            aria-label="Voltar ao dashboard"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </a>
          <h1 className="font-display text-3xl font-semibold text-base-50">Definições</h1>
        </div>

        <div className="space-y-6">
          {/* === Appearance === */}
          <section className="rounded-2xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-base-400">Aparência</h2>
            <div className="flex gap-3" role="radiogroup" aria-label="Tema">
              <button
                onClick={() => { if (theme === "dark") toggleTheme(); }}
                role="radio"
                aria-checked={theme === "light"}
                className={`flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mira-500/50 ${
                  theme === "light"
                    ? "border-mira-500/60 bg-mira-500/10 text-mira-300"
                    : "border-base-500/40 bg-base-700/50 text-base-400 hover:border-base-400/60"
                }`}
              >
                <Sun size={22} aria-hidden="true" />
                Claro
              </button>
              <button
                onClick={() => { if (theme === "light") toggleTheme(); }}
                role="radio"
                aria-checked={theme === "dark"}
                className={`flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mira-500/50 ${
                  theme === "dark"
                    ? "border-mira-500/60 bg-mira-500/10 text-mira-300"
                    : "border-base-500/40 bg-base-700/50 text-base-400 hover:border-base-400/60"
                }`}
              >
                <Moon size={22} aria-hidden="true" />
                Escuro
              </button>
            </div>
          </section>

          {/* === Profile === */}
          <section className="rounded-2xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-base-400">Perfil</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-base-200">
                  Nome de exibição
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={100}
                  placeholder="Como queres ser chamado"
                  className="w-full rounded-xl border border-base-500/40 bg-base-700/50 px-4 py-2.5 text-sm text-base-100 placeholder-base-500 outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
                />
              </div>
              <div>
                <label htmlFor="bio" className="mb-1 block text-sm font-medium text-base-200">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Fala um pouco sobre ti..."
                  className="w-full resize-none rounded-xl border border-base-500/40 bg-base-700/50 px-4 py-2.5 text-sm text-base-100 placeholder-base-500 outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
                />
                <p className="mt-1 text-right text-[10px] text-base-500">{bio.length}/500</p>
              </div>
              <div>
                <label htmlFor="interestInput" className="mb-1 block text-sm font-medium text-base-200">
                  Interesses <span className="text-base-500">({interests.length}/10)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="interestInput"
                    type="text"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addInterest(); } }}
                    maxLength={50}
                    placeholder="Adicionar interesse"
                    className="flex-1 rounded-xl border border-base-500/40 bg-base-700/50 px-4 py-2.5 text-sm text-base-100 placeholder-base-500 outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
                  />
                  <button
                    onClick={addInterest}
                    disabled={!interestInput.trim() || interests.length >= 10}
                    className="rounded-xl bg-mira-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-mira-400 disabled:opacity-50"
                  >
                    Adicionar
                  </button>
                </div>
                {interests.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {interests.map((interest) => (
                      <span key={interest} className="flex items-center gap-1 rounded-full bg-base-700/80 px-2.5 py-1 text-xs text-base-200">
                        {interest}
                        <button
                          onClick={() => removeInterest(interest)}
                          className="ml-0.5 text-base-400 hover:text-rose-400 transition-colors"
                          aria-label={`Remover ${interest}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* === Chat === */}
          <section className="rounded-2xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-base-400">Chat</h2>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showMilestones}
                  onChange={(e) => setShowMilestones(e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded border-base-500 bg-base-700 accent-mira-500"
                />
                <div>
                  <p className="text-sm font-medium text-base-100 group-hover:text-base-50 transition-colors">
                    <MessageSquare size={14} className="mr-1.5 inline" aria-hidden="true" />
                    Milestones de relação
                  </p>
                  <p className="text-xs mt-0.5 text-base-400">
                    Mostra indicadores narrativos durante o chat (ex: &quot;Ela está a abrir-se&quot;).
                  </p>
                </div>
              </label>
            </div>
          </section>

          {/* === Notifications === */}
          <section className="rounded-2xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-base-400">Notificações</h2>
            <div className="space-y-5">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={enableInitiative}
                  onChange={(e) => setEnableInitiative(e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded border-base-500 bg-base-700 accent-mira-500"
                />
                <div>
                  <p className="text-sm font-medium text-base-100 group-hover:text-base-50 transition-colors">
                    {enableInitiative
                      ? <><Bell size={14} className="mr-1.5 inline" aria-hidden="true" />Mensagens proativas ativadas</>
                      : <><BellOff size={14} className="mr-1.5 inline" aria-hidden="true" />Mensagens proativas desativadas</>
                    }
                  </p>
                  <p className="text-xs mt-0.5 text-base-400">
                    Os agentes enviam mensagens quando não interages há algum tempo.
                  </p>
                </div>
              </label>

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-base-200">
                  <Clock size={14} aria-hidden="true" />
                  Horas de silêncio
                </p>
                <p className="mb-3 text-xs text-base-400">
                  Nenhuma mensagem proativa será enviada neste período.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label htmlFor="quietStart" className="mb-1 block text-xs text-base-400">Início</label>
                    <input
                      id="quietStart"
                      type="time"
                      value={quietHoursStart}
                      onChange={(e) => setQuietHoursStart(e.target.value)}
                      className="w-full rounded-xl border border-base-500/40 bg-base-700/50 px-3 py-2 text-sm text-base-100 outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
                    />
                  </div>
                  <span className="mt-5 text-base-500">—</span>
                  <div className="flex-1">
                    <label htmlFor="quietEnd" className="mb-1 block text-xs text-base-400">Fim</label>
                    <input
                      id="quietEnd"
                      type="time"
                      value={quietHoursEnd}
                      onChange={(e) => setQuietHoursEnd(e.target.value)}
                      className="w-full rounded-xl border border-base-500/40 bg-base-700/50 px-3 py-2 text-sm text-base-100 outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* === Data === */}
          <section className="rounded-2xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-base-400">Dados</h2>
            <div className="space-y-3">
              <button
                onClick={handleExport}
                className="flex w-full items-center gap-2 rounded-xl bg-base-700/50 px-4 py-3 text-sm font-medium text-base-200 transition-colors hover:bg-base-600/50 hover:text-base-50"
              >
                <Download size={16} aria-hidden="true" />
                Exportar histórico de conversas
              </button>
              <a
                href="/profile"
                className="flex w-full items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/20"
              >
                <Trash2 size={16} aria-hidden="true" />
                Eliminar conta (zona de perigo)
              </a>
            </div>
          </section>

          {/* Save bar */}
          <div className="sticky bottom-4 flex justify-end gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-mira-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-mira-500/25 transition-all hover:bg-mira-400 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mira-500/50"
            >
              {saving ? "A guardar..." : saved ? "Guardado ✓" : "Guardar definições"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
