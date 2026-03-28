import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        tertiary: "#ffb4ae",
        "surface-variant": "#2d3449",
        "on-background": "#dae2fd",
        "surface-container-low": "#131b2e",
        secondary: "#ffb95f",
        "surface-container-lowest": "#060e20",
        primary: "#4be277",
        "primary-container": "#22c55e",
        "secondary-container": "#ee9800",
        "surface-container-highest": "#2d3449",
        "surface-container-high": "#222a3d",
        "on-surface-variant": "#bccbb9",
        "surface-container": "#171f33",
        "surface-bright": "#31394d",
        "surface": "#0b1326",
        background: "#0b1326",
        error: "#ffb4ab",
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"],
      },
      borderRadius: {
        lg: "1rem",
        xl: "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
