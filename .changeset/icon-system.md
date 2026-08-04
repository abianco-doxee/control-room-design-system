---
"@control-room/design-system": minor
---

Add CrIcon — the house operational icon set.

The system had no icon primitive (only text glyphs, canvas sigils, ASCII), which is a
gap for an operational product and the one place it would otherwise reach for emoji or
a mismatched library. Ship a bespoke set that fits the neobrutalist geometry rather
than adopting a rounded library:

- **Contract:** 24×24, single 2px stroke, `currentColor`, no fill, square caps + miter
  joins. Sizes on the space grid via `size` (default 20). Decorative by default
  (`aria-hidden`); pass `label` to expose it as a named image.
- **24 operational glyphs:** play, pause, stop, retry, deploy, scan, search, alert,
  error, done, clock, cpu, logs, filter, sliders, close, chevron, plus, minus, trash,
  external, copy, session, menu. Add one = one single-`d` path in the map.
- Cataloged (media), documented (components.md#icon), and exercised in the component
  browser as a playground (name/size/label) plus a live grid of the whole set.

Compiles clean to React/Vue/Qwik (the path map lives in a store getter so codegen keeps
it), type-check + a11y + responsive + islands gates pass.
