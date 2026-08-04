---
"@control-room/design-system": minor
---

Disclosure & overlay components (the shadcn/PrimeVue trio):

- **CrAccordion** — collapsible sections; header buttons (`aria-expanded` +
  `aria-controls`) reveal `role=region` panels. `single` makes it exclusive;
  `↑`/`↓`/`Home`/`End` move between headers. Only the chevron animates (frozen
  under reduced-motion).
- **CrPopover** — a generic anchored overlay for arbitrary content: a trigger
  toggles a floating panel, a transparent scrim closes it on outside click, `Esc`
  closes and returns focus to the trigger (no global listeners). Use Menu for a
  list of actions.
- **CrDrawer** — an edge sheet on the native `<dialog>` (focus-trap + `Esc` +
  backdrop); slides from left or right, full height, for detail/inspector panels.

All three demoed in the gallery (four themes), cataloged, documented (+ keyboard-nav
table rows), and composed into `examples/console` — the breach panel's "inspect ▸"
opens a right drawer containing a data list and a single-open accordion, and the
masthead gains a "filters ▾" popover. Verified open/close/focus/keyboard end to end.
