# Component Ship Checklist

A component is done when it passes every gate below in **all four themes**
(dark / light / extreme / phosphor). If any box fails, it is not Control Room.

## Tokens & chassis

- [ ] Every color, border width, shadow, and font comes from a token — **no raw
      hex, px border, or hardcoded font** that a token already names.
- [ ] All corners square (`--radius` / `0`). No `border-radius` anywhere —
      *unless* this is the one Law 9 breach (`.cr-breach`).
- [ ] Shadows are the hard offset idiom only — `offset offset 0 color`, never
      blurred, never soft, never inset-glow — *unless* it is the Law 9 breach glow.
- [ ] No gradient on any content surface — *unless* it is the Law 9 breach wash.
- [ ] Survives a theme flip with **zero per-theme overrides**.

## Design language (the nine laws)

- [ ] **L1** — surfaces use two tones + hard boundary; correct border-weight
      hierarchy (`--brd` / `--brd-heavy` / `--brd-brush`); no mid-tone.
- [ ] **L2** — every non-neutral color asserts real state or action; no
      decorative flood; one key per region.
- [ ] **L3** — glitch (if any) is proportional to severity, on error/masthead
      surfaces only, never on data/numerals/<18px, never ambient.
- [ ] **L4** — every diagonal encodes direction / state / focus / sequence; ≤15°
      off-axis; no decorative triangles.
- [ ] **L5** — text is display or data register only; no 18–24px sans body.
- [ ] **L6** — texture (halftone/scanline/grain) lives inside a bezel only; no
      nested bezels.
- [ ] **L7** — calm at rest, event-driven eruption, always settles.
- [ ] **L8** — every string is machine voice: present tense, datum first, one
      line, no apology/cheer/emoji, never first-person.
- [ ] **L9** — at most **one** breach per screen (or none); it is keyed to a
      signal, sits on the exceptional (never data/chrome), and everything else
      stays hard-edged.

## Signatures (the tells)

- [ ] Carries the identity marks that apply: the one hard offset shadow, square
      corners, color-as-state, two registers — and where relevant geometric-glyph
      icons (no icon font), `.cr-mark` registration ticks on a primary readout,
      drip/arrow-rail with their fixed meanings. See `design-language.md#signatures`.

## Motion

- [ ] Interaction feedback is tier-0 (`<200ms`), including snap-press where
      pressable.
- [ ] Ambient motion (if any) rides the shared ticker and is low.
- [ ] `prefers-reduced-motion: reduce` leaves the component fully legible.

## Accessibility

- [ ] Text and UI boundaries meet WCAG 2.1 AA contrast in every theme.
- [ ] Signal color always has a non-color backup (label / shape / aria).
- [ ] Focus is visible; keyboard operation works; native elements preferred.
- [ ] Decorative glitch/canvas is `aria-hidden`; the clean string is the
      accessible name.

## Documentation

- [ ] Has a spec following `templates/component.md`.
- [ ] Copy-ready markup uses only tokens and is confirmed rendering in all themes.
- [ ] Variants/props are enumerated and named consistently with the ramp.
