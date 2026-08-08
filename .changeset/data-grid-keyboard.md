---
"@control-room/design-system": minor
---

`CrDataGrid`: full keyboard navigation (closing the documented follow-up). The grid
is a single tab stop and implements the WAI-ARIA **active-descendant** grid pattern
— Arrow keys, Home/End, and PageUp/PageDown move an active cell tracked in state and
surfaced via `aria-activedescendant`, ringed with `.cr-grid__cell--active`. Because
navigation is coordinate-based (not per-cell `focus()`), it survives virtualization:
moving to a row that was windowed out scrolls it into view first. Header sort buttons
and row checkboxes remain natively Tab-focusable.

New islands e2e drives the keys (active cell moves, gets the ring, and PageDown pages
past the first window with the target scrolled into the rendered set). Docs updated.
All gates green.
