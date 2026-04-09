"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

interface Memory {
  id: string;
  type: string;
  content: string;
}

const TYPE_LABELS: Record<string, string> = {
  fact: "Fact",
  preference: "Preference",
  boundary: "Boundary",
  milestone: "Milestone",
  inside_joke: "Inside Joke",
  relational_pattern: "Pattern",
  conflict: "Conflict",
  repair: "Repair",
};

const typeBorderColors: Record<string, string> = {
  fact: "border-l-2 border-l-blue-500/60",
  preference: "border-l-2 border-l-emerald-500/60",
  boundary: "border-l-2 border-l-rose-500/60",
  milestone: "border-l-2 border-l-sable-400/60",
  inside_joke: "border-l-2 border-l-kira-400/60",
  relational_pattern: "border-l-2 border-l-cyan-500/60",
  conflict: "border-l-2 border-l-orange-500/60",
  repair: "border-l-2 border-l-emerald-400/60",
};

export default function MemoryHighlights({ memories: initialMemories, userId, agentId }: { memories: Memory[]; userId: string; agentId: string }) {
  const [memories, setMemories] = useState(initialMemories);

  async function deleteMemory(id: string) {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    await fetch(`/api/memories?id=${id}&userId=${userId}&agentId=${agentId}`, { method: "DELETE" });
  }

  // Group by type
  const grouped: Record<string, Memory[]> = {};
  for (const mem of memories) {
    if (!grouped[mem.type]) grouped[mem.type] = [];
    grouped[mem.type].push(mem);
  }

  if (memories.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-base-400">
        What She Remembers About You
      </h2>
      <div className="space-y-4">
        {Object.entries(grouped).map(([type, mems]) => (
          <div key={type}>
            <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-base-400">
              {TYPE_LABELS[type] || type}
            </h3>
            <div className="space-y-1.5">
              {mems.map((m) => (
                <div
                  key={m.id}
                  className={`group flex items-start justify-between gap-2 rounded-lg px-3 py-2 surface-1 ${typeBorderColors[type] || ""}`}
                >
                  <p className="text-sm text-base-200">{m.content}</p>
                  <button
                    onClick={() => deleteMemory(m.id)}
                    className="shrink-0 text-base-500 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-all"
                    title="Remove this memory"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
