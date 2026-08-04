/** Mitosis — author once (components/*.lite.tsx), compile to idiomatic native
 * code per framework. Styling lives in styles/components.css (.cr-* classes),
 * so these components carry only structure + props + a11y + state.
 * Build: npm run build:components → dist/frameworks/<target>/ */
module.exports = {
  files: "components/**",
  targets: ["react", "vue", "svelte", "angular", "solid", "qwik"],
  dest: "dist/frameworks",
  options: {
    react: { typescript: true },
    vue: { typescript: true, api: "composition" },
    qwik: { typescript: true },
  },
};
