---
"@control-room/design-system": minor
---

Branding: auto-derived on-colours + a second worked brand.

A brand author rarely needs to hand-pick the text colour that sits on each fill.
The theme core now derives them: `autoOnColor(fill)` picks the more legible ink
(near-black vs near-white by WCAG contrast), and `deriveOnColors(vars, { changed })`
fills every `--on-*` a brand omits **and re-derives** any it inherited from an
`$extends` base when the brand recoloured the fill underneath — so an inherited
`--on-accent` can't go stale after `--sig-accent` changes. Hand-set on-colours are
always preserved. `defineTheme` and `build:theme` run this automatically
(`defineTheme(..., { deriveOnColors: false })` opts out).

New brand **`brands/porcelain.json`** — a light corporate re-skin on the **light**
base that declares only surfaces + the signal ramp and lets the build derive all
five on-colours; it proves both bases (`dark` via slate, `light` via porcelain) and
the derivation path end to end. The component browser's theme switch now picks up
every `brands/*.json` automatically (**slate ▸**, **porcelain ▸**).

Docs: theming.md "Auto-derived on-colours". Tests: `autoOnColor`, `deriveOnColors`
(fill / re-derive / preserve), and porcelain validates + every derived on-colour
clears AA-large against its fill. All gates green.
