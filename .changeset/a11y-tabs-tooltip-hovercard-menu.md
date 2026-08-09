---
"@control-room/design-system": minor
---

A11y: close four behavioral gaps surfaced by comparing against Ark UI-based
libraries (patterns axe can't catch and our static gate missed).

- **Tabs** now expose the WAI-ARIA tab↔panel relationship. Pass `id` and each tab
  gets `id="{id}-tab-{i}"` + `aria-controls="{id}-panel-{i}"`; render each panel as
  the matching `role="tabpanel"` with `aria-labelledby` back to its tab (focusable,
  only the active one shown). The prop doc spells out the panel contract, and the
  component browser's Tabs demo is wired this way.
- **Tooltip** and **Hover card** are now dismissable per **WCAG 1.4.13** (Content
  on Hover or Focus): `Esc` hides the content **without moving focus**, and leaving
  or re-entering hover/focus resets it. Implemented as a tiny CSS-outranking
  dismiss latch — the reveal stays pure CSS otherwise.
- **Menu** gains **typeahead** — printable keys focus the next item whose label
  matches (keys within ~600ms accumulate), alongside the existing arrow / Home /
  End / Esc navigation.

Tests: islands e2e asserts the tab↔panel wiring, Escape-dismiss for tooltip and
hover card (focus not moved, latch resets), and menu typeahead. Docs:
accessibility.md "Focus management & keyboard". All six targets build; verify:types,
a11y (axe), visual, and package gates green.
