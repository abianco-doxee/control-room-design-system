---
"@control-room/design-system": minor
---

Consolidations from the critic review (capability-preserving — nothing lost):

- **`.cr-mark` is now a preset of `.cr-trim`.** The two corner-bracket primitives
  shared an implementation; `.cr-trim` gains a `--cr-trim-off` offset var and
  `.cr-mark` is the ink-weight registration preset that reuses the same rules.
- **Shipped the specced-but-missing diagonal primitives** `.cr-chev` (direction),
  `.cr-notch` (state), and `.cr-wedge` (active-panel focus) — the catalog already
  listed all four (with the arrow-rail); now the CSS exists and there is a live
  gallery demo across all four themes.
- **Canonical tag tone vocabulary.** `.cr-tag--done/--work/--wait/--err/--idle/
  --accent` match the signal ramp (the same words a StatusDot/Toast asserts). The
  older tell-time aliases (`--now/--later/--no`) are retained.
- **Wired the `--dur-press` motion token** into the switch and tooltip transitions
  (it was defined but unreferenced).
- **Cataloged the orphan decoration utilities** (`cr-scrollbar`, `cr-ruler`,
  `cr-bg--field`, `cr-stripe`, `cr-blob`, `cr-trim`, `cr-mark`) under a new
  `decoration-utilities` catalog entry.
