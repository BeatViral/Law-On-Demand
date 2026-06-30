import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#09111f",
        graphite: "#233044",
        cobalt: "#155dfc",
        cyanfire: "#02c7ee",
        verdict: "#11a36a",
        amberlaw: "#f2a900",
        signal: "#ef4444"
      },
      boxShadow: {
        "legal-glow": "0 24px 80px rgba(21, 93, 252, 0.22)",
        "panel": "0 18px 60px rgba(9, 17, 31, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
