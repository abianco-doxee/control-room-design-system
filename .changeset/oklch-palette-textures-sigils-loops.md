---
"@control-room/design-system": minor
---

Characterize the system (2026 refresh, batch): a bolder, more distinctive look
grounded in current trends.

- **OKLCH palette** (`build/build-palette.mjs`, culori): grounds become chromatic
  near-black (violet-biased), signals are regenerated vibrant at consistent
  perceived lightness/chroma, and each fill's on-colour is auto-picked by WCAG
  contrast. Dark + extreme fully regenerated; light + phosphor keep character.
- **`--sig-accent-2`** — a second action key (acid / violet / aqua-green per
  theme) with `--on-accent-2`, wired through tokens, Tailwind, and DTCG.
- **Texture tokens + utilities** — `--dither`, `--scanline` (+ existing halftone)
  with `.cr-tex--halftone/-dither/-scan/-glass` for neo-print / CRT grain on
  hardware surfaces only (Law 6).
- **Seeded cyber-sigil** — `CrSigil` (all 5 targets), a retro-futuristic
  identity-from-seed pixel glyph (cyber-sigilism), state-keyed; catalog + docs.
- **Ambient loops** — `.cr-anim-scan/-pulse/-drift/-flick`, low/slow, hardware-
  bound, reduced-motion-off (Law 7 ambient floor).
- **`cn()` helper** (`@control-room/design-system/cn`, clsx + tailwind-merge) for
  composing/de-conflicting classes with Tailwind utilities.

Docs: design-language (chromatic black, second key, +2 tells), tokens (OKLCH +
textures), motion (loops), new seeded-sigil reference. All four themes pass the
a11y gate.
