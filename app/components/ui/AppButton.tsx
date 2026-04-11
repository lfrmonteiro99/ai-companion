"use client";

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export default function AppButton({
  variant = "primary",
  className = "",
  children,
  ...props
}: AppButtonProps) {
  const base =
    "rounded-xl px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mira-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-base-950";
  const style =
    variant === "primary"
      ? "bg-mira-500 text-white hover:bg-mira-400"
      : variant === "secondary"
        ? "bg-base-700 text-base-100 hover:bg-base-600"
        : "text-base-300 hover:bg-base-700/60 hover:text-base-100";

  return (
    <button className={`${base} ${style} ${className}`} {...props}>
      {children}
    </button>
  );
}
