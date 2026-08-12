/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#050508",
        surface: "#0d0d14",
        glass: "rgba(255,255,255,0.04)",
        "glass-border": "rgba(255,255,255,0.08)",
        "glass-hover": "rgba(255,255,255,0.07)",
        neon: {
          cyan: "#00e5ff",
          red: "#ff2d55",
          amber: "#ffb800",
          green: "#00ff94",
          purple: "#bf5fff",
        },
        text: {
          primary: "#e8eaf6",
          secondary: "#8b8fa8",
          muted: "#4a4d63",
        },
      },
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backdropBlur: {
        glass: "16px",
      },
      boxShadow: {
        float: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
        "float-hover": "0 16px 48px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,229,255,0.15)",
        glow: "0 0 20px rgba(0,229,255,0.3)",
        "glow-red": "0 0 20px rgba(255,45,85,0.4)",
        "glow-amber": "0 0 20px rgba(255,184,0,0.3)",
        "glow-green": "0 0 20px rgba(0,255,148,0.3)",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease forwards",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: "translateY(16px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%,100%": { opacity: 0.6 },
          "50%": { opacity: 1 },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
