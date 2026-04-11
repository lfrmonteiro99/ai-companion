"use client";

import { useCallback, useEffect, useState } from "react";
import ExerciseCard from "@/app/components/exercises/ExerciseCard";
import ExerciseAnswerInput from "@/app/components/exercises/ExerciseAnswerInput";
import ExerciseResultCard from "@/app/components/exercises/ExerciseResultCard";
import PageHeader from "@/app/components/ui/PageHeader";
import AppButton from "@/app/components/ui/AppButton";
import { EmptyState, ErrorState, SkeletonState } from "@/app/components/ui/StateBlocks";
import { PrimaryCard } from "@/app/components/ui/SurfaceCard";

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
  const DAILY_PACK_TARGET = 5;
  const [exercise, setExercise] = useState<ExerciseData | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);

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
      setCompletedCount((current) => Math.min(DAILY_PACK_TARGET, current + 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-73px)] overflow-hidden">
      <div className="relative mx-auto max-w-3xl px-6 py-10">
        <PageHeader
          title="Micro Exercícios"
          subtitle="Exercícios rápidos de uma pergunta com feedback instantâneo e XP."
        />
        <div className="mb-4 rounded-xl border border-base-500/40 bg-base-800/70 px-4 py-3">
          <div className="mb-1 flex items-center justify-between text-xs text-base-300">
            <span>Pack diário</span>
            <span>
              {completedCount}/{DAILY_PACK_TARGET}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-base-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-mira-500 to-emerald-400"
              style={{ width: `${(completedCount / DAILY_PACK_TARGET) * 100}%` }}
            />
          </div>
        </div>

        {loading && <SkeletonState />}
        {error && <ErrorState message={error} />}
        {/* Daily pack complete celebration */}
        {completedCount >= DAILY_PACK_TARGET && !loading && (
          <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center backdrop-blur-md">
            <p className="text-2xl" aria-hidden="true">🎉</p>
            <p className="mt-2 font-display text-lg font-semibold text-emerald-300">Pack diário completo!</p>
            <p className="mt-1 text-sm text-base-300">Completaste os {DAILY_PACK_TARGET} exercícios de hoje. Volta amanhã para mais.</p>
            <a href="/" className="mt-4 inline-flex rounded-xl bg-base-700 px-4 py-2 text-sm font-medium text-base-100 transition hover:bg-base-600">
              Voltar ao dashboard
            </a>
          </div>
        )}

        {!loading && !error && !exercise && completedCount < DAILY_PACK_TARGET && (
          <EmptyState
            title="Nenhum exercício disponível"
            description="Tenta de novo num momento. Novos exercícios aparecerão aqui."
          />
        )}

        {exercise && !loading && (
          <div className="space-y-4">
            <ExerciseCard {...exercise} />
            <PrimaryCard>
              <p className="mb-3 text-sm font-medium text-base-100">Your answer</p>
              <ExerciseAnswerInput
                type={exercise.type}
                options={exercise.options}
                value={answer}
                onChange={setAnswer}
              />
              <div className="mt-4 flex gap-2">
                <AppButton
                  onClick={handleSubmit}
                  disabled={submitting || !answer.trim()}
                >
                  {submitting ? "Submitting..." : "Submit answer"}
                </AppButton>
                <AppButton
                  variant="secondary"
                  onClick={loadNext}
                >
                  Skip
                </AppButton>
              </div>
            </PrimaryCard>

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
              <AppButton
                onClick={loadNext}
                variant="primary"
                className="w-full sm:w-auto"
              >
                Next exercise
              </AppButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
