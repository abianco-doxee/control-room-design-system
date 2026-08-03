# Tailwind-first authoring

Control Room ships a **Tailwind v4 theme generated from its tokens**, so you can
build UIs with utility classes that resolve to the design tokens and follow the
theme (`dark / light / extreme / phosphor`). This is the primary, most flexible
way to author — the `cr-` component classes (`styles/components.css`) are
convenience compositions on top.

## Setup

```css
/* your app's main CSS, processed by Tailwind v4 */
@import "@control-room/design-system/tailwind.css";   /* Tailwind + the CR @theme */
```

```html
<!-- load the runtime token layer once, and pick a theme -->
<link rel="stylesheet" href="@control-room/design-system/css" />   <!-- dist/control-room.css -->
<html data-theme="dark">
```

Tailwind scans **your** markup and emits only the utilities you use. No build of
your own? Use the prebuilt file: `npm run build:tw` → `dist/utilities.css` (a
bounded, token-driven utility set).

## What you get (utilities → tokens)

| Utility | Resolves to |
| --- | --- |
| `bg-panel` `bg-board` `bg-ground` | surface tokens (`--panel` …) |
| `text-ink` `text-muted` | text tokens |
| `bg-work` `bg-wait` `bg-done` `bg-err` `bg-idle` `bg-accent` `bg-stage` | the signal ramp |
| `text-on-sig` `text-on-err` | contrast-safe on-fill text |
| `border-border` | the ink border |
| `p-3` `px-4` `gap-2` `m-2` | the spacing scale (4px base — `p-3` = 12px) |
| `text-xs` `text-sm` `text-lg` | the type scale |
| `font-mono` `font-sans` | the two families |

Because the color utilities reference the runtime CSS vars, **the same markup
re-themes automatically** when you change `html[data-theme]`.

## Example — a panel, Tailwind-first

```html
<section class="bg-panel border-2 border-border p-3 flex flex-col gap-3"
         style="box-shadow: var(--shadow-off) var(--shadow-off) 0 var(--shadow-col)">
  <h4 class="font-mono text-xs font-extrabold uppercase text-ink">Sessions</h4>
  <div class="flex items-center gap-3">
    <span class="bg-work" style="width:var(--space-2);height:var(--space-2);border:1.5px solid var(--border)"></span>
    <span class="flex-1 font-mono text-sm text-ink">PTL-757 chat-turn</span>
    <span class="font-mono text-xs text-muted">streaming</span>
  </div>
</section>
```

## Guardrails (the laws still apply)

- **MUST** keep corners square — `rounded-none` only; the theme forces every
  `--radius-*` to 0, so `rounded-*` utilities are no-ops by design.
- **MUST** keep color = state — use signal utilities (`bg-err`, `text-on-err`)
  for real state, not decoration.
- **NEVER** hand-write a hex or a raw px in markup; use the token utilities /
  `--space-*` vars. The accessibility gate still runs on the result.

## Which layer to use when

- **Utilities** (this file) — layout, spacing, one-off composition, app screens.
- **`cr-` components** (`styles/components.css`) — recurring pieces (Button,
  Panel, Chip, …) you don't want to re-compose each time.
- **v3 preset** — `dist/tailwind-preset.cjs` is still exported (`./tailwind-preset`)
  for Tailwind v3 projects; v4 `@theme` is the preferred path.
