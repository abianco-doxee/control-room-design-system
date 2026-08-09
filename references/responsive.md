# Responsive architecture — DRAFT PROPOSAL (for review, not yet implemented)

> Status: **proposal**. Nothing here is wired into the build or the published docs
> yet. It exists to agree the direction before writing tokens/CSS. Ported thinking
> from dp-tooling `feature/DOXP-11` (container-relative type scale) generalised
> into a coherent spacing / sizing / grid model.

## Why

Control Room is a **dense, panel-composed dashboard system**. Today the responsive
story is thin and viewport-only:

- **Type** — a fixed px scale (`--text-2xs…--text-xl`) plus a few half-finished
  role tokens (`--type-display-*`, `--type-data-*`, `--type-label-*`). Nothing
  scales with its container.
- **Spacing** — one static 4px step scale (`--space-0…--space-16`). No density
  mode; a card in a wide panel and the same card in a narrow rail get identical
  padding.
- **Sizing** — control heights are ad-hoc; there is **no pointer-aware tap floor**
  (touch targets can fall below 44px on coarse pointers).
- **Grid** — layouts are hand-rolled per route; no shared density/column model.
- **Zero container queries** anywhere (verified). Everything keys off the viewport,
  which is the wrong axis for a system whose unit of composition is the *panel*.

The core thesis: **the panel, not the viewport, is the responsive unit.** A widget
should size to the box it's dropped into, so the same component reads correctly in
a full-width board and a 240px rail without per-placement overrides.

## Principles

1. **Container-query-first.** Components respond to their container
   (`container-type: inline-size` + `cqi` units); the *page shell* is the only
   thing that responds to the viewport.
2. **Three tiers, unchanged.** Responsive values live as component tokens
   referencing new primitive scales — same primitive → semantic → component model
   already in place. No new mechanism, just new scales.
3. **Density is a mode, not a rewrite.** One switch (`data-density="compact"` +ault
   comfortable) remaps spacing/sizing tokens; components never branch on it.
4. **Fixed where fixed matters.** Borders, hairlines, the hard-shadow idiom, and
   radius (always 0) stay non-fluid — they're chassis, not layout.

## Proposed pieces

### 1. Type scale (the concrete port)

Eight roles, each carrying size + weight + leading + tracking:

| Tier | Roles | Unit | Rationale |
| --- | --- | --- | --- |
| Macro | `display` · `h1` · `h2` | `clamp()` on `vw` | page-level headings track the viewport |
| Dense | `body` · `data` · `label` · `meta` | `clamp()` on **`cqi`** | panel text tracks the *panel* |
| Micro | `chrome` | fixed (<11px) | sub-label chrome, never fluid |

- A `.cr-typo` container primitive sets `container-type: inline-size` — **never
  `size`** (that also containers the block axis and collapsed intrinsic heights in
  dp-tooling; heed up front).
- Folds the existing `--text-*` px scale in as the fallback rung.

### 2. Spacing — dual-axis

- Keep the 4px `--space-*` primitive as the base grid.
- Add a **density remap**: `--gap`, `--pad`, `--pad-tight`, `--pad-loose` semantic
  spacing tokens that resolve to different `--space-*` steps under
  `:root[data-density="compact"]` vs comfortable. Components consume `--pad`, not
  `--space-3`, so density is one switch.
- Optional **fluid gaps** for macro layout regions via `clamp()` on `cqi`.

### 3. Sizing

- A `--control-h` scale (sm/md/lg) so inputs/buttons/selects share heights.
- **`.cr-tap` pointer-aware floor**: `@media (pointer: coarse) { min 44px }` —
  keyed to pointer type, not width (ported from dp-tooling; today control-room has
  no such floor).
- Fluid component max-widths (`min(100%, …)`) instead of fixed rems where sensible.

### 4. Grid / density model

- A `.cr-grid-auto` panel grid (`repeat(auto-fill, minmax(var(--col-min), 1fr))`)
  that reflows by *container* width via `@container`, not media queries.
- Named container breakpoints (`--bp-panel-sm/md/lg`) expressed as `@container`
  ranges, so a panel restyles itself when narrow regardless of window size.

## Interaction with what exists

- **Tokens** — all new scales land in `tokens/tokens.json` (primitive + a `type`
  group + semantic spacing) and flow through `build:tokens` → `dist/control-room.css`
  and `dist/tw-theme.css`, guarded by `verify:tokens`.
- **Tailwind** — the fluid roles become `text-<role>` / `p-<pad>` utilities via the
  existing `@theme` bridge (so both the classes-first `.cr-*` layer and utility
  consumers get them).
- **pt/dt contract** — unaffected; density/type are token-level, so `dt` overrides
  still work per instance.
- **a11y** — respect `prefers-reduced-motion` (already) and add the pointer tap
  floor; fluid type must keep min sizes ≥ the AA-legible floor.

## Open decisions (need your call)

1. **Density switch surface** — `data-density` on the root (global) only, or also
   per-container? (Per-container is more flexible, slightly more token plumbing.)
2. **How fluid is spacing?** Fully fluid (`clamp`/`cqi`) gaps everywhere, or fluid
   only at macro region level and stepped inside components? (I lean: stepped
   inside components, fluid at regions — dense UIs read better on a fixed rhythm.)
3. **Container breakpoint count** — 2 (sm/lg) or 3 (sm/md/lg) panel ranges?
4. **Type role count** — adopt all 8 roles, or trim (e.g. drop `chrome`/`meta` if
   `--text-2xs` already covers them)?
5. **Migration** — introduce alongside `--text-*`/`--space-*` (additive, migrate
   components gradually) vs a breaking re-base. I strongly recommend **additive**.

## Rollout (once direction is agreed)

1. Land primitives + type group + `.cr-typo` container primitive + `.cr-tap` (token
   + CSS), no component changes → pixel-neutral.
2. Add semantic spacing/sizing + density remap; migrate 2–3 exemplar components
   (Panel, a form control, a data row) as proof.
3. Roll the density/container model across components in gated batches (like the
   pt/dt rollout), each pixel-diffed.
4. Document + a `/reference/responsive/` page; add a container-query visual test.
