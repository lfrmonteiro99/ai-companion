import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      colors: {
        base: {
          950: "#06060b",
          900: "#0d0d14",
          800: "#13131e",
          700: "#1a1a2a",
          600: "#22223a",
          500: "#2e2e4a",
          400: "#4a4a6a",
          300: "#6b6b8a",
          200: "#9a9ab0",
          100: "#c8c8dc",
          50: "#f0f0f8",
        },
        valeria: { 300: "#f87a96", 400: "#f04d72", 500: "#e8305a" },
        luna: { 300: "#f8b8d4", 400: "#f096bc", 500: "#e879a8" },
        mira: { 300: "#a5b4fc", 400: "#818cf8", 500: "#6366f1" },
        sable: { 300: "#c084fc", 400: "#a855f7", 500: "#9333ea" },
        kira: { 300: "#fdba74", 400: "#fb923c", 500: "#f97316" },
      },
      boxShadow: {
        "surface-1": "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)",
        "surface-2": "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        "surface-3": "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)",
      },
      animation: {
        "typing-dot": "typingDot 1.2s ease-in-out infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        typingDot: {
          "0%, 60%, 100%": { opacity: "0.3", transform: "translateY(0)" },
          "30%": { opacity: "1", transform: "translateY(-4px)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 8px var(--agent-glow, rgba(129,140,248,0.2))" },
          "50%": { boxShadow: "0 0 20px var(--agent-glow, rgba(129,140,248,0.45))" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
