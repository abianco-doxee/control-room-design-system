# Styling contract — pt / dt / unstyled (spike)

A PrimeVue-shaped styling API on the Mitosis single-source model, prototyped on
**Tabs, Menu, Modal**. Everything here is verified against the compiled output of
all six targets (`npm run build:components`) and SSR/e2e tests.

## The portable layer (one `.lite` source → all six targets)

Every styled part carries a stable **`data-part`** (and, where it has state, a
**`data-state`**) so you can target internals from CSS without depending on our
`cr-*` class names — the Ark/Radix-style hook, and exactly what PrimeVue's base
emits (`data-pc-section`). Three props drive the rest:

- **`unstyled`** — drop the `cr-*` classes on this instance (behavior + a11y +
  `data-part` stay). Global unstyled = just don't import `styles/components.css`.
- **`pt`** (pass-through) — per part: `pt={{ tab: { class, style, "data-testid", … } }}`.
  `class` is **merged** with the base class; `style` is applied to the part; every
  other key (attributes, and handlers for events the component doesn't own) is
  **spread** onto the part. Parts are documented per component (e.g. Tabs:
  `root` · `tab`).
- **`dt`** (design tokens) — a map of CSS custom properties applied to the root and
  inherited by the parts. Instance-scoped token override, same idea as PrimeVue's
  `dt`. Prefer the **finer per-component tokens** (below) so an override is
  surgical: `dt={{ "--cr-tabs-indicator": "#f0f" }}` retargets *only* the active
  underline, where the coarse `dt={{ "--sig-work": "#f0f" }}` would repaint every
  work-signal in the subtree.

```tsx
<CrTabs
  tabs={["A","B"]} active={1}
  unstyled                                   // no cr-* on this instance
  pt={{ tab: { class: "px-3", "data-testid": "tab" } }}
  dt={{ "--cr-tabs-indicator": "oklch(0.7 0.2 320)" }}   // just the underline
/>
```

### Finer component tokens (the PrimeVue-`dt` granularity)

The token system has a **component tier** (`tokens/tokens.json → "component"`,
emitted into `dist/control-room.css` as `--cr-<comp>-*`, each defaulting to a
semantic/primitive token). `styles/components.css` consumes those vars, so `dt`
can override one part/state without disturbing the global palette. Covered here
(spike three); the pattern matches the pre-existing `--cr-btn-*` / `--cr-panel-*`
/ `--cr-chip-*` groups and extends the same way to any component.

| Component | Tokens |
| --- | --- |
| Tabs | `--cr-tabs-border` · `--cr-tabs-tab-fg` · `--cr-tabs-tab-hover-fg` · `--cr-tabs-tab-active-fg` · `--cr-tabs-indicator` · `--cr-tabs-tab-pad-x/y` |
| Menu | `--cr-menu-panel-bg` · `--cr-menu-panel-border` · `--cr-menu-item-fg` · `--cr-menu-item-hover-bg` · `--cr-menu-item-danger-fg` · `--cr-menu-item-pad-x/y` |
| Modal | `--cr-modal-bg` · `--cr-modal-border` · `--cr-modal-backdrop`¹ · `--cr-modal-head-pad-x/y` · `--cr-modal-body-pad` |

¹ `--cr-modal-backdrop`'s default lives in `:root` so the look is preserved
everywhere; a per-instance `dt` override of the backdrop is best-effort — it
relies on `::backdrop` inheriting from its `<dialog>`, which only modern browsers
do.

Two guards in `tests/styling-contract.test.mjs` keep this honest: the token must
be **defined** in `control-room.css` *and* **consumed** in `components.css` — if
either half reverts to a coarse global, surgical `dt` silently breaks and the test
fails.

> Kept deliberately on `.cr-*` classes, **not** `data-part`/`data-state`: those
> are the consumer hooks that survive `unstyled`, so theming through them would
> defeat the opt-out (the styling would come back once the classes were dropped).

Implementation is one shared, framework-agnostic module — **`lib/pt.ts`** — with
three pure functions: `ptClass()` (unstyled + class-merge), `ptAttrs()` (spread the
bag minus class/style), `ptStyle()` (dt + pt style). Components import it as
`../lib/pt.ts` (the explicit `.ts` lets the package build rewrite the specifier to
`.js`); `build/build-barrels.mjs` copies the source into each target's output tree
so the relative import resolves for the bundler, the type-check, and the shipped
package. Because these are plain functions of `props.pt`/`props.dt` (no `state.`
receiver), Mitosis state-processes the arguments correctly inside a JSX spread —
which is what let the earlier `{...(state.pta())}` post-processor patch be removed.

### One Mitosis codegen quirk this still requires (patched, not worked around in userland)

- **`dt` custom-properties in a `style` object** survive on React/Vue/Svelte
  (Svelte's `stringifyStyles` only kebab-cases uppercase, so `--sig-work` passes
  through). **Angular** applies `style` via `setAttribute` and does **not** take a
  CSS-variable style object — `dt` on Angular needs the scoped-`<style>` runtime
  approach (see residue).

## The escape hatch: per-target overrides

Where the portable layer can't reach full native fidelity, Mitosis lets you
hand-write a whole file for one target that **replaces** the generated output:
drop it at `overrides/<target>/components/<Name>.<ext>` and `build:components` uses
it verbatim for that target only.

`overrides/vue/components/CrTabs.vue` demonstrates the corners the single source
can't do, using Vue's own primitives:

- **function-form pt** reactive to internal state: `pt.tab = ({ active }) => ({...})`
- **listener chaining** via Vue `mergeProps` (consumer `onClick` runs *and*
  selection still fires)
- **global pt** via `inject('crGlobalPT', …)` (app-level defaults)

Verified: after one build, Vue's `CrTabs` is the override; React/Svelte/Solid/Qwik/
Angular are generated from `CrTabs.lite.tsx` (see `tests/styling-contract.test.mjs`).

**Cost:** an override is a full replacement, not a patch — that file is now
hand-maintained and no longer tracks `CrTabs.lite.tsx`. Budget it for the few
components/targets where native reactivity is worth it; it's the PrimeTek
three-codebases cost, scoped.

## Coverage vs PrimeVue — what this spike proves reachable

| Capability | Portable (one source) | Notes |
| --- | --- | --- |
| `data-part` / `data-state` hooks | ✅ | every part, every target |
| `unstyled` (global + per-instance) | ✅ | |
| `pt`: merge class, set style, inject attrs | ✅ | class merged; attrs spread |
| `pt`: inject handlers | ⚠️ | works, but key casing isn't uniform (React `onClick` vs Svelte `onclick`); no chaining |
| `dt`: instance token override | ✅ (React/Vue/Svelte/Solid/Qwik) | Angular needs scoped-`<style>` runtime |
| `pt` function-form (state-reactive attrs) | ❌ portable → ✅ via override | Qwik async blocks it from one source |
| listener **chaining** / global pt | ❌ portable → ✅ via override | native framework primitives |

Net: the ~90%-by-usage (hooks, unstyled, class/style/attr merge, instance tokens)
is one portable source; the reactive/native corners are a budgeted per-target
override.
