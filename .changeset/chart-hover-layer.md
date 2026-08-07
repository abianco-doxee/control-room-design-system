---
"@control-room/design-system": minor
---

Chart hover layer — crosshair + tooltips on the line and bar charts (the data-viz
method ships interactive charts by default).

- **CrLineChart** — a pointer over the plot snaps a dashed crosshair to the
  nearest sample, drops a cursor dot on every series, and docks a tooltip reading
  each series' value at that x.
- **CrBarChart** — the nearest bar stays lit while the rest dim, with a tooltip
  reading its label + value.

Progressive enhancement: the layer renders nothing at rest, so it never touches
the static page, the visual baselines, or the a11y tree — keyboard / AT users get
the same numbers from each figure's `role="img"` spoken summary. It stays on under
the `calm` intensity profile (interaction feedback, not idle motion).

Build plumbing: the React target now runs with Mitosis's formatter disabled
(`prettier: false`) plus a new `build/build-fix-react.mjs` post-step, because
Mitosis's bundled prettier 2.8.8 collapses a component onto one line when the
props interface has several JSDoc'd members and emits `useState(...)` without a
trailing semicolon — together, unparseable. The fixer restores the semicolons and
formats with the project's prettier 3. a11y (4 themes), responsive, islands, and
visual gates all green; type gate green.
