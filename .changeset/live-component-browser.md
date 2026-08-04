---
"@control-room/design-system": minor
---

Component Browser demos are now the **real compiled components**, live and interactive.

Previously each demo was hand-authored static HTML styled with the shipped CSS —
faithful to the look, but not the actual component, and not interactive. Now the
browser mounts the genuine compiled React output (`dist/frameworks/react`) as
client-side islands:

- **22 live islands** — accordion, tabs, menu, combobox, command palette, tree,
  drawer, popover, hover-card, segmented, radio-group, slider, number-field,
  pagination, date-time, cron-field, modal, switch, select, tooltip, table, and
  toast-region — each the shipped component with a tiny stateful wrapper so
  `onChange` actually drives it. Controlled inputs update, tabs switch, the tree
  expands, overlays open, toasts stack and dismiss. Purely-presentational
  components keep their static all-states grid (clearer as a states catalog).
- `build/showcase-islands.jsx` imports the real components; `build/build-showcase.mjs`
  esbuild-bundles it (minified IIFE) and inlines it, so `components.html` stays a
  single self-contained file for GitHub Pages. A live cell is marked
  "live · interactive"; markup is never hand-written — no drift.
- **Codegen fix (surfaced by bundling).** The compiled React output for
  `CrCombobox` and `CrPalette` didn't compile: a store method `setQuery` collided
  with the `[query, setQuery] = useState()` setter Mitosis generates. Renamed the
  method to `onQuery` in both sources. Nothing type-checked the React output before,
  so this had shipped broken.
- **a11y (found by the new live gate).** The real `CrSelect` is a bare `<select>`
  with no label prop — flagged for a missing accessible name — so the demo now
  composes it with an associated `<label>` (correct real-world usage).
- New gate `tests/showcase-islands.spec.mjs`: asserts all islands mount error-free,
  that the registry matches the emitted mount points (drift guard), and that they
  stay interactive (tabs/switch/accordion driven). Wired into CI. The showcase a11y
  gate now covers the live components too.

Tooling: `react`/`react-dom`/`esbuild` added as devDependencies (build-time only,
not shipped); `build:components` now runs before `build:showcase` in `build` and
`pretest:e2e`.
