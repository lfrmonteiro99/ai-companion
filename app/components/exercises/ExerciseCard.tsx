"use client";

interface OptionItem {
  id: string;
  text: string;
}

interface ExerciseCardProps {
  title: string;
  prompt: string;
  type: string;
  targetSkill: string;
  difficulty: string;
  options?: OptionItem[];
}

export default function ExerciseCard({
  title,
  prompt,
  type,
  targetSkill,
  difficulty,
  options,
}: ExerciseCardProps) {
  return (
    <section className="rounded-2xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md shadow-surface-1">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-base-700/80 px-2.5 py-1 text-base-200">{type}</span>
        <span className="rounded-full bg-base-700/80 px-2.5 py-1 text-base-300">{difficulty}</span>
        <span className="rounded-full bg-base-700/80 px-2.5 py-1 text-base-300">{targetSkill}</span>
      </div>
      <h1 className="font-display text-2xl font-semibold text-base-50">{title}</h1>
      <p className="mt-2 text-base-200">{prompt}</p>

      {options && options.length > 0 && (
        <ul className="mt-4 space-y-2">
          {options.map((option) => (
            <li key={option.id} className="rounded-lg border border-base-600/70 bg-base-700/40 px-3 py-2 text-sm text-base-100">
              <span className="mr-2 text-base-400">{option.id.toUpperCase()}.</span>
              {option.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
