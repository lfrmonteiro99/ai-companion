"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { HelpCircle } from "lucide-react";

interface InfoTooltipProps {
  content: ReactNode;
  label?: string;
  size?: number;
  align?: "center" | "start" | "end";
  side?: "top" | "bottom";
}

/**
 * A `?` icon that opens a tooltip on hover (desktop) or tap (mobile).
 * Closes on click-outside, Escape, or pointer leave.
 */
export default function InfoTooltip({
  content,
  label,
  size = 12,
  align = "center",
  side = "top",
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const alignClass =
    align === "start"
      ? "left-0"
      : align === "end"
        ? "right-0"
        : "left-1/2 -translate-x-1/2";

  const sideClass = side === "bottom" ? "top-full mt-1.5" : "bottom-full mb-1.5";

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="inline-flex items-center justify-center rounded-full text-base-400 transition-colors hover:text-base-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mira-500/50"
        aria-label={label || "Mais informação"}
        aria-expanded={open}
      >
        <HelpCircle size={size} aria-hidden="true" />
      </button>
      {open && (
        <div
          role="tooltip"
          className={`pointer-events-none absolute z-30 w-56 rounded-lg border border-base-500/40 bg-base-800/95 px-2.5 py-2 text-[11px] leading-relaxed text-base-100 shadow-lg backdrop-blur-sm ${alignClass} ${sideClass}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
