---
"@control-room/design-system": minor
---

Palette + breach retune from review feedback (too black / too cream / not enough
neon; breach not striking):

- **Dark grounds lifted** — regenerated in OKLCH as a deep-violet charcoal (more
  lightness *and* chroma), so the default theme reads as a rich surface, not a
  void. Extreme deepened to match.
- **Light paper cooled** — the warm cream is gone; grounds regenerate as a cool
  violet-grey (`h ≈ 285`) that sits with the neon signals. (Light `--sig-accent`
  nudged darker to hold AA on the near-white panel.)
- **Neon/acid pairings** — the breach is now the house **magenta → acid** pair
  made literal; new `.cr-btn--accent2` (acid) action; the composed scene shows an
  accent + accent-2 button pair.
- **Striking breach** — `.cr-breach` rebuilt: a rounded **neon gradient rim**
  (padding-box/border-box) + a **dual-hue glow halo**, keyed magenta→acid, with a
  legible dark interior (the earlier flood washed out text — and axe couldn't see
  it, since it reads `background-color`). `--wash` is now a subtle tint.

`build/build-palette.mjs` now emits grounds / signals / accent independently per
theme. a11y passes all four themes; visual baselines refreshed.
