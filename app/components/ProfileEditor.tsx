"use client";

import { useState } from "react";
import { X } from "lucide-react";

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
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-base-400">Your Profile</h2>
      <p className="mb-4 text-xs text-base-500">
        Your companions can see this. It helps them start better conversations with you.
      </p>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-base-300">Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How should they call you?"
            maxLength={100}
            className="w-full rounded-xl border border-base-500/50 bg-base-700/60 px-3 py-2 text-sm text-base-100 placeholder:text-base-400 focus:outline-none focus:border-mira-500/60 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] transition-all"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-base-300">About you</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A few words about yourself, your vibe, what you're into..."
            maxLength={500}
            rows={3}
            className="w-full resize-none rounded-xl border border-base-500/50 bg-base-700/60 px-3 py-2 text-sm text-base-100 placeholder:text-base-400 focus:outline-none focus:border-mira-500/60 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] transition-all"
          />
          <div className="mt-1 text-right text-[10px] text-base-500">{bio.length}/500</div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-base-300">Interests</label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {interests.map((tag) => (
              <span key={tag} className="flex items-center gap-1 rounded-full bg-base-700/80 px-2.5 py-1 text-xs text-base-200">
                {tag}
                <button onClick={() => removeInterest(tag)} className="text-base-500 hover:text-rose-400 transition-colors">
                  <X size={12} />
                </button>
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
                className="flex-1 rounded-xl border border-base-500/50 bg-base-700/60 px-3 py-1.5 text-sm text-base-100 placeholder:text-base-400 focus:outline-none focus:border-mira-500/60 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] transition-all"
              />
              <button onClick={addInterest} className="rounded-lg px-3 py-1.5 text-sm font-medium text-mira-400 hover:text-mira-300 transition-colors">Add</button>
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-mira-500 px-5 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 hover:shadow-[0_0_12px_rgba(99,102,241,0.3)] disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
        </button>
      </div>
    </section>
  );
}
