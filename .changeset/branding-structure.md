---
"@control-room/design-system": minor
---

Branding: structural theming — rounding, borders, shadows, density (not just colour).

Borders (`--brd-*`) and hard shadows (`--shadow-off-*`) were already tokenised, so
overriding them worked; **rounding is now wired too** — the rectangular surfaces
(buttons, inputs, selects, textareas, panels, chips, menus, popovers, toasts,
modals, drawers, the command palette, …) reference a brandable `--radius` (default
`0px`, so zero visual change out of the box). Circular indicators, decorative shapes
and the sanctioned breach keep their own radius.

Two convenience knobs, plus explicit control:

- **`$shape`** — `"sharp"` (0) · `"soft"` (6px) · `"round"` (12px) → `--radius`.
- **`$weight`** — `"hairline"` · `"regular"` · `"heavy"` → the `--brd-*` and
  `--shadow-off-*` scales.
- Any chassis token may be set directly (wins over a preset): `--radius`, the
  border + shadow scales, `--focus-w`, `--focus-offset`, `--row-h` (density).

`CHASSIS_OVERRIDABLE` and the published theme-contract's `chassisOverridable` list
grew to match, so these are known (not "unknown") to `validateTheme`. New brand
**`brands/boardroom.json`** — a light theme with soft corners + a heavy chassis +
roomier rows — shows structural branding end to end; the preview and switch pick it
up automatically. **House-style note:** the Control Room identity is square corners
and hard shadows; `$shape`/`$weight` deliberately relax that, changing a brand's
character. Presets in `build/chassis.mjs`; docs in theming.md "Structure". All gates
green (visual unchanged — `--radius` defaults to 0).
