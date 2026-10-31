/** @type {import('tailwindcss').Config} */
import animate from "tailwindcss-animate";
const c = (v) => `hsl(var(--${v}))`;
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1280px" } },
    extend: {
      fontFamily: {
        sans: ['"Noto Sans JP"', "system-ui", "sans-serif"],
        serif: ['"Noto Serif JP"', "Georgia", "serif"],
      },
      colors: {
        border: c("border"), input: c("input"), ring: c("ring"),
        background: c("background"), foreground: c("foreground"),
        ...Object.fromEntries(
          ["primary", "secondary", "destructive", "muted", "accent", "popover", "card"].map((k) => [
            k, { DEFAULT: c(k), foreground: c(`${k}-foreground`) },
          ]),
        ),
        // ファクトチェック判定 / マーカー色
        verified: c("verified"), partial: c("partial"), refuted: c("refuted"), marker: c("marker"),
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
    },
  },
  plugins: [animate],
};
