---
"@control-room/design-system": minor
---

Lean into ASCII: first-class rules, meters, spinner, and an empty/loading backdrop.

- **ASCII rules** — `.cr-rule` (solid ──), `--hatch` (▓▒░), `--dot` (· · ·) as real
  character dividers, not borders.
- **ASCII meter** — `.cr-ascii-bar` with `--v` (0..1) renders a genuine block-glyph
  progress bar (▰ fill over ▱ track), keyed to `--sig-work`.
- **ASCII spinner** — `.cr-ascii-spin` cycles braille frames; honors reduced motion.
- **Empty / loading backdrop** — `.cr-empty` lays a masked braille density tile behind
  the content (themed to `--muted`, follows `--decoration-intensity`); CrEmptyState now
  uses it. The braille field is the default texture for zero-data and loading states.

Demoed in the gallery's decoration section (four themes). a11y + responsive pass;
visual baselines refreshed for the new section.
