# Panel composition + the edge-bleed texture contract

**Date:** 2026-08-13
**Status:** approved design, not yet implemented
**Scope:** `CrPanel` composition, a Law 6 amendment sanctioning edge bleeds, and
a seeded canvas dither for hero surfaces.

## Motivation

A direction board rendered panels that read as instrument bays: corner ticks, a
stamped ghost numeral, a slotted header, a pinned footer, and halftone bleeding
off one corner. The shipped `.cr-panel` is twelve lines — background, border,
offset shadow, padding, plus `--major` / `--inset` and a mono title.

The gap is **composition, not vocabulary.** An audit of the existing layer found
that three of the four "missing" texture families already ship and are simply
unused by any component:

| Family | Status before this work |
| --- | --- |
| Halftone / dither / scanline | `--halftone`, `--dither`, `--scanline` tokens in all four themes; `.cr-tex--halftone/--dither/--scan/--glass` utilities |
| Registration ticks | `.cr-mark` (ink-weight preset of `.cr-trim`), named as a house *tell* in SKILL.md |
| Ambient loops | `.cr-anim-scan`, `.cr-anim-pulse`, `cr-drift`, `cr-flick` on `--dur-ambient`, reduced-motion guarded |
| Phosphor bleed / misregistration | absent — and Law 1 bans glow and gradients, so it stays absent |

So this work mostly **wires up** what exists, and adds only the parts that are
genuinely missing: the ghost numeral, the header/footer slots, and the masked
bleed that lets a panel host texture without breaking Law 6.

## Non-goals

- No phosphor glow or misregistration. Law 1 bans blur, glow and gradients on
  content surfaces; the breach (Law 9) is the only exception and is not this.
- No new texture tokens. The four themes already define all three.
- No new ambient keyframes. `.cr-anim-*` already ships.
- `CrDither` is **not** wired into `CrPanel`. Panel's bleed stays pure CSS.

## Part 1 — `CrPanel` composition

### Anatomy

```
┌─ .cr-panel ────────────────────────┐
│ EYEBROW · UNIT CR-00        ⌐ 01 ⌐ │  eyebrow (real text) + index (ghost, aria-hidden)
│ Display Heading                    │  title
│ ▏ lede / trend block               │  lede, accent left-rule
│                                    │
│ (children)                         │
│                                    │
│ LAW 6 · TEXTURE ON HARDWARE        │  footer, pinned via margin-top:auto
└────────────────────────────────────┘
```

### Parts

| Part | Class | Contract |
| --- | --- | --- |
| root | `.cr-panel` | becomes `display:flex; flex-direction:column` so the footer can pin |
| index | `.cr-panel__index` | `--font-display` 900, absolute top-right, **`aria-hidden`** |
| eyebrow | `.cr-panel__eyebrow` | own rule (there is no shared `.cr-label` preset); mono, `--text-2xs`, `letter-spacing:.12em`, uppercase |
| title | `.cr-panel__title` | existing rule, unchanged |
| lede | `.cr-panel__lede` | `border-inline-start: var(--brd) solid var(--sig-accent-2)`, `--muted` text |
| footer | `.cr-panel__footer` | `margin-top:auto`, `--text-2xs`, `--muted` |

### API

Kept: `title`, `weight`, `inset`, `children`, `unstyled`, `pt`, `dt`.
Added: `index`, `eyebrow`, `lede`, `footer`, `tone`, `marks`, `bleed`, `ambient`.

- `tone?: "work" | "wait" | "done" | "err" | "idle" | "accent"` — keys the
  eyebrow to a signal hue. Law 2: a tone asserts a real machine state.
- `marks?: boolean` — adds the existing `cr-mark` class. **No new CSS.**
- `bleed?: "halftone" | "dither" | "scan" | "glass"` — see Part 2.
- `ambient?: "scan" | "pulse"` — adds the existing `.cr-anim-*` class.

### Breaking changes (accepted)

- Root becomes a flex column. Multi-child panels that relied on block layout
  will reflow. Every visual-regression baseline containing a panel will shift.
- `pt`/`dt` part list grows from `root`·`title` to the seven parts above.

### The `.cr-mark` / bleed pseudo-element collision

`.cr-mark` already sets `position:relative` and occupies **both** `::before` and
`::after` for its corner ticks. The bleed also needs a pseudo-element. They
collide on `.cr-panel__index`'s stacking too.

**Resolution:** the bleed paints on `.cr-panel__index`'s sibling — a dedicated
`<i class="cr-panel__bleed" aria-hidden="true">` element rather than a
pseudo-element on the root. This keeps `marks` and `bleed` independently
composable, which a pseudo-element approach cannot do.

## Part 2 — Law 6 amendment: the edge bleed

### The conflict

Law 6 currently reads: **NEVER put texture on a flat content field**, and
**NEVER bezel every panel — a page of hardware is noise.** `.cr-panel` is a flat
content field, so porting the board's textured panels as-is breaks the law
across the system.

### The amendment

Two rules added to Law 6:

> - **MAY** carry an **edge bleed**: a masked texture that fades to full
>   transparency before it reaches the content area, on a panel's corner or
>   edge. The mask is the contract — texture that touches a readout is not a
>   bleed.
> - **NEVER** more than **one bled panel per screen** (mirrors Law 2's one-key
>   discipline and Law 6's existing one-instrument rule).

"No texture on a flat content field" stays literally true: the bleed lives on
the panel's margin and fades out before the readout begins.

### Mechanism

```css
.cr-panel__bleed {
  position: absolute; inset: 0; pointer-events: none;
  background-image: var(--halftone);            /* keyed by data-bleed */
  background-size: var(--halftone-size) var(--halftone-size);
  opacity: calc(0.5 * var(--decoration-intensity, 1));
  -webkit-mask-image: linear-gradient(105deg, transparent 38%, #000 100%);
          mask-image: linear-gradient(105deg, transparent 38%, #000 100%);
}
```

Correct by construction on three counts: it consumes the per-theme texture
tokens, so it survives a theme flip with zero per-theme code; it follows
`--decoration-intensity`, so the `calm` ops profile tones it down; and the
`38%` mask stop is what keeps it off the readout. The `105deg` angle is taken
from the direction board's masthead bleed.

`pointer-events:none` is mandatory — the same note `bezel.css` carries, for the
same reason: an inset overlay without it eats every click in the panel.

## Part 3 — `CrDither` (canvas, hero surfaces only)

A new component modelled directly on `CrSigil`: the same FNV `hashSeed`, the
same `mulberry32`, the same `cv()` computed-style token reads (so it stays
theme-reactive), the same `onMount` + `onUpdate` repaint keyed on its props.

It paints a genuine **Bayer 4×4 ordered dither** or a variable-density
**halftone** ramp between two token-derived colours — the real thing the CSS
gradients only approximate.

**Deliberately not wired into `CrPanel`.** `drip.css` argues at length that the
house glitch must stay static CSS — no canvas, no RNG, SSR-identical — and
records that a seeded canvas painter is the exact direction an earlier
regression drifted from. Panel's bleed therefore stays pure CSS, and `CrDither`
is a thing you reach for deliberately on a masthead or hero.

`role="img"` with an `aria-label`, matching `CrSigil`.

## Verification

- `pnpm build:styles` — `parts/panel.css` is **generated** from
  `styles/components.css`; the source block is `components.css:57-68`. Never
  edit the part file directly.
- Four-theme contrast pass on every new part.
- Part-guard / misrouted-rule check (the guard `1825abb` repaired).
- Visual-regression baselines regenerated — panel baselines *will* shift.
- Reduced-motion: `ambient` must be inert under `prefers-reduced-motion`.

### Known risk — the ghost numeral's colour

`.cr-panel__index` is specified as `--rail-ink`. `bezel.css` documents that
`--rail-ink` **inverts across themes** and lands on the casing's own luminance
in two of them (measured 1.08 in light, 1.31 in extreme — invisible). A ghost
numeral is *meant* to be near-invisible, so this may be correct as specified,
but "recessive" and "accidentally absent" are different outcomes.

**Plan:** implement with `--rail-ink`, measure in all four themes, and fall back
to `--muted` if it disappears — the same token `bezel.css` identifies as the one
sitting between casing and ink in all four themes by construction. Record the
measured values in the implementation notes.

## Files touched

| File | Change |
| --- | --- |
| `packages/styles/styles/components.css` | panel block — new parts, bleed rule |
| `packages/components/components/CrPanel.lite.tsx` | new props + parts |
| `packages/components/components/CrDither.lite.tsx` | new |
| `references/design-language.md` | Law 6 amendment |
| `references/components.md` | Panel + CrDither specs |
| `references/decoration.md` | edge-bleed contract |
| `checklists/component-checklist.md` | one-bled-panel-per-screen gate |
| showcase examples + catalog entry | demonstrate the composed panel |
