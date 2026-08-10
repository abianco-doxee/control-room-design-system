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
import { CrAscii } from "@alebianco/cr-design-system/react";
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
  (`SEED 2E7A · 0x4F · 12ms ▮▮▮▯▯`) for a frame corner. **Decoration, not data.**

```tsx
import { CrTelemetry } from "@alebianco/cr-design-system/react";
<CrTelemetry seed="cr-1130" />
```

### Background drafting field — `.cr-bg--field`

A whisper block-shade grid (`--field` token) for large dead background regions —
an extension of the texture family, for behind panels rather than on hardware.

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
