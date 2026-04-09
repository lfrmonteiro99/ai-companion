"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess(true); setLoading(false);
  }

  async function handleGoogleSignup() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (success) {
    return (
      <div className="mx-auto max-w-sm px-6 py-20 text-center">
        <h1 className="mb-2 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Check your email</h1>
        <p style={{ color: "var(--text-muted)" }}>We sent a confirmation link to <strong>{email}</strong></p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="mb-2 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Create an account</h1>
      <p className="mb-8" style={{ color: "var(--text-muted)" }}>Start chatting with unique AI personalities</p>

      {error && <div className="mb-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</div>}

      <form onSubmit={handleSignup} className="space-y-4">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required
          className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6 characters)" required minLength={6}
          className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }} />
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50">
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 border-t" style={{ borderColor: "var(--border-color)" }} />
        <span className="text-xs" style={{ color: "var(--text-faint)" }}>or</span>
        <div className="flex-1 border-t" style={{ borderColor: "var(--border-color)" }} />
      </div>

      <button onClick={handleGoogleSignup} className="w-full rounded-xl border py-3 text-sm font-medium transition hover:opacity-80"
        style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}>
        Continue with Google
      </button>

      <p className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
        Already have an account? <a href="/login" className="text-blue-500 hover:underline">Sign in</a>
      </p>
    </div>
  );
}
