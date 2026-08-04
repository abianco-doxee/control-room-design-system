---
"@control-room/design-system": minor
---

Per-component **playground with editable props** in the Component Browser.

Each live island is now a playground (the Doxee-hub model): a typed controls panel
edits the real compiled component's props and re-renders it live, alongside a code
snippet that reflects the current props.

- `build/showcase-islands.jsx` gains a `Playground` harness — controls are declared
  per component as typed defs (`boolean` → checkbox, `number` → number input with
  min/max/step, `enum` → select, `text` → text input). Editing a control updates
  state and re-renders the actual `dist/frameworks/react` component; controlled
  props (slider value, segmented value, switch checked, pagination page, cron/date
  value…) are two-way, so dragging the component and editing the control stay in
  sync. A `<CrX … />` snippet updates with the props.
- All 22 islands are playgrounds: accordion (`single`), tabs (`active`), menu
  (`label`/`align`), combobox, palette (`open`), tree, drawer (`open`/`side`),
  popover/hover-card (`align`…), segmented, radio-group (`row`), slider &
  number-field (`value`/`min`/`max`/`step`/`disabled`), pagination, date-time
  (`kind`…), cron-field, modal, switch, select, tooltip, table
  (`sortable`/`selectable`/`sticky`), toast-region (`position` + a push button).
- Controls use implicit label association (no ids), so nothing collides across the
  independently-mounted roots and every input keeps an accessible name; the showcase
  a11y gate stays green in all four themes.
- `tests/showcase-islands.spec.mjs` adds a gate that editing a control re-renders the
  live component (segmented value via the select, slider `disabled` via the checkbox)
  and that the code snippet reflects it.

Verified: full build, verify, and the whole e2e suite (a11y + islands + visual, four
themes — 15 tests) pass.
