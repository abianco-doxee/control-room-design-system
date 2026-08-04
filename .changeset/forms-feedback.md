---
"@control-room/design-system": minor
---

Forms & feedback components (the shadcn/PrimeVue gaps for an operator dashboard):

- **CrRadioGroup** — single-choice group (`role=radiogroup`) with roving tabindex
  and `↑`/`↓`/`←`/`→` selection; square radios (radius 0, filled inner square).
- **CrSlider** — a styled native range input, so keyboard + AT support come free.
- **CrProgress** — task progress (`role=progressbar`): determinate fill or an
  indeterminate hazard sweep; distinct from Meter (a static capacity reading).
- **CrAlert** — inline callout keyed to a signal (info/wait/done/err) with a left
  brush-bar; `err` announces assertively; optional dismiss.
- **`.cr-skeleton`** — a blocky loading pulse (line/text/block), frozen under
  reduced-motion.
- **`.cr-dl`** — a key→value data/description list for detail panels.

All demoed in the gallery (four themes), cataloged, documented (with a
keyboard-nav table update), and composed into `examples/console`. Verified end to
end: radio arrow-select, slider keyboard, alert dismiss, both progress modes.
