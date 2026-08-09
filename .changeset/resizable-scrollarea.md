---
"@control-room/design-system": minor
---

Two more layout components, continuing the standard-kit fill.

- **Resizable** — two panes with a draggable divider. Panes are passed as
  children (a CSS grid sizes the leading pane to the split; the handle is overlaid
  at the split line, so no markup is injected between your panes). The handle is a
  WAI-ARIA window **splitter**: `role="separator"`, focusable, with
  `aria-orientation` + `aria-valuenow`/`min`/`max`; ←/→ (or ↑/↓ when vertical)
  resize by 2%, Home/End jump to the clamps. Dragging uses **pointer capture** —
  no global listeners, and it can't get stuck. `orientation` horizontal/vertical.
- **ScrollArea** — a container with cross-browser styled scrollbars (thin, inked,
  neon thumb) that keep the Control Room look. Keyboard-scrollable (`tabindex=0`),
  and a named `role="group"` when given a `label`. `axis` y/x/both, `maxHeight`
  caps the scroll axis.

Both are one Mitosis source → all six targets (Resizable renders its panes through
a real per-target slot), cataloged + documented in components.md, demoed as live
islands, and covered by islands e2e (resizable separator value + keyboard resize;
scroll-area labelled region that overflows). Gates green: six-target build,
verify:types, islands (30), a11y (axe), visual, catalog, package, frameworks.

Remaining deferred kit: Calendar / range-calendar, Carousel.
