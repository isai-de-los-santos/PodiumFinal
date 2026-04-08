/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{tsx,ts,jsx,js}",
    "./components/**/*.{tsx,ts,jsx,js}",
    "./context/**/*.{tsx,ts,jsx,js}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#F4F3F8",
        foreground: "#1A1830",
        card: "#FFFFFF",
        "card-foreground": "#1A1830",
        primary: "#2D2560",
        "primary-foreground": "#FAFAFA",
        secondary: "#F0EEF8",
        muted: "#ECEAF4",
        "muted-foreground": "#6B6585",
        accent: "#D946A8",
        "accent-foreground": "#FAFAFA",
        destructive: "#DC2626",
        "destructive-foreground": "#FAFAFA",
        border: "#E4E2EE",
        input: "#E4E2EE",
        ring: "#D946A8",
        "gradient-start": "#D946A8",
        "gradient-end": "#7C3AED",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      fontFamily: {
        sans: ["Inter_400Regular", "System"],
        "sans-medium": ["Inter_500Medium", "System"],
        "sans-semibold": ["Inter_600SemiBold", "System"],
        "sans-bold": ["Inter_700Bold", "System"],
      },
    },
  },
  plugins: [],
};
