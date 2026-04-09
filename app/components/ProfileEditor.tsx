"use client";

import { useState } from "react";

interface ProfileEditorProps {
  userId: string;
  initialDisplayName: string;
  initialBio: string;
  initialInterests: string[];
}

export default function ProfileEditor({ userId, initialDisplayName, initialBio, initialInterests }: ProfileEditorProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [interests, setInterests] = useState(initialInterests);
  const [newInterest, setNewInterest] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, displayName: displayName || null, bio: bio || null, interests }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function addInterest() {
    const tag = newInterest.trim().toLowerCase();
    if (tag && !interests.includes(tag) && interests.length < 10) {
      setInterests([...interests, tag]);
      setNewInterest("");
    }
  }

  function removeInterest(tag: string) {
    setInterests(interests.filter((i) => i !== tag));
  }

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        Your Profile
      </h2>
      <p className="mb-4 text-xs" style={{ color: "var(--text-faint)" }}>
        Your companions can see this. It helps them start better conversations with you.
      </p>
      <div className="space-y-4">
        {/* Display Name */}
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How should they call you?"
            maxLength={100}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
          />
        </div>

        {/* Bio */}
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>About you</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A few words about yourself, your vibe, what you're into..."
            maxLength={500}
            rows={3}
            className="w-full resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
          />
          <div className="mt-1 text-right text-[10px]" style={{ color: "var(--text-faint)" }}>{bio.length}/500</div>
        </div>

        {/* Interests */}
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>Interests</label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {interests.map((tag) => (
              <span key={tag} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
                {tag}
                <button onClick={() => removeInterest(tag)} className="ml-0.5 hover:opacity-70" style={{ color: "var(--text-faint)" }}>x</button>
              </span>
            ))}
          </div>
          {interests.length < 10 && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                placeholder="Add interest..."
                maxLength={50}
                className="flex-1 rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
              />
              <button onClick={addInterest} className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-500 hover:opacity-70">Add</button>
            </div>
          )}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
        </button>
      </div>
    </section>
  );
}
