---
"@control-room/design-system": minor
---

Tracks 4 + 5 and two new distinctive systems.

- **Condensed display register** (track 4): new `--font-display` (Saira Condensed
  900, Archivo Narrow / Oswald fallbacks). The display register (masthead, hero,
  drip, modal titles) is now a tight condensed grotesque — reads as instrument
  stencil, not a rounded brand headline. Inlined in the gallery, imported on the
  docs site. Law 5 updated.
- **Shape-as-severity scale** (new, Law 4): a polygon's side-count encodes
  danger/focus *inversely* — triangle (crit) → diamond (warn) → pentagon (work)
  → hexagon (ok) → circle (idle). A second channel beside colour that survives
  the monochrome phosphor theme and colour-blindness — the built-in non-colour
  backup. Shipped as `.cr-sev--*` and the `CrShape` component (all 5 targets).
- **Expanded hardware chrome** (track 5): `.cr-rivet`/`--hex`/`--slot`, `.cr-vent`,
  `.cr-port`, `.cr-stripe`, `.cr-seam`, `.cr-plate`, `.cr-tally` — richer bezel
  detail (Law 6).
- **Richer texture** (beyond dots): `.cr-tex--cross` (±45° crosshatch) and
  `.cr-tex--duo` (two-signal duotone dither, "cross-colours"), plus `--crosshatch`
  token; ASCII/symbol dithering documented via the canvas engine.

Docs: design-language (Law 4 severity scale + expanded diagonals, Law 5 condensed
display), components (severity shapes, hardware chrome, richer textures), tokens
(`--font-display`, `--crosshatch`), accessibility (shape as non-colour backup),
frameworks (+Shape), catalog +1. a11y passes all four themes.
