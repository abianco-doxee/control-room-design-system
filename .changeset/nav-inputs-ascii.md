---
"@control-room/design-system": minor
---

Navigation & input components, with ASCII detailing in lists and separators.

- **CrBreadcrumb** — navigation trail with ascii `/` separators and `aria-current`.
- **CrSegmented** — single-select connected button bar (radiogroup semantics +
  roving tabindex: `←`/`→`/`Home`/`End`).
- **CrCombobox** — autocomplete: an input (`role=combobox`) filtering a listbox,
  `aria-activedescendant` nav, scrim outside-close; the active option shows an
  ascii `▸` marker.
- **CrNumberField** — number input with `−`/`+` steppers, clamped to min/max.

**ASCII detail utilities** (structure, never a signal):
- `.cr-sep` / `.cr-sep--dot` / `--double` and `.cr-sep-label` — box-rule separators
  (dashed/dotted/double; labeled `── LABEL ──`).
- `.cr-list` (`--dot` `--tick` `--plus`) — ascii-marker lists (`▸ · » +`).
- `.cr-leader` — dot-leader rows (`label ········· value`).

All demoed in the gallery (four themes), cataloged, documented (+ keyboard-nav
rows), and composed into `examples/console` — a breadcrumb above the masthead, a
scope segmented + worker combobox + max-retries number field in the queue controls,
and the inspector drawer rebuilt with dot-leaders, a labeled rule, and a marker
list. Verified end to end.
