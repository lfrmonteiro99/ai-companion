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
        className="rounded-lg border border-red-500 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500 hover:text-white"
      >
        Delete Account
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-red-500/30 p-4" style={{ backgroundColor: "var(--bg-secondary)" }}>
      <p className="mb-3 text-sm" style={{ color: "var(--text-secondary)" }}>
        Type <strong>DELETE</strong> to confirm:
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="Type DELETE"
        className="mb-3 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
      />
      <div className="flex gap-2">
        <button
          onClick={() => { setShowConfirm(false); setConfirmText(""); }}
          disabled={deleting}
          className="rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          style={{ color: "var(--text-secondary)" }}
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={confirmText !== "DELETE" || deleting}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {deleting ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Deleting...
            </>
          ) : (
            "Delete My Account"
          )}
        </button>
      </div>
    </div>
  );
}
