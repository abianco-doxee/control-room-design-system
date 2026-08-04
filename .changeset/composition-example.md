---
"@control-room/design-system": minor
---

Add a full **composition example** so the combined vocabulary is reviewable as
both pixels and code:

- The gallery leads with a **composed operator's screen** — condensed masthead +
  registration ticks, keyed hero, severity shapes beside colour, seeded sigils per
  session, arrow-rail, a texture + scanline bezel, chrome (plate/tally), keyed
  tiles, and exactly one Law-9 breach — inside `.demogrid` so it's contrast-gated
  in every theme.
- `references/components.md` — the thin "instrument" example is replaced with the
  identical copy-ready `cr-` markup for that screen, plus the minimal layout glue.
- Fix: `.cr-tally` now uses `--ink` (was `--sig-done`, which failed AA on the light
  paper ground).

All four themes pass the a11y gate; visual baselines refreshed.
