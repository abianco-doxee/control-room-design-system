---
"@control-room/design-system": minor
---

**CrPalette** — a ⌘K command palette, the capstone that ties the shortcuts together.

Built on the native `<dialog>` (browser focus-trap, `Esc`, backdrop). The search
field is a **combobox** driving a **listbox**: focus stays in the input while
`↑`/`↓`/`Home`/`End` move the active option (`aria-activedescendant`), `Enter`
runs it, mouse hover/click work too. Live query filter over label + group, with a
per-command keycap hint on each row.

- Derived results are a `useStore` **method** (not a getter) — a getter compiles to
  a Qwik `useComputed` that runs before the store exists (TDZ crash); the method
  is lazy and safe across all six targets.
- Gallery demo (all four themes) + a "Command palette" reference spec, and it's
  wired into `examples/console`: `⌘K`/`Ctrl+K` opens it, commands run the incident,
  notify, restart, and theme actions. Verified open/filter/nav/run/close end to end.
