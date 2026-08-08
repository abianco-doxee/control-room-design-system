---
"@control-room/design-system": minor
---

Overlays: collision-aware positioning (a Floating-UI-lite, no dependency). New
`@control-room/design-system/position` — `computePosition` (pure geometry: anchor +
floating + viewport → coords, with **flip** to the opposite side when there's no
room and **shift** along the cross axis to stay on-screen), plus `place` /
`autoPlace` (DOM helpers; autoPlace keeps a panel pinned on scroll/resize). Fully
unit-tested (`test:position`, 7 cases).

`CrPopover` now uses it: on open the panel anchors to the trigger, flips above when
needed, and shifts to never clip off the viewport, tagging `data-placement`. A new
islands e2e opens the popover and asserts fixed positioning + in-viewport bounds.

Also fixes a latent Mitosis/React stale-read bug in `CrPopover.toggle()` (it read
`state.open` right after setting it, so `focusPanel` — focus-move-into-panel on open
— only fired on close); computing the next value once restores focus-on-open across
targets. Docs: components.md "Popover · Positioning". All gates green.
