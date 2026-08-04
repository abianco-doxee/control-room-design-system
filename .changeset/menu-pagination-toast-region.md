---
"@control-room/design-system": minor
---

Overlay + navigation essentials: menu, pagination, and a toast region.

- **New `CrMenu`** — a dropdown of actions. The trigger toggles a `role=menu`
  panel; a transparent full-viewport scrim closes it on outside click (no global
  listeners, so every framework target behaves identically). Optional `danger`
  items and left/right alignment.
- **New `CrPagination`** — a controlled pager: prev/next plus a windowed run of
  page numbers with ellipses; current page keyed and `aria-current`, prev/next
  disabled at the bounds.
- **New `CrToastRegion`** — a fixed screen corner that stacks live toasts (parent
  owns the list); each toast stays its own live region so nothing double-announces,
  and bottom corners stack newest nearest the edge.
- All three are demoed in the gallery (all four themes) and composed into the
  `examples/console/` Qwik app — verified toggling, paging, and dismissing end to
  end.
