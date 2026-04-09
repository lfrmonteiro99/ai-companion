"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Star, Check } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface XPGainToastProps {
  xp: number;
  leveledUp: boolean;
  newLevel?: number;
  achievements: { label: string }[];
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUTO_DISMISS_MS = 5000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function XPGainToast({
  xp,
  leveledUp,
  newLevel,
  achievements,
  onClose,
}: XPGainToastProps) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  // Auto-dismiss countdown
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setVisible(false);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Trigger onClose after exit animation
  useEffect(() => {
    if (!visible) {
      const timeout = setTimeout(onClose, 300);
      return () => clearTimeout(timeout);
    }
  }, [visible, onClose]);

  function handleClose() {
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-50 w-80 max-w-[calc(100vw-3rem)]"
        >
          <div
            className={`
              relative overflow-hidden rounded-xl surface-2
              ${leveledUp ? "ring-1 ring-amber-500/30 shadow-lg shadow-amber-500/10" : ""}
            `}
          >
            {/* Level-up glow overlay */}
            {leveledUp && (
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-amber-500/5 pointer-events-none" />
            )}

            <div className="relative p-4">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute right-3 top-3 rounded-md p-1 text-base-400 transition-colors hover:bg-base-600/60 hover:text-base-200"
              >
                <X size={14} />
              </button>

              {/* XP gain */}
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mira-500/15 text-mira-400">
                  <Zap size={18} />
                </div>
                <div>
                  <span className="font-display text-lg font-bold text-base-50">
                    +{xp} XP
                  </span>
                </div>
              </div>

              {/* Level up */}
              {leveledUp && newLevel && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 ring-1 ring-amber-500/20"
                >
                  <Star size={16} className="text-amber-400 shrink-0" />
                  <span className="text-sm font-semibold text-amber-300">
                    Nivel {newLevel}!
                  </span>
                </motion.div>
              )}

              {/* Achievements */}
              {achievements.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {achievements.map((ach, i) => (
                    <motion.div
                      key={ach.label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-center gap-2"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                        <Check size={10} className="text-emerald-400" strokeWidth={3} />
                      </div>
                      <span className="text-xs font-medium text-base-200">
                        {ach.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Progress bar (auto-dismiss) */}
            <div className="h-0.5 w-full bg-base-600/40">
              <div
                className="h-full bg-mira-400/60 transition-none"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
