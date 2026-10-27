import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Landing page brand tokens
        "brand-crimson": "#9B1B1B",
        "brand-dark":    "#6E0A0E",
        "brand-gold":    "#F5B400",
        "brand-navy":    "#1a1a2e",
        // Student-side palette
        "campus-red":       "#951A1A",
        "campus-red-dark":  "#7A1515",
        // PUPILA admin palette
        "pupila-bg":        "#fbf8f5",
        "pupila-card":      "#fffefd",
        "pupila-ink":       "#2b1716",
        "pupila-mute":      "#74635e",
        "pupila-line":      "#eadfd8",
        "pupila-brand":     "#971b1f",
        "pupila-tint":      "#f9e9e5",
        "pupila-soft":      "#f6eee8",
        "pupila-gold":      "#f5b400",
        "pupila-gold-soft": "#fff2c7",
        "pupila-green":     "#1f8a5b",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "'Inter'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;