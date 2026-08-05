---
"@control-room/design-system": major
---

Prune the deprecated back-compat props; retune the chrome to neo-brutalist cyberpunk.

**Breaking — legacy props/classes removed** (there is now one canonical way):

- `CrButton.kind` → use `emphasis` (solid·outline·ghost·link) + `signal`.
- `CrTag.tone` / `CrStatusDot.state` / `CrSessionRow.state` / `CrMeter.tone` /
  `CrProgress.tone` → all use `signal` (work·wait·done·err·idle·accent).
- CSS: dropped `.cr-btn--{controls,work,accent,accent2,err}` and the
  `.cr-tag--{now,later,no}` aliases. Use `.cr-btn--{outline,ghost,link}` +
  `.cr-btn--sig-*`, and the canonical `.cr-tag--*` signal words.

All consumers (gallery, component browser, `examples/console`, catalog) migrated.

**Chrome** — the seeded decorative strip is now blocky neo-brutalist cyberpunk (hard
neon frame, chunky corner brackets, a stamped ID slab, a hazard block, chunky bars,
segmented register cells, an RGB-split glitch block, big blocky LEDs) rather than the
delicate NERV-style HUD (reticle / ruler ticks / fine grid removed).

verify, verify:types, a11y (gallery + showcase), responsive pass; visual baselines
refreshed.
