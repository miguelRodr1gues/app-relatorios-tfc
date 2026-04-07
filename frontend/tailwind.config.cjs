/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["class"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Poppins",
          "sans-serif",
        ],
      },

      colors: {
        background: "#fafafa",
        foreground: "#1f2937",
        card: "#ffffff",
        "card-foreground": "#1f2937",
        border: "#e5e7eb",
        muted: "#f3f4f6",
        "muted-foreground": "#6b7280",
        primary: "#2d6a4f",
        "primary-foreground": "#ffffff",
        destructive: "#dc2626",
        "destructive-foreground": "#ffffff",
      },

      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.4s ease both",
      },

      borderRadius: {
        lg: "14px",
        xl: "20px",
      },
    },
  },
  plugins: [],
};
