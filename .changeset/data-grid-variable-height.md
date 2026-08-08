---
"@control-room/design-system": minor
---

CrDataGrid now supports variable-height rows. `rowHeight` accepts either a
fixed `number` (the fast O(1) virtualization path) or a `(row, index) => number`
function. In variable mode, row offsets come from a prefix-sum and the visible
window is located with a binary search, so the grid stays virtualized —
thousands of differently-sized rows render only the on-screen slice. Keyboard
navigation and `scrollRowIntoView` are height-aware in both modes.
