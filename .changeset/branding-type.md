---
"@control-room/design-system": minor
---

Branding: type — fonts & display character (the last non-colour identity axis).

A brand can now set its **font families** with `$fonts` (`{ display, sans, mono }`
→ `--font-display` / `--font-sans` / `--font-mono`) and tune the display/label
**character** by setting the type tokens directly: `--type-display-weight` /
`-tracking` / `-leading` / `-transform`, `--type-label-tracking` / `-transform`.
Base type sizes stay in the structure layer (they carry density/layout, not brand).
`TYPE_OVERRIDABLE` and the theme-contract's new `typeOverridable` list make these
known to `validateTheme`; `themeCss` emits them in the theme block.

`brands/boardroom.json` gains a soft, mixed-case corporate voice (a system sans
display, `type-display-transform: none`) to demonstrate. The brand **preview** now
shows a per-theme **type specimen** (`Aa` + a data line) so font/character branding
is visible at a glance. A brand supplying a custom family must load that font
itself — the value is just a CSS font stack (keep a fallback).

Generator in `build/type.mjs`; docs in theming.md "Type". Theme tests cover
`typeFrom`, type-token validation, and boardroom's type. This completes the branding
system — every non-colour axis (surfaces, chassis, signals, type, modes) is now
brandable, contract-validated, contrast-checked, previewable, and separation-guarded.
All gates green (visual unchanged — defaults untouched).
