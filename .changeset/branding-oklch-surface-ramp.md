---
"@control-room/design-system": minor
---

Branding: OKLCH surface ramp — derive the whole surface ladder from one tone.

A brand can now give `$ramp` (a single base surface tone) and the build derives
`--ground` / `--board` / `--panel` / `--panel-2` / `--rail` by walking **OKLCH
lightness** (perceptually even), keeping the tone's hue and a whisper of its chroma
so the surfaces read as one tinted material at different depths. Direction follows
`$scheme` (dark: ground deepest, panels lift; light: ground bright, panel
near-white); `--rail` stays a deep tone. Precedence is `$extends` base < `$ramp`
surfaces < explicit role overrides, so any surface can still be set by hand.

New brand **`brands/ember.json`** — a warm-dark theme authored from essentially a
base tone plus an accent (surfaces from `$ramp`, signals inherited from `dark`,
on-colours auto-derived). Combined with auto on-colours, a coherent brand is now
"one tone + one accent." The generator lives in `build/ramp.mjs` (build-time; uses
culori/OKLCH). The component browser auto-discovers it (**ember ▸** alongside slate
and porcelain).

Docs: theming.md "Surface ramp from one tone". Tests: `surfaceRamp` ordering
(dark + light) and ember end-to-end (ramp surfaces applied, complete + legible).
All gates green.
