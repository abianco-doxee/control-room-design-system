/* GENERATED — do not edit. Source: tokens/tokens.json */
/* Tailwind preset. Colors resolve to CSS custom properties, so utilities
   follow html[data-theme] automatically. Usage: presets: [require('./dist/tailwind-preset.cjs')] */
module.exports = {
  theme: {
    extend: {
      colors: {
              "ground": "var(--ground)",
              "board": "var(--board)",
              "panel": "var(--panel)",
              "panel-2": "var(--panel-2)",
              "rail": "var(--rail)",
              "ink": "var(--ink)",
              "muted": "var(--muted)",
              "rail-ink": "var(--rail-ink)",
              "on-sig": "var(--on-sig)",
              "on-err": "var(--on-err)",
              "on-accent": "var(--on-accent)",
              "on-idle": "var(--on-idle)",
              "border": "var(--border)",
              "mass": "var(--mass)",
              "shadow-col": "var(--shadow-col)",
              "sig-work": "var(--sig-work)",
              "sig-wait": "var(--sig-wait)",
              "sig-done": "var(--sig-done)",
              "sig-err": "var(--sig-err)",
              "sig-idle": "var(--sig-idle)",
              "sig-accent": "var(--sig-accent)",
              "stage": "var(--stage)",
              "stage-ink": "var(--stage-ink)",
              "drip": "var(--drip)"
      },
      borderRadius: { none: "0px", DEFAULT: "0px" },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"]
      }
    }
  },
  corePlugins: { /* radius stays 0 by system law */ }
};
