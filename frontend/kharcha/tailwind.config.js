// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#0D9488",
        "primary-hover": "#0F766E",
        "accent": "#2DD4BF",
        "background-dark": "#18181B",
        "surface-dark": "#27272A",
        "surface-glass": "rgba(39, 39, 42, 0.6)",
        "text-main": "#F4F4F5",
        "text-muted": "#A1A1AA",
      },
      fontFamily: {
        "display": ["Rubik-Regular"],
        "body": ["Rubik-Regular"],
        "mono": ["CaskaydiaCove-Regular"],
        "mono-custom": ["CaskaydiaCove-Regular"]
      },
      boxShadow: {
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glow": "0 0 15px rgba(45, 212, 191, 0.3)"
      }
    },
  },
  plugins: [],
}