---
"@control-room/design-system": minor
---

Branding: signal voice (`$signalTone`) — re-tone the state ramp without breaking
its meaning. The signal roles are a state channel (`--sig-err` *means* failing), so
a brand can't freely recolour them — but it can change how loud they read.
`$signalTone` re-voices the inherited/derived signal ramp in OKLCH by scaling
chroma (and, for pastel, lifting lightness) while holding hue: `"neon"` (default),
`"muted"` (calm ops voice), `"pastel"` (soft/light). Explicitly-set signals are
never toned; toning runs before on-colour derivation so on-colours match the
re-voiced fills.

New brand **`brands/harbor.json`** — a calm cool-dark theme: surfaces from `$ramp`,
the neon ramp re-voiced to `muted` (cyan stays cyan, red stays red — just calmer),
accent + ink set, on-colours derived. The component browser auto-discovers it
(**harbor ▸**, now alongside slate/porcelain/ember).

Generator in `build/signals.mjs`; docs in theming.md "Signal voice". Tests cover
`toneSignals` (chroma drops, hue preserved, skip honoured) and harbor end-to-end.
All gates green.
