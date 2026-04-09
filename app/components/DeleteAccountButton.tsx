"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DeleteAccountButton({ userId }: { userId: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/user?userId=${userId}`, { method: "DELETE" });
      if (res.ok) {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = "/";
      }
    } finally {
      setDeleting(false);
    }
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="rounded-xl border border-rose-500/50 px-4 py-2 text-sm font-medium text-rose-400 transition-all hover:bg-rose-500 hover:text-white hover:shadow-[0_0_16px_rgba(225,29,72,0.2)]"
      >
        Delete Account
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-rose-500/30 p-4 surface-1">
      <p className="mb-3 text-sm text-[var(--text-secondary)]">
        Type <strong className="text-[var(--text-primary)]">DELETE</strong> to confirm:
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="Type DELETE"
        className="mb-3 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-rose-500/60 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.15)] transition-all"
      />
      <div className="flex gap-2">
        <button
          onClick={() => { setShowConfirm(false); setConfirmText(""); }}
          disabled={deleting}
          className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={confirmText !== "DELETE" || deleting}
          className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-rose-500 disabled:opacity-50 shadow-[0_0_16px_rgba(225,29,72,0.25)]"
        >
          {deleting ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Deleting...
            </>
          ) : "Delete My Account"}
        </button>
      </div>
    </div>
  );
}
