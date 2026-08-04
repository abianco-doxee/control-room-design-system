---
"@control-room/design-system": minor
---

Keyboard navigation + a key-hint (keycap) badge system.

- **Keyboard nav** on the interactive widgets (WAI-ARIA patterns):
  - **CrTabs** — roving tabindex: `←`/`→`/`↑`/`↓` move, `Home`/`End` jump; only the
    active tab is tabbable.
  - **CrMenu** — opens on click or `↓`, then `↑`/`↓`/`Home`/`End` move between items,
    `Esc` closes and restores focus to the trigger, first item is focused on open.
  - **CrTable** — sortable headers are now real `<button>`s, so sorting is operable
    with `Enter`/`Space` (previously mouse-only).
  - (Nav resolves elements via `closest()`, not `event.currentTarget`, so it works
    under Qwik's delegated events.)
- **Key hints**: new **`CrKbd`** keycap badge — always-on for main actions, a
  `--hint` variant for secondary actions that reveals on host hover/focus or a
  global peek; new headless **`CrKeyHints`** behavior (hold `Alt` to reveal every
  hint at once via `:root[data-cr-keys]`). Badges are `aria-hidden`; the real
  binding rides **`aria-keyshortcuts`** — `CrButton` gained a `keyshortcuts` prop.
- New CSS: `.cr-kbd` / `--hint` / `--on`, `.cr-keys-host`, and a button-reset
  `.cr-table__sortable`. Gallery demos (all four themes) + a "Keyboard navigation"
  reference table; all three wired into `examples/console` with real shortcuts
  (`i` incident, `n` notify, `1–4` theme) and verified end to end.
