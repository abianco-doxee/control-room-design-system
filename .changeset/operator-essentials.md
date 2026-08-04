---
"@control-room/design-system": minor
---

Operator essentials — a real table, tabs, meters, and the tokens they need.

- **`CrTable` is now a real operator table**: optional column **sort** (`aria-sort`
  + indicator), row **selection** (checkbox column + `tr[aria-selected]` wash), and
  a **sticky** header. Row hover keys to `--state-hover-mix`.
- **New `CrTabs`** — `role=tablist` with a keyed active underline.
- **New `CrMeter`** — a token-driven capacity bar (`role=meter`, aria value attrs)
  keyed to a signal tone.
- **New chassis / interaction tokens**: `--brd-hair` (1.5px hairline),
  `--shadow-off-sm` (small floating pieces), and theme-independent interaction
  constants `--state-disabled-op`, `--state-hover-mix`, `--row-h`.
- The **`examples/console/`** Qwik app now composes all three in a Queue panel,
  verified building and resuming (sort, select, tab-switch, meters) end to end.

Also hardened the Qwik codegen fixup: it now repairs the return-less IIFE bug for
**any** computed attribute (it was hitting `aria-selected`, not just `class`).
