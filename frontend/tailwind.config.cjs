/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // All colors reference CSS variables so they swap automatically when data-theme changes
        primary:                    "var(--color-primary)",
        "on-primary":               "var(--color-on-primary)",
        "primary-container":        "var(--color-primary-container)",
        "on-primary-container":     "var(--color-on-primary-container)",
        surface:                    "var(--color-surface)",
        "surface-dim":              "var(--color-surface-dim)",
        "surface-container-lowest": "var(--color-surface-container-lowest)",
        "surface-container-low":    "var(--color-surface-container-low)",
        "surface-container":        "var(--color-surface-container)",
        "surface-container-high":   "var(--color-surface-container-high)",
        "surface-container-highest":"var(--color-surface-container-highest)",
        "on-surface":               "var(--color-on-surface)",
        "on-surface-variant":       "var(--color-on-surface-variant)",
        outline:                    "var(--color-outline)",
        "outline-variant":          "var(--color-outline-variant)",
        "tertiary-container":       "var(--color-tertiary-container)",
        "on-tertiary-container":    "var(--color-on-tertiary-container)",
        error:                      "var(--color-error)",
        "error-container":          "var(--color-error-container)",
        secondary:                  "var(--color-secondary)",
        success:                    "var(--color-success)",
        warning:                    "var(--color-warning)",
        danger:                     "var(--color-danger)",
        info:                       "var(--color-info)",
      },
      fontFamily: {
        headline: ["Noto Serif", "serif"],
        body:     ["Manrope", "sans-serif"],
        label:    ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0px",
        lg:      "0px",
        xl:      "0px",
        full:    "9999px",
      },
    },
  },
  plugins: [],
};
