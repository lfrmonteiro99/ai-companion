"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Target, BookOpen, Lightbulb, MessageSquare, ArrowLeft, Play } from "lucide-react";
import Image from "next/image";

interface ScenarioData {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "normal" | "hard" | "expert";
  context: string;
  objective: string;
  tips: string[];
  maxMessages: number | null;
}

interface AgentOption {
  id: string;
  name: string;
  archetype: string;
  avatar?: string;
}

interface ScenarioBriefingProps {
  scenario: ScenarioData;
  agents: AgentOption[];
  onStart: (agentId: string) => void;
  onBack: () => void;
}

const DIFFICULTY_BADGE: Record<string, string> = {
  easy: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25",
  normal: "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/25",
  hard: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25",
  expert: "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/25",
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Fácil",
  normal: "Normal",
  hard: "Difícil",
  expert: "Especialista",
};

const ARCHETYPE_RING: Record<string, string> = {
  dominant_teasing: "ring-valeria-500/50 hover:ring-valeria-400",
  soft_affectionate: "ring-luna-500/50 hover:ring-luna-400",
  reserved_intellectual: "ring-mira-500/50 hover:ring-mira-400",
  mysterious_enigmatic: "ring-sable-500/50 hover:ring-sable-400",
  playful_chaotic: "ring-kira-500/50 hover:ring-kira-400",
};

const ARCHETYPE_SELECTED: Record<string, string> = {
  dominant_teasing: "ring-valeria-400 shadow-[0_0_16px_rgba(232,48,90,0.25)]",
  soft_affectionate: "ring-luna-400 shadow-[0_0_16px_rgba(232,121,168,0.22)]",
  reserved_intellectual: "ring-mira-400 shadow-[0_0_16px_rgba(99,102,241,0.28)]",
  mysterious_enigmatic: "ring-sable-400 shadow-[0_0_16px_rgba(147,51,234,0.28)]",
  playful_chaotic: "ring-kira-400 shadow-[0_0_16px_rgba(249,115,22,0.25)]",
};

export default function ScenarioBriefing({ scenario, agents, onStart, onBack }: ScenarioBriefingProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [tipsOpen, setTipsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      className="mx-auto max-w-2xl px-4 py-8"
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-1.5 text-sm font-medium text-base-400 transition-colors hover:text-base-100"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      {/* Title + difficulty */}
      <div className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold italic text-base-50">
            {scenario.title}
          </h1>
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase ${
              DIFFICULTY_BADGE[scenario.difficulty] || "bg-base-600 text-base-300 ring-1 ring-base-500"
            }`}
          >
            {DIFFICULTY_LABEL[scenario.difficulty] || scenario.difficulty}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-base-200">
          {scenario.description}
        </p>
      </div>

      {/* Context section */}
      <section className="mb-6">
        <h2 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-base-400">
          <BookOpen size={14} />
          Contexto
        </h2>
        <div className="rounded-xl p-5 surface-1">
          <p className="text-sm leading-relaxed text-base-100">
            {scenario.context}
          </p>
        </div>
      </section>

      {/* Objective section */}
      <section className="mb-6">
        <h2 className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-base-400">
          <Target size={14} />
          Objetivo
        </h2>
        <div className="rounded-xl border border-[var(--agent-accent)]/20 bg-[var(--agent-subtle)] p-5">
          <p className="text-sm font-medium leading-relaxed text-base-50">
            {scenario.objective}
          </p>
        </div>
      </section>

      {/* Message limit */}
      {scenario.maxMessages && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-base-700/60 px-4 py-3">
          <MessageSquare size={14} className="text-base-400" />
          <span className="text-sm text-base-200">
            Limite: <span className="font-semibold text-base-50">{scenario.maxMessages} mensagens</span>
          </span>
        </div>
      )}

      {/* Tips section (collapsible) */}
      {scenario.tips.length > 0 && (
        <section className="mb-8">
          <button
            onClick={() => setTipsOpen(!tipsOpen)}
            className="mb-2.5 flex w-full items-center justify-between text-xs font-semibold uppercase tracking-widest text-base-400 transition-colors hover:text-base-200"
          >
            <span className="flex items-center gap-2">
              <Lightbulb size={14} />
              Dicas
            </span>
            {tipsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <AnimatePresence>
            {tipsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="rounded-xl p-5 surface-1">
                  <ul className="space-y-2.5">
                    {scenario.tips.map((tip, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm leading-relaxed text-base-200"
                      >
                        <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--agent-accent)]" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Agent selector */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-base-400">
          Escolha uma agente
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {agents.map((agent) => {
            const isSelected = selectedAgent === agent.id;
            const ringClass = isSelected
              ? ARCHETYPE_SELECTED[agent.archetype] || "ring-[var(--agent-accent)] shadow-[0_0_16px_var(--agent-glow)]"
              : ARCHETYPE_RING[agent.archetype] || "ring-base-500/50 hover:ring-base-400";

            return (
              <motion.button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                whileTap={{ scale: 0.97 }}
                className={`relative flex flex-col items-center gap-2.5 rounded-xl p-4 ring-2 transition-all duration-200 ${
                  isSelected
                    ? `bg-base-700/80 ${ringClass}`
                    : `bg-base-800/60 ${ringClass} hover:bg-base-700/60`
                }`}
              >
                {agent.avatar ? (
                  <div className="relative h-14 w-14 overflow-hidden rounded-full">
                    <Image
                      src={agent.avatar}
                      alt={agent.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-base-600 text-xl font-display font-semibold text-base-100">
                    {agent.name[0]}
                  </div>
                )}
                <div className="text-center">
                  <p className="font-display text-sm font-semibold italic text-base-50">
                    {agent.name}
                  </p>
                  <p className="text-[10px] tracking-wide text-base-400">
                    {agent.archetype.replace(/_/g, " ")}
                  </p>
                </div>
                {isSelected && (
                  <motion.div
                    layoutId="agent-check"
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--agent-accent)] text-white shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-xl px-5 py-2.5 text-sm font-medium text-base-300 transition-colors hover:bg-base-700/60 hover:text-base-100"
        >
          Voltar
        </button>
        <button
          onClick={() => selectedAgent && onStart(selectedAgent)}
          disabled={!selectedAgent}
          className="flex items-center gap-2 rounded-xl bg-[var(--agent-accent)] px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_20px_var(--agent-glow)] disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
        >
          <Play size={16} />
          Começar
        </button>
      </div>
    </motion.div>
  );
}
