import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          950: "#0d1f14",
          900: "#1E3A27",
          800: "#2a4d34",
          700: "#345e3f",
          600: "#3f7050",
        },
        gold: {
          300: "#f2c4aa",
          400: "#df9975",
          500: "#C87A53",
          600: "#a86242",
        },
        cream: "#F9F9F7",
        stone: {
          50:  "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans:  ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(to bottom right, #0d1f14 0%, #1E3A27 50%, #0d1f14 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-left": {
          "0%":   { opacity: "0", transform: "translateX(32px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-right": {
          "0%":   { opacity: "0", transform: "translateX(-32px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-up":     "fade-up 0.7s ease-out both",
        "fade-in":     "fade-in 0.6s ease-out both",
        "slide-left":  "slide-left 0.7s ease-out both",
        "slide-right": "slide-right 0.7s ease-out both",
        "scale-in":    "scale-in 0.5s ease-out both",
        "float":       "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
