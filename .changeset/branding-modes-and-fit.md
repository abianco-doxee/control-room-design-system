---
"@control-room/design-system": minor
---

Branding: dark+light pairing (`$modes`) and contrast-fitting signals (`$fitSignals`).

**`$modes`** lets one brand file emit several themes — most usefully a dark + light
pair. Shared identity stays at the top level; each mode adds only its deltas. The
first mode is primary (`dist/themes/<name>.css`), the rest are `<name>-<mode>.css`
(select with `data-theme="<name>-<mode>"`).

**`$fitSignals`** (`true` or a target ratio) nudges each signal's OKLCH lightness
(hue + chroma held) until it clears a minimum contrast against `--panel` — the fix
for reusing a dark-tuned neon ramp on light surfaces. It only touches signals that
fall short and never a hand-set one; runs after toning, before on-colour derivation.

New brand **`brands/aurora.json`** — one definition, both modes: the same
indigo/cyan brand in dark and light, the light mode (`aurora-light`) auto-darkening
the shared neon signals to stay legible on its near-white surfaces. Full pipeline is
now `$extends` < `$ramp` surfaces < toned (`$signalTone`) / fitted (`$fitSignals`)
signals < explicit roles, then auto on-colours.

Generators in `build/signals.mjs` (fit) and `build/build-theme.mjs` (modes). Docs:
theming.md "Fit signals" + "One brand, many modes". Tests cover `fitSignals` and the
aurora pair. All gates green.
