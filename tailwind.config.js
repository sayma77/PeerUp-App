/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FFB300",
        "primary-medium": "#F59E0B",
        "primary-dark": "#D97706",
        "bg-darkest": "#05070A",
        "bg-dark": "#070A10",
        "bg-light": "#0A0E17",
        "bg-medium": "#111622",
        "text-primary": "#F8FAFC",
        "text-secondary": "#FFB300",
        "text-muted": "#64748B",
        border: "rgba(255, 255, 255, 0.04)",
      },
    },
  },
  plugins: [],
};