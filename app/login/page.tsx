"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    window.location.href = "/";
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="mb-2 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Welcome back</h1>
      <p className="mb-8" style={{ color: "var(--text-muted)" }}>Sign in to continue your conversations</p>

      {error && <div className="mb-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</div>}

      <form onSubmit={handleLogin} className="space-y-4">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required
          className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required
          className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 border-t" style={{ borderColor: "var(--border-color)" }} />
        <span className="text-xs" style={{ color: "var(--text-faint)" }}>or</span>
        <div className="flex-1 border-t" style={{ borderColor: "var(--border-color)" }} />
      </div>

      <button onClick={handleGoogleLogin} className="w-full rounded-xl border py-3 text-sm font-medium transition hover:opacity-80"
        style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
        Continue with Google
      </button>

      <p className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
        Don&apos;t have an account? <a href="/signup" className="text-blue-500 hover:underline">Sign up</a>
      </p>
    </div>
  );
}
