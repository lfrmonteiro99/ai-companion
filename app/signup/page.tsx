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

  if (success) {
    return (
      <div className="relative min-h-[calc(100vh-73px)] overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/3 h-[300px] w-[400px] -translate-x-1/2 rounded-full bg-emerald-500/[0.06] blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-sm px-6 py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mb-2 font-display text-2xl font-bold italic text-base-50">Check your email</h1>
          <p className="text-base-300">We sent a confirmation link to <strong className="text-base-100">{email}</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-73px)] overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-1/3 top-20 h-[400px] w-[500px] rounded-full bg-valeria-500/[0.05] blur-[120px]" />
        <div className="absolute left-1/3 bottom-20 h-[300px] w-[400px] rounded-full bg-mira-500/[0.05] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-sm px-6 py-20">
        <h1 className="mb-2 font-display text-2xl font-bold italic text-base-50">Create an account</h1>
        <p className="mb-8 text-base-300">Five personalities are waiting. Each one is different.</p>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-sm text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required
            className="w-full rounded-xl border border-base-500/50 bg-base-700/60 backdrop-blur-sm px-4 py-3 text-sm text-base-100 placeholder:text-base-400 transition-all focus:outline-none focus:border-mira-500/60 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
          />
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6 characters)" required minLength={6}
            className="w-full rounded-xl border border-base-500/50 bg-base-700/60 backdrop-blur-sm px-4 py-3 text-sm text-base-100 placeholder:text-base-400 transition-all focus:outline-none focus:border-mira-500/60 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
          />
          <button
            type="submit" disabled={loading}
            className="w-full rounded-xl bg-mira-500 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 hover:shadow-[0_0_16px_rgba(99,102,241,0.3)] disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-base-400">
          Already have an account? <a href="/login" className="text-mira-400 hover:text-mira-300 transition-colors">Sign in</a>
        </p>
      </div>
    </div>
  );
}
