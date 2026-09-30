import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rh: {
          bg: "#f6f7f5",
          panel: "#ffffff",
          line: "#e4e7e3",
          green: "#15803d",
          red: "#e11d48",
          text: "#172018"
        }
      }
    }
  },
  plugins: []
};

export default config;
