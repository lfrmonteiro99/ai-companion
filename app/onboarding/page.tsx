"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, MessageCircle, Target, Zap, ChevronRight } from "lucide-react";

const INTERESTS = [
  "Música", "Viagens", "Gastronomia", "Desporto", "Cinema", "Arte",
  "Tecnologia", "Natureza", "Fotografia", "Leitura", "Gaming", "Fitness",
  "Yoga", "Cozinhar", "Dança", "Moda",
];

const AGENTS = [
  { id: "valeria", name: "Valeria", archetype: "Dominante & Provocadora", color: "bg-rose-500", bio: "Afiada, provocadora e difícil de impressionar. Testa-te antes de te dar corda." },
  { id: "luna", name: "Luna", archetype: "Doce & Afetuosa", color: "bg-pink-400", bio: "Calorosa, gentil e emocionalmente intuitiva. Recompensa vulnerabilidade genuína." },
  { id: "mira", name: "Mira", archetype: "Reservada & Intelectual", color: "bg-indigo-500", bio: "Ponderada, perspicaz e silenciosamente intensa. Aprecia profundidade e autenticidade." },
  { id: "sable", name: "Sable", archetype: "Misteriosa & Enigmática", color: "bg-violet-500", bio: "Críptica, cativante e imprevisível. Revela-se lentamente a quem merece." },
  { id: "kira", name: "Kira", archetype: "Divertida & Caótica", color: "bg-amber-400", bio: "Espontânea, ousada e contagiantemente energética. Valoriza autenticidade e humor." },
];

const STEPS = [
  { title: "Bem-vindo ao Conversa", icon: MessageCircle },
  { title: "Os teus interesses", icon: Target },
  { title: "Escolhe quem conhecer", icon: Zap },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleInterest(interest: string) {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 5 ? [...prev, interest] : prev
    );
  }

  async function saveProfileAndStart(agentId: string) {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || undefined,
          interests: selectedInterests.length > 0 ? selectedInterests : undefined,
        }),
      });
    } catch {
      // Non-blocking — profile save is optional
    }
    router.push(`/chat/${agentId}`);
  }

  return (
    <div className="relative min-h-[calc(100vh-73px)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[500px] w-[600px] rounded-full bg-mira-500/[0.06] blur-[120px]" />
        <div className="absolute right-1/4 top-20 h-[400px] w-[500px] rounded-full bg-sable-500/[0.05] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-xl px-4 py-10 sm:px-6">
        {/* Progress bar */}
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex flex-1 items-center gap-2">
              <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? "bg-mira-500" : "bg-base-700"}`} />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h1 className="font-display text-3xl font-bold text-base-50">
                  Bem-vindo ao Conversa
                </h1>
                <p className="mt-3 text-base-300">
                  Treina as tuas competências sociais em conversas simuladas com personalidades
                  únicas. Sem julgamento, sem pressão — só prática real.
                </p>
              </div>

              <div className="space-y-3 rounded-2xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md">
                <div className="flex items-start gap-3">
                  <MessageCircle size={20} className="mt-0.5 shrink-0 text-mira-400" />
                  <div>
                    <p className="text-sm font-medium text-base-100">Conversas com 5 personalidades</p>
                    <p className="text-xs text-base-400">Cada agente reage de forma diferente ao teu estilo.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target size={20} className="mt-0.5 shrink-0 text-mira-400" />
                  <div>
                    <p className="text-sm font-medium text-base-100">Cenários e exercícios práticos</p>
                    <p className="text-xs text-base-400">Situações reais com feedback detalhado e pontuação.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap size={20} className="mt-0.5 shrink-0 text-mira-400" />
                  <div>
                    <p className="text-sm font-medium text-base-100">Progressão e análise de skills</p>
                    <p className="text-xs text-base-400">Acompanha a tua evolução em 10 dimensões de comunicação.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-base-200">
                  Como queres ser chamado? <span className="text-base-500">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="O teu nome ou nickname"
                  maxLength={30}
                  className="w-full rounded-xl border border-base-500/40 bg-base-700/50 px-4 py-3 text-sm text-base-100 placeholder-base-500 outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
                />
              </div>

              <button
                onClick={() => setStep(1)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-mira-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-mira-400"
              >
                Continuar <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* Step 1: Interests */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="font-display text-2xl font-bold text-base-50">
                  Quais são os teus interesses?
                </h2>
                <p className="mt-2 text-sm text-base-300">
                  Escolhe até 5. Isto ajuda os agentes a personalizar as conversas.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                      selectedInterests.includes(interest)
                        ? "bg-mira-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                        : "bg-base-700/80 text-base-300 hover:bg-base-600/80 hover:text-base-100"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>

              <p className="text-center text-xs text-base-500">
                {selectedInterests.length}/5 selecionados
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 rounded-xl bg-base-700 px-4 py-3 text-sm font-medium text-base-100 transition hover:bg-base-600"
                >
                  Voltar
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-mira-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-mira-400"
                >
                  Continuar <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Choose Agent */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="font-display text-2xl font-bold text-base-50">
                  Com quem queres começar?
                </h2>
                <p className="mt-2 text-sm text-base-300">
                  Cada personalidade é um desafio diferente. Podes falar com todas depois.
                </p>
              </div>

              <div className="space-y-3">
                {AGENTS.map((agent) => (
                  <button
                    key={agent.id}
                    disabled={saving}
                    onClick={() => saveProfileAndStart(agent.id)}
                    className="group flex w-full items-center gap-4 rounded-2xl border border-base-500/40 bg-base-800/85 p-4 text-left backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-base-300/60 hover:shadow-surface-2 disabled:opacity-50"
                  >
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-display font-bold text-white ${agent.color}`}>
                      {agent.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-semibold text-base-50">{agent.name}</span>
                        <span className="rounded-full bg-base-700/80 px-2 py-0.5 text-[10px] text-base-400">{agent.archetype}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-base-300 line-clamp-2">{agent.bio}</p>
                    </div>
                    <ChevronRight size={18} className="shrink-0 text-base-500 transition-colors group-hover:text-base-200" />
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full rounded-xl bg-base-700 px-4 py-3 text-sm font-medium text-base-100 transition hover:bg-base-600"
              >
                Voltar
              </button>

              <p className="text-center text-xs text-base-500">
                Podes também <a href="/" className="text-mira-400 hover:text-mira-300 transition-colors">saltar para o dashboard</a>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
