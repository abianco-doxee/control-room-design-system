---
"@control-room/design-system": minor
---

New component: **`CrDataGrid`** — a dense, **virtualized** data grid, the deep data
component the dashboard vertical was missing. Only the rows in (or near) the
viewport are in the DOM (fixed row height; a sizer preserves scroll height and the
window is offset with `translateY`), so thousands of rows scroll smoothly.

- **Sortable** headers (asc → desc → none, stable, non-mutating) with `onSortChange`.
- **Selectable** — checkbox column + select-all + `onSelectionChange`, keyed by `rowKey`.
- **Sticky header**; grid a11y (`role=grid`/`row`/`columnheader`/`gridcell`,
  `aria-sort`, `aria-rowcount`, `aria-selected`). Div-grid (not `<table>`) so the
  virtualization offset composes across all six targets. Full arrow-key cell
  navigation is a documented follow-up.

Ships across the toolchain: compiles cleanly (verify:types), SSR-renders under
Vue/Svelte/Solid (framework gate), and a new islands e2e drives a **2,000-row**
demo — asserting the DOM holds only a small window, that sorting/scrolling shift it,
and that select-all reports the full count. Registry + `components.md#data-grid`
added; gallery visual baseline refreshed. Fixes another Mitosis/React stale-read
(selection callback read state right after setting it) by passing the next map
explicitly. All gates green.
