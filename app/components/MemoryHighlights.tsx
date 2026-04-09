"use client";

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

export default function MemoryHighlights({ memories, userId, agentId }: { memories: Memory[]; userId: string; agentId: string }) {
  async function deleteMemory(id: string) {
    await fetch(`/api/memories?id=${id}&userId=${userId}&agentId=${agentId}`, { method: "DELETE" });
    window.location.reload();
  }

  // Group by type
  const grouped: Record<string, Memory[]> = {};
  for (const mem of memories) {
    if (!grouped[mem.type]) grouped[mem.type] = [];
    grouped[mem.type].push(mem);
  }

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        What She Remembers About You
      </h2>
      <div className="space-y-4">
        {Object.entries(grouped).map(([type, mems]) => (
          <div key={type}>
            <h3 className="mb-1.5 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              {TYPE_LABELS[type] || type}
            </h3>
            <div className="space-y-1.5">
              {mems.map((m) => (
                <div key={m.id} className="flex items-start justify-between gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: "var(--bg-secondary)" }}>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{m.content}</p>
                  <button
                    onClick={() => deleteMemory(m.id)}
                    className="shrink-0 text-xs hover:opacity-70"
                    style={{ color: "var(--text-faint)" }}
                    title="Remove this memory"
                  >
                    x
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
