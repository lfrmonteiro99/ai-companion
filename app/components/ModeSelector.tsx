"use client";

import { motion } from "framer-motion";
import { MessageCircle, Target, Zap, BarChart3, ArrowRight, Lock, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface ModeSelectorProps {
  agentId: string;
  agentName: string;
  level: number;
  onBack: () => void;
}

interface ModeCard {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  locked: boolean;
  lockMessage?: string;
}

export default function ModeSelector({ agentId, agentName, level, onBack }: ModeSelectorProps) {
  const router = useRouter();

  const modes: ModeCard[] = [
    {
      key: "practice",
      title: "Prática Livre",
      description: "Chat livre para experimentar estilos e treinar",
      icon: <MessageCircle size={24} />,
      href: `/chat/${agentId}?mode=practice`,
      locked: false,
    },
    {
      key: "scenarios",
      title: "Cenários",
      description: "Cenários guiados com objetivo claro",
      icon: <Target size={24} />,
      href: `/scenarios?agentId=${agentId}`,
      locked: false,
    },
    {
      key: "challenges",
      title: "Desafios",
      description: "Cenários avançados para os mais experientes",
      icon: <Zap size={24} />,
      href: `/chat/${agentId}?mode=challenge`,
      locked: level < 5,
      lockMessage: "Nível 5 necessário",
    },
    {
      key: "analysis",
      title: "Análise",
      description: "Revê e analisa conversas passadas",
      icon: <BarChart3 size={24} />,
      href: "/history",
      locked: false,
    },
  ];

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

      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="mb-2 font-display text-2xl font-bold italic text-base-50">
          Como queres treinar com {agentName}?
        </h2>
        <p className="text-sm text-base-300">
          Escolhe o modo que melhor se adapta ao teu objetivo.
        </p>
      </div>

      {/* Mode grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {modes.map((mode, i) => (
          <motion.div
            key={mode.key}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.06, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <button
              onClick={() => !mode.locked && router.push(mode.href)}
              disabled={mode.locked}
              className={`group relative flex w-full flex-col items-start rounded-2xl border border-base-500/40 bg-base-800/85 p-5 text-left backdrop-blur-md shadow-surface-1 transition-all duration-300 ease-out ${
                mode.locked
                  ? "cursor-not-allowed opacity-60"
                  : "hover:-translate-y-0.5 hover:border-base-400/60 hover:shadow-surface-2"
              }`}
            >
              {/* Lock overlay */}
              {mode.locked && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-base-950/60 backdrop-blur-[2px]">
                  <Lock size={22} className="mb-1.5 text-base-400" />
                  <span className="text-xs font-medium text-base-400">
                    {mode.lockMessage}
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-base-700/80 text-base-200 transition-colors group-hover:bg-base-600/80 group-hover:text-base-50">
                {mode.icon}
              </div>

              {/* Content */}
              <h3 className="mb-1 font-display text-lg font-semibold italic text-base-50">
                {mode.title}
              </h3>
              <p className="mb-3 text-sm leading-relaxed text-base-300">
                {mode.description}
              </p>

              {/* Arrow */}
              {!mode.locked && (
                <div className="mt-auto flex items-center gap-1 text-xs font-medium text-base-400 transition-colors group-hover:text-base-100">
                  <span>Iniciar</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              )}
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
