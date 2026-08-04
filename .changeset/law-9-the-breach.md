---
"@control-room/design-system": minor
---

Add **Law 9 — The Breach**: the one sanctioned rule-break per screen. A system of
hard laws earns a single licensed transgression, and the transgression is what
makes the rigor felt.

- `.cr-breach` licenses the forbidden vocabulary on ONE element — a soft corner
  (`--breach-radius`), a colour glow, a blurred blob (`::before`), an optional
  `--wash` gradient, and an `--alive` breathing glow (off under reduced motion) —
  keyed to a signal (default accent). `.cr-blob` is a standalone soft accent.
- `CrBreach` component (all 5 targets, class-only — no inline style).
- New `--breach-radius/-blur/-glow-size` chassis tokens: the only place radius,
  blur, and a soft glow are licensed, kept explicit and greppable.
- Docs: Law 9 in design-language (+ "one breach per screen" rule, applying-the-laws
  step 9), components #breach, tokens, and the ship checklist now note the single
  exception on the square/shadow/gradient rules. "Eight laws" → "nine laws"
  throughout. Catalog +1 (29 components). a11y passes all four themes.
