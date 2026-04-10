"use client";

interface OptionItem {
  id: string;
  text: string;
}

interface ExerciseAnswerInputProps {
  type: string;
  options?: OptionItem[];
  value: string;
  onChange: (value: string) => void;
}

export default function ExerciseAnswerInput({
  type,
  options,
  value,
  onChange,
}: ExerciseAnswerInputProps) {
  if (options && options.length > 0 && type !== "rewrite_message") {
    return (
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.id}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              value === option.id
                ? "border-mira-400 bg-mira-500/10 text-base-50"
                : "border-base-600/70 bg-base-700/40 text-base-200"
            }`}
          >
            <input
              type="radio"
              name="exercise-option"
              value={option.id}
              checked={value === option.id}
              onChange={(e) => onChange(e.target.value)}
              className="accent-mira-400"
            />
            <span>
              <span className="mr-2 text-base-400">{option.id.toUpperCase()}.</span>
              {option.text}
            </span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Write your one-sentence answer..."
      className="h-28 w-full rounded-lg border border-base-600/70 bg-base-700/40 px-3 py-2 text-sm text-base-100 outline-none ring-mira-400/40 placeholder:text-base-400 focus:ring"
    />
  );
}
