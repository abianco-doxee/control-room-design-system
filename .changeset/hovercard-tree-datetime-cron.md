---
"@control-room/design-system": minor
---

Hover card, tree, and date/time + cron scheduling.

- **CrHoverCard** — a rich hover/focus card for structured content (Tooltip is for
  plain text, Menu for actions). CSS-driven reveal with an open delay; the trigger
  is focusable so keyboard users get it too.
- **CrTree** — a hierarchical `role=tree` (worker→session fleets, config trees),
  rendered as a flat list of visible rows with full keyboard nav (`↑`/`↓`/`Home`/
  `End`, `→` expand/step-in, `←` collapse/step-out, `Enter`/`Space` toggle+select)
  and correct `aria-level` / `aria-expanded`.
- **CrDateTime** — a styled native `datetime-local` / `date` / `time` input.
- **CrCronField** — a cron-expression field with quick presets and a live
  human-readable readout. The translation is **injected** as `description` so the
  design system stays dependency-free; the `examples/console` app wires
  **cronstrue** and derives it reactively with `useComputed$`.

All demoed in the gallery (four themes), cataloged, and documented (+ keyboard-nav
rows). In `examples/console`: a breadcrumb-adjacent `health` hover card, a
worker→session tree in the inspector drawer, and a maintenance-schedule panel where
the cron expression is translated live (e.g. `0 9 * * 1-5` → "At 09:00 AM, Monday
through Friday") next to a first-run date-time. Verified end to end; a11y + baselines
refreshed.

Note: authoring guard — keep `.lite.tsx` header comments to plain ASCII; slashes and
arrow glyphs (↑ → etc.) in a JSDoc block can make the Mitosis codegen collapse
statement newlines and break the React output.
