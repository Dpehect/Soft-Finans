module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    screens: {
      mobile: { max: "767px" },
      tablet: { min: "768px", max: "1279px" },
      desktop: { min: "1280px" },
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        terminal: {
          bg: "var(--ot-color-canvas)",
          canvas: "var(--ot-color-canvas)",
          panel: "var(--ot-color-surface-1)",
          surface: "var(--ot-color-surface-2)",
          border: "var(--ot-color-border-default)",
          text: "var(--ot-color-text-primary)",
          muted: "var(--ot-color-text-muted)",
          accent: "var(--ot-color-accent-primary)",
          pos: "var(--ot-color-market-up)",
          neg: "var(--ot-color-market-down)",
          warn: "var(--ot-color-system-warning)",
          black: "var(--ot-color-canvas)"
        }
      },
      borderRadius: {
        sm: "0.5rem", // 8px (softens all legacy rounded-sm)
        DEFAULT: "0.625rem", // 10px
        md: "0.75rem", // 12px
        lg: "1rem", // 16px
        xl: "1.25rem", // 20px
        "2xl": "1.5rem", // 24px
        "3xl": "2rem"
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        card: "0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 0 1px 1px rgba(0, 0, 0, 0.025)",
        glow: "0 0 25px -5px var(--ot-color-accent-glow)"
      }
    }
  },
  plugins: []
};
