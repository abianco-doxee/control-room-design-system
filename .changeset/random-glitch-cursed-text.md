---
"@control-room/design-system": minor
---

More glitch, used randomly — plus the long-documented cursed text, finally implemented.

- **Random glitch driver** — a governed ambient driver in the shared browser
  script fires brief bursts on **opt-in** `.cr-glitch-auto` elements, **one at a
  time**, ~0.2–0.5s each, every ~2.4–5s. Never glitches the whole screen; off
  under `prefers-reduced-motion` and the `calm` intensity profile.
- **`.cr-glitch--chroma`** — a faint always-on RGB fringe (fades with
  `--decoration-intensity`) so a readout feels unstable at rest; the slice
  animation still fires on hover / `--on`.
- **Cursed text (`.cr-cursed`)** — Law 3's T3 decay, implemented at last: zalgo
  combining marks capped at 2/glyph, seeded (deterministic), density scaled by
  `--decoration-intensity`. The painter moves the clean string to `aria-label`,
  stamps `role="img"`, and hides the corrupted glyphs (`aria-hidden`) — so AT
  announces the clean word and never the noise.

Gallery gains a T3-decay row (`CORRUPTED`, `CHECKSUM FAIL`, `DAEMON`) and a
chroma-fringe auto-glitch (`SIGNAL LOST`). Docs: motion.md governed-effects table
(+chroma, +auto, +cursed) and the restraint note. a11y passes all four themes
(cursed text is a labeled graphic, not prohibited-attr noise); visual baselines
refreshed; responsive + islands gates green.
