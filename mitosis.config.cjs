/** Mitosis — author once (components/*.lite.tsx), compile to idiomatic native
 * code per framework. Styling lives in styles/components.css (.cr-* classes),
 * so these components carry only structure + props + a11y + state.
 * Build: npm run build:components → dist/frameworks/<target>/ */
module.exports = {
  files: "components/**",
  targets: ["react", "vue", "svelte", "angular", "solid", "qwik"],
  dest: "dist/frameworks",
  options: {
    // prettier:false — Mitosis's bundled prettier (2.8.8) collapses a component
    // onto one line when the props interface carries several JSDoc-commented
    // members, and it emits `useState(...)` initializers WITHOUT a trailing
    // semicolon; collapsed together those two quirks produce unparseable output
    // and the build throws. We skip its formatter and re-format the React output
    // ourselves in build-fix-react.mjs (add the missing semicolons + prettier 3).
    react: { typescript: true, prettier: false },
    vue: { typescript: true, api: "composition" },
    qwik: { typescript: true },
  },
};
