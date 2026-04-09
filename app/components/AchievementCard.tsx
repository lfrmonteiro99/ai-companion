"use client";

import { motion } from "framer-motion";
import {
  MessageCircle,
  Target,
  Brain,
  Shield,
  Heart,
  Star,
  Trophy,
  Zap,
  Users,
  Award,
  ThumbsUp,
  Flame,
  Eye,
  Sparkles,
  Crown,
  Lock,
  Check,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Achievement {
  id: string;
  label: string;
  description: string;
  icon: string;
}

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
}

// ---------------------------------------------------------------------------
// Icon mapping
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  MessageCircle,
  Target,
  Brain,
  Shield,
  Heart,
  Star,
  Trophy,
  Zap,
  Users,
  Award,
  ThumbsUp,
  Flame,
  Eye,
  Sparkles,
  Crown,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AchievementCard({ achievement, unlocked }: AchievementCardProps) {
  const IconComponent = ICON_MAP[achievement.icon] || Star;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={unlocked ? { scale: 1.03, y: -2 } : undefined}
      className={`
        relative rounded-xl border p-4 transition-colors duration-200
        ${unlocked
          ? "border-base-500/40 bg-base-800/85 backdrop-blur-md hover:border-base-400/60"
          : "border-base-500/20 bg-base-800/40 backdrop-blur-sm opacity-60"
        }
      `}
    >
      {/* Subtle glow on unlocked cards */}
      {unlocked && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-mira-500/5 to-transparent pointer-events-none" />
      )}

      <div className="relative flex items-start gap-3">
        {/* Icon container */}
        <div className="relative shrink-0">
          <div
            className={`
              flex h-10 w-10 items-center justify-center rounded-lg
              ${unlocked
                ? "bg-mira-500/15 text-mira-400 shadow-sm shadow-mira-500/10"
                : "bg-base-600/40 text-base-500"
              }
            `}
          >
            {unlocked ? (
              <IconComponent size={20} />
            ) : (
              <Lock size={18} />
            )}
          </div>

          {/* Checkmark badge for unlocked */}
          {unlocked && (
            <div className="absolute -bottom-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30">
              <Check size={10} className="text-white" strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <h4
            className={`text-sm font-semibold leading-tight ${
              unlocked ? "text-base-50" : "text-base-400"
            }`}
          >
            {achievement.label}
          </h4>
          <p
            className={`mt-0.5 text-xs leading-relaxed ${
              unlocked ? "text-base-300" : "text-base-500"
            }`}
          >
            {achievement.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
