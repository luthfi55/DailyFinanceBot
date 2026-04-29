import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        background: "#f8f9ff",
        "on-background": "#0b1c30",
        surface: "#f8f9ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container-high": "#dce9ff",
        primary: "#091426",
        "on-primary": "#ffffff",
        "on-primary-fixed-variant": "#3c475a",
        "on-surface": "#0b1c30",
        "on-surface-variant": "#45474c",
        outline: "#75777d",
        "outline-variant": "#c5c6cd",
        "on-tertiary-container": "#4c8dff",
        error: "#ba1a1a",
      },
      boxShadow: {
        "login-card":
          "0 15px 35px rgba(30, 41, 59, 0.06), 0 5px 15px rgba(30, 41, 59, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
