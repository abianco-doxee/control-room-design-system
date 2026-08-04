---
"@control-room/design-system": minor
---

Four motion/detail upgrades from review:

- **Rotating breach rim + riding spots** — the breach's neon rim now rotates
  (`@property --cr-breach-angle` → a conic gradient) with bright spots
  counter-riding the border. Speed via `--breach-spin` (9s); off under reduced
  motion.
- **Pure-CSS scroll binding** — new `.cr-scrollbar` progress rail bound to scroll
  via `animation-timeline: scroll()` (no JS); `.cr-scrollbar--local` binds to the
  nearest scroll container. Hidden under reduced motion (the global `animation:
  none` would otherwise freeze it empty).
- **Textures fill + visible** — halftone/dither/scanline/crosshatch alphas raised
  (~2–3×) and dots enlarged; the `.cr-tex--*` utilities now repeat/fill edge to
  edge.
- **Seeded chrome** — new `CrChrome` component paints a deterministic pixel-art
  metal strip (varied fasteners, seams, wear scratches, an LED). Plus new kit
  pieces: `.cr-screw`/`--x`, `.cr-bolt`, `.cr-led`(+signal), `.cr-grille`.

Docs: motion (scroll-bound + rotating rim), components (#seeded-chrome, breach
rim, expanded kit). Catalog +1 (30 components). a11y passes all four themes;
baselines refreshed.
