# Decoration — ASCII / pixel art in dead space

Control Room fills its **empty and background space** with seeded ASCII/Unicode and
pixel decoration — density fields, telemetry trim, drafting grids — so a screen
reads as a live instrument even where there's no data. It is **atmosphere, never
content**: it lives in dead space, sits at whisper contrast, and is masked away
from text so it can never reduce readability.

Grounded in the terminal / FUI lineage (the Evangelion-NERV telemetry look) and
the Unicode art vocabulary — **block elements** (`░▒▓█`, a uniform shade ramp) and
**Braille patterns** (2×4 dots per cell, the highest-resolution text "pixels").

## The contract (every decoration obeys this)

- **MUST** be purely decorative: `aria-hidden="true"`, `pointer-events: none`,
  `user-select: none`, never focusable. Real numbers use real components — a
  telemetry string is *flavour*, not a readout.
- **MUST** live in **dead space** (an empty panel region, the background, the
  unused half of a masthead) — never behind running text unless it is masked away
  from it.
- **MUST** stay **whisper contrast** and **mask-fade** toward any nearby content
  (`.cr-ascii--mask-l/-r/-edge`), so the text always sits on clean ground. The
  content must sit above (`position: relative; z-index: 1`).
- **MUST** be **seeded** where generative (same seed → same art), like the cat and
  sigil, so a surface has a stable identity.
- **MUST** honour reduced motion for anything animated (the fields are static).

## The pieces

### Density field — `CrAscii`

A seeded canvas grid of glyphs whose density follows value-noise. Three glyph
sets: `braille` (finest), `block` (`░▒▓█`), `ramp` (`.:-=+*#%@`).

```html
<div class="cr-ascii cr-ascii--mask-l" aria-hidden="true">
  <canvas><!-- CrAscii paints here --></canvas>
</div>
```
```tsx
import { CrAscii } from "@alebianco/cr-components/react";
<div class="cr-ascii cr-ascii--mask-l" aria-hidden="true">
  <CrAscii seed="nova-01" variant="braille" />
</div>
```

Put it in a `position: relative` host (masthead, hero, empty panel); the mask
modifier fades it off the content edge (`-l` toward left-aligned text, `-r`,
`-edge` for a vignette).

### Telemetry trim & string

- `.cr-trim` — two corner brackets; `.cr-trim--4` — all four. Frame trim on any
  surface (structure, not signal; `--cr-trim-c` re-colours).
- `.cr-ruler` — a fine FUI tick-ruler edge (short ticks every 8px, tall every 40).
- `CrTelemetry` / `.cr-telemetry` — a seeded NERV-style string
  (`SEED 2E7A · 0x4F · CH12 ▮▮▮▯▯`) for a frame corner. **Decoration, not data.**
  Every field is unitless on purpose: a `ms`-suffixed number would read as a real
  latency measurement, which is exactly what this component must not be taken for.

```tsx
import { CrTelemetry } from "@alebianco/cr-components/react";
<CrTelemetry seed="cr-1130" />
```

### Background drafting field — `.cr-bg--field`

A whisper block-shade grid (`--field` token) for large dead background regions —
an extension of the texture family, for behind panels rather than on hardware.

### Panel edge bleed — `.cr-panel__bleed`

A masked texture on a panel's margin, fading to full transparency before it
reaches the content area. Law 6 sanctions this as the one way a panel — a flat
content field — may carry grain, and caps it at **one bled panel per screen**.

Pure CSS on purpose: it consumes the per-theme `--halftone` / `--dither` /
`--scanline` tokens, so it survives a theme flip with no per-theme code, follows
`--decoration-intensity`, and costs no script. The `105deg` mask stop *is* the
contract — texture that touches a readout is not a bleed.

```html
<i class="cr-panel__bleed" data-bleed="halftone" aria-hidden="true"></i>
```

### Seeded dither field — `CrDither`

A real Bayer 4×4 ordered dither, or variable-density halftone dots, painted from
a seed — the genuine article the CSS texture tokens only approximate. Same
engine as `CrSigil`: FNV hash → mulberry32, hues read from the live token
values, so it re-keys on a theme flip.

**Hardware only.** A hero, a masthead, a bezel — never a flat content field, and
never as the default way a panel gets grain. `.cr-panel__bleed` is the panel
path and stays script-free, matching the `CrDrip` precedent that the house
glitch must render identically without JS.

```tsx
import { CrDither } from "@alebianco/cr-components/react";
<CrDither seed="cr-1130" mode="bayer" state="working" />
```

### Empty states

Replace a blank "no data" region with an aria-hidden `CrAscii` field behind a
mono label:

```html
<div style="position:relative" >
  <div class="cr-ascii cr-ascii--mask-edge" aria-hidden="true"><canvas><!-- CrAscii --></canvas></div>
  <span style="position:relative;z-index:1">░ NO SIGNAL ░</span>
</div>
```

## Rules

- **NEVER** put decoration behind live data, a table, or a dense list — dead space
  only, or masked fully clear of the text.
- **NEVER** let a decoration raise to normal contrast; if you can read it as text,
  it's too strong. It is texture.
- **NEVER** encode meaning in it — the telemetry numbers are seeded flavour; a
  screen reader hears none of it, and that is correct.
- **SHOULD** reuse one seed per surface/entity so the atmosphere is stable, not
  noisy on every render.
