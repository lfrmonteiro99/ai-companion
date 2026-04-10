"use client";

interface SurfaceCardProps {
  children: React.ReactNode;
  className?: string;
}

export function PrimaryCard({ children, className = "" }: SurfaceCardProps) {
  return (
    <section
      className={`rounded-2xl border border-base-500/40 bg-base-800/85 p-5 backdrop-blur-md shadow-surface-1 ${className}`}
    >
      {children}
    </section>
  );
}

export function SecondaryCard({ children, className = "" }: SurfaceCardProps) {
  return (
    <section
      className={`rounded-xl border border-base-600/60 bg-base-700/40 p-4 backdrop-blur-sm ${className}`}
    >
      {children}
    </section>
  );
}
