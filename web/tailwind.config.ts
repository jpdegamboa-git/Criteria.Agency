import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: "#ffd053",
          coral: "#e86b73",
          turquoise: "#55c9ca",
          orange: "#ed854b",
          dark: "#585758",
          muted: "#9d9a9c",
        },
        surface: {
          bg: "#fafafa",
          card: "#ffffff",
          border: "#e8e8e8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        "fade-in-up": "fadeInUp 0.6s ease-out both",
        "fade-in-up-1": "fadeInUp 0.6s ease-out 0.1s both",
        "fade-in-up-2": "fadeInUp 0.6s ease-out 0.2s both",
        "fade-in-up-3": "fadeInUp 0.6s ease-out 0.3s both",
        "fade-in-up-4": "fadeInUp 0.6s ease-out 0.4s both",
        "fade-in-up-5": "fadeInUp 0.6s ease-out 0.5s both",
      },
    },
  },
  plugins: [],
};

export default config;
