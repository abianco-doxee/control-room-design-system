# Seeded pixel-sigil

A **cyber-sigil** is Control Room's second seeded generator, alongside the pixel-cat
(`references/seeded-cat.md`). Where the cat carries warmth, the sigil carries
*identity as ornament*: a retro-futuristic pixel glyph — a mirrored spine with
radiating arms, node clusters, and downward drips — deterministically generated
from any string. Same seed, same sigil, forever.

It answers the "add some retro-futuristic / cyberpunk pixel-art" brief and the
2026 **cyber-sigilism** trend (occult/tribal pixel glyphs, single-pixel outlines,
drips) without breaking a single law: it is pixel-native, square, un-blurred, and
its colour is a machine signal (Law 2), not decoration.

## What it is for

- A **per-entity mark** — a session, an agent, a repo, a service each get a stable
  glyph from their id, so an operator learns them by shape as well as by name.
- A **section/nav sigil** — a small identity stamp on a panel or rail item.
- **Never** a load-bearing icon: it encodes identity + (optionally) state, not an
  action. Actions use geometric glyphs (the icon "tell") or a labelled control.

## The contract

Deterministic from a 32-bit FNV-1a hash of the seed → a `mulberry32` PRNG. The
PRNG drives every choice (hue, spine, arm count, drip length), so the output is
pure and reproducible — identical in the browser, in tests, and across framework
targets.

- **Grid** — 16×16, mirrored on the vertical axis (a sigil is always symmetric).
- **Hue** — if a `state` is given, the glyph keys to that signal
  (`working`→`--sig-work`, `waiting`→`--sig-wait`, `error`→`--sig-err`,
  `done`→acid `--sig-accent-2`, `idle`→`--sig-idle`); otherwise the seed picks
  one signal hue. **MUST** stay on the signal ramp — no off-palette colour.
- **Drips** — trail downward from the lowest lit cell in a column (Law 3's decay
  vocabulary, here as ornament, never on data).
- **Bleed** — a faint half-cell halftone sits behind the glyph (Law 6 texture,
  contained to the mark).

## Use it

```tsx
import { CrSigil } from "@control-room/design-system/react";
<CrSigil seed="nova-01" state="working" size={48} />
<CrSigil seed="ptl-757" />           {/* no state → seed picks the hue */}
```

The component (`components/CrSigil.lite.tsx`) paints an imperative `<canvas>` in
`onMount` — Mitosis resolves the ref per target (`canvasRef.current` in React,
`bind:this` in Svelte). It carries `role="img"` and an `aria-label` of the seed;
the canvas itself is decorative pixels.

## Rules

- **MUST** derive everything from the seed — no `Math.random`, no time, no
  per-render drift. The same id must always render the same glyph.
- **MUST** keep the hue on the signal ramp (Law 2). A sigil is identity + state,
  not a free-colour illustration.
- **MUST** give it an accessible name (the seed) and treat the pixels as
  decorative; **NEVER** encode information only in the glyph shape.
- **SHOULD** size it 24–64px. Below 24px the drips and nodes stop reading.
- **NEVER** use a sigil as the only affordance for an action — it is a mark, not a
  button.
