import type { Config } from "tailwindcss";

// Identidade visual Hector Studios: "liquid glass sobre aurora", dark-first.
// Os nomes antigos (ink, moss, clay, ambered, linen, mist) foram remapeados
// para valores do tema escuro, de modo que as classes existentes (text-ink,
// text-moss, border-moss/15, etc.) já renderizem corretas sobre o fundo aurora.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Marca Hector Studios
        papel: "#efefea",
        celeste: "#6ad1e3",
        blu: "#1a2891",
        pink: "#e451f5",
        // Estados
        "magic-green": "#24d18b",
        "magic-amber": "#ffca55",
        "magic-red": "#ff5c7a",
        // Tokens legados remapeados para o tema escuro
        ink: "#ffffff", // texto primário sobre aurora
        moss: "#b9c0d4", // texto secundário suave
        clay: "#6ad1e3", // eyebrow / detalhe (celeste)
        ambered: "#ffca55", // acento quente (barras, alertas)
        linen: "#1a2891", // texto sobre botão branco (blu)
        mist: "#243066" // chip/realce sutil sobre vidro
      },
      fontFamily: {
        display: ['"Montserrat"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"Montserrat"', "ui-sans-serif", "system-ui", "sans-serif"]
      },
      borderRadius: {
        card: "28px",
        button: "16px"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(7, 16, 56, 0.30)",
        glass:
          "0 30px 60px -20px rgba(7, 16, 56, 0.55), 0 8px 24px -10px rgba(7, 16, 56, 0.35)",
        glow: "0 0 40px rgba(228, 81, 245, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
