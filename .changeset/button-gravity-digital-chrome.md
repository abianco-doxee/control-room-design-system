---
"@control-room/design-system": minor
---

Button emphasis (gravity) + a digital/terminal chrome.

- **Button hierarchy.** CrButton gains an `emphasis` axis — `solid` (primary,
  filled + hard shadow) · `outline` (secondary) · `ghost` (inline/tertiary) ·
  `link` (text) — so weight is carried by FORM, not only colour. `signal` stays the
  independent colour key (work/wait/done/err/accent/accent2): a destructive secondary
  is `emphasis="outline" signal="err"`. Legacy `kind` (primary/controls/work/accent/
  err) still works, mapped to the new axes. For outline/ghost/link the text is shifted
  toward the theme ink so a signal colour stays AA on any surface while the pure signal
  reads on the border/hover.
- **Chrome is digital now.** The seeded chrome strip was physical (brushed metal, screws,
  bolts, vents). Rebuilt it as a terminal/NERV-style HUD readout: faint grid, ruler
  ticks, corner brackets, an amber hazard block, a cyan equalizer, a `0x…//SYS` hex
  readout, a reticle, and glowing indicator LEDs.

verify + verify:types + a11y (gallery + showcase, four themes) + responsive pass;
visual baselines refreshed for the new chrome.
