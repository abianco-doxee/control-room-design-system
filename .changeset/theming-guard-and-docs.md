---
"@control-room/design-system": minor
---

Theming: lock the feature ⇄ appearance separation and document it end to end.

- **Appearance-separation guard** (`test:separation`, wired into CI): fails the
  build if a raw brand colour (hex other than physical black/white, or any
  `rgb()/hsl()/oklch()…` literal) appears in the feature layer — `components.css`
  or a component source. The only sanctioned palette-bearers are the four
  generative-`<canvas>` components (`CrSigil`/`CrCat`/`CrChrome`/`CrAscii`), which
  read the theme at runtime via `getComputedStyle` and keep a hex only as a
  fallback; that set is pinned, so a new component can't quietly hardcode a colour.
- **`references/theming.md`** — the branding guide: the two-layer split, the theme
  contract, authoring a brand (`brands/*.json` + the `@control-room/design-system/theme`
  API), contrast, per-component overrides, and the honest generative-art note.
  Linked from SKILL.md.
- **Showcase** gains a **slate ▸** switch that loads the external brand
  (`brands/slate.json` → `dist/themes/slate.css`) and reskins the whole component
  browser from that one appearance file. New islands e2e asserts the reskin (roles
  flip to slate's values; the live React islands stay mounted, just re-themed).

All gates green (separation + theme + forms + islands + a11y + full `verify`).
