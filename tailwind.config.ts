import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211a",
        moss: "#42523d",
        clay: "#9b5b3e",
        ambered: "#c78a45",
        linen: "#f8f3ea",
        mist: "#edf2ed"
      },
      boxShadow: {
        soft: "0 16px 40px rgba(23, 33, 26, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
