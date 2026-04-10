"use client";

import { useCallback, useEffect, useState } from "react";
import ExerciseCard from "@/app/components/exercises/ExerciseCard";
import ExerciseAnswerInput from "@/app/components/exercises/ExerciseAnswerInput";
import ExerciseResultCard from "@/app/components/exercises/ExerciseResultCard";

interface ExerciseOption {
  id: string;
  text: string;
}

interface ExerciseData {
  id: string;
  type: string;
  title: string;
  prompt: string;
  difficulty: string;
  targetSkill: string;
  options?: ExerciseOption[];
  explanation?: string | null;
}

interface SubmitResponse {
  result: {
    isCorrect: boolean;
    adjustedScore: number;
    finalXpAwarded: number;
    penalties: {
      hintsUsed: number;
      directHintUses: number;
      scorePenalty: number;
      xpPenalty: number;
    };
    bonuses: {
      noHintBonus: number;
      firstTodayBonus: number;
    };
  };
  exercise: {
    explanation?: string | null;
  };
}

export default function ExercisesPage() {
  const [exercise, setExercise] = useState<ExerciseData | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNext = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setAnswer("");
    try {
      const res = await fetch("/api/micro-exercises/next");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load exercise");
      }
      setExercise(data.exercise);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNext();
  }, [loadNext]);

  async function handleSubmit() {
    if (!exercise || !answer.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload =
        exercise.type === "rewrite_message"
          ? { exerciseId: exercise.id, answer: { text: answer } }
          : { exerciseId: exercise.id, answer: { optionId: answer } };
      const res = await fetch("/api/micro-exercises/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit answer");
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-73px)] overflow-hidden">
      <div className="relative mx-auto max-w-3xl px-6 py-10">
        <div className="mb-5">
          <h1 className="font-display text-3xl font-semibold text-base-50">Micro Exercises</h1>
          <p className="text-base-300">One-question practice drills with instant feedback and XP.</p>
        </div>

        {loading && <p className="text-base-300">Loading exercise...</p>}
        {error && <p className="mb-3 text-sm text-rose-400">{error}</p>}

        {exercise && !loading && (
          <div className="space-y-4">
            <ExerciseCard {...exercise} />
            <section className="rounded-2xl border border-base-500/40 bg-base-800/85 p-5">
              <p className="mb-3 text-sm font-medium text-base-100">Your answer</p>
              <ExerciseAnswerInput
                type={exercise.type}
                options={exercise.options}
                value={answer}
                onChange={setAnswer}
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !answer.trim()}
                  className="rounded-lg bg-mira-500 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-mira-400 disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit answer"}
                </button>
                <button
                  onClick={loadNext}
                  className="rounded-lg bg-base-700 px-3.5 py-2 text-sm font-medium text-base-100 transition hover:bg-base-600"
                >
                  Skip
                </button>
              </div>
            </section>

            {result && (
              <ExerciseResultCard
                isCorrect={result.result.isCorrect}
                adjustedScore={result.result.adjustedScore}
                finalXpAwarded={result.result.finalXpAwarded}
                penalties={result.result.penalties}
                bonuses={result.result.bonuses}
                explanation={result.exercise.explanation}
              />
            )}
            {result && (
              <button
                onClick={loadNext}
                className="rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
              >
                Next exercise
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
