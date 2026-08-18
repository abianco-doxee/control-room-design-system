# Framework components (Mitosis)

Interactive components are authored **once** as [Mitosis](https://github.com/BuilderIO/mitosis)
`.lite.tsx` sources in `components/` and compiled to **idiomatic native code** for
each framework — so the library stays one source and apps ship coherent,
framework-native components (not a foreign runtime).

Targets: **React, Vue, Svelte, Angular, Solid, Qwik** (`mitosis.config.cjs`).

## Consuming the packages

Each framework has a subpath export with named components (and, where the target
is typed, prop-type exports):

```ts
import { CrButton, type CrButtonProps } from "@alebianco/cr-design-system/react";
import { CrButton } from "@alebianco/cr-design-system/qwik";
import { CrButton } from "@alebianco/cr-design-system/vue";
```

Every entry also exports **`CrContext`** — the app-level tier for global `pt`,
`locale` and `messages`. It is the one non-component export, and its shape is that
framework's own context primitive (React/Solid a context object, Vue/Svelte a
`{ cr, key }` pair, Qwik a `ContextId`, Angular an injectable), so how you provide
it differs per target. Typed as `CrGlobalConfig`; see
[styling-contract.md](styling-contract.md) for the per-target provider examples.

How each entry is distributed reflects what that framework needs — the package is
private, but every entry is a genuine, consumable package:

| entry | shape | why |
| --- | --- | --- |
| `./react` | **compiled** ESM JS + `.d.ts` (`dist/pkg/react`) | React needs no special compiler, so we prebuild it. `react`/`react-dom` are peer deps. |
| `./qwik` | **compiled** ESM JS + `.d.ts` (`dist/pkg/qwik`) | Same tsc build; JSX via Qwik's automatic runtime. `@builder.io/qwik` is a peer dep. The consumer's Qwik **optimizer** still adds QRL lazy-loading when it processes the package. |
| `./vue` | **SFC source** + `.d.ts` (`dist/frameworks/vue`) | Vue libraries ship `.vue` — the consumer's bundler compiles them and Volar types them from the SFC; the generated `index.d.ts` types the barrel. `vue` is a peer dep. |
| `./svelte` · `./angular` · `./solid` | source + `.d.ts` | shipped as compiled framework source, consumed by that framework's toolchain, each with a generated `index.d.ts`. |

**Types for every target.** All six entries expose a `types` condition. React and
Qwik are TSX, so `tsc` emits full declarations. For Vue/Svelte/Solid/Angular
(non-TSX source), `build/build-pkg-types.mjs` generates an `index.d.ts` from the
shared, framework-agnostic prop interfaces — every component's `<Name>Props` is
re-exported, and the component value is typed per framework (Vue `DefineComponent`,
Solid render fn, Svelte component constructor, Angular class). The shared styling
types (`CrPassThrough`, `CrDesignTokens`, `CrHooks`, `CrGlobalConfig`, …) are
**inlined** from `lib/pt-types.ts` into each `index.d.ts`, because a type merely
imported from `lib/` would be referenced but never declared; `CrContext` is declared
per target alongside them. Peer deps cover all six frameworks, each marked
`optional` so installing for one target doesn't pull the rest. Guarded by
`verify:pkg-types` (drift) and `tests/pkg-exports.test.mjs`.

The build compiles the typed packages with `pnpm run build:pkg` (relative import
extensions rewritten `.tsx → .js` so the emit resolves in Node ESM and bundlers);
`prepack` runs it so `npm pack` ships usable packages. The `test:pkg` gate imports
each entry as a consumer would — React renders through `react-dom/server`, Qwik
loads its named exports, Vue's SFCs are structurally verified — and asserts the
typed declarations ship.

## Runtime verification (the "six frameworks" claim, proven)

"Compiles to six frameworks" is only worth anything if each target actually *runs*.
Two gates back it up:

| target | verified how | coverage | gate |
| --- | --- | --- | --- |
| React | SSR-rendered via `react-dom/server` from the published package | **all 81** | `test:pkg` |
| Vue | compiled SFC → `@vue/server-renderer` | **all 81** | `test:frameworks` |
| Svelte | compiled (`svelte/compiler`, ssr) → `.render()` | **all 81** | `test:frameworks` |
| Solid | compiled (`babel-preset-solid`, ssr) → `renderToString` | **all 81** | `test:frameworks` |
| Angular | instantiated on real `@angular/core`; `@Input` getter + `@Output` executed | **all 81** | `test:frameworks` |
| Qwik | every export loads as a callable component; all 81 parse as Qwik TSX | load + compile | `test:pkg`, `test:frameworks` |

Every component is rendered with a realistic prop set from
`tests/fixtures/component-props.mjs`, derived from each `Cr<Name>Props` interface.
Before that existed the gates rendered only the ~10 components that need no props,
which is how CrCalendar came to throw on every Solid render, and CrLineChart on
every Svelte render, with the suite fully green.

**Qwik is the one target without a render gate.** Its `renderToString` needs a Vite
build context (`import.meta.env`, the client manifest) that plain Node cannot
supply, and the optimizer only transforms source — so rendering happens in the
consumer's build, not here. What is enforced instead: every export loads and is
callable, all 81 compile as valid Qwik TSX, and the `./qwik` subpath still resolves
to optimizer-processable source.

`test:frameworks` (harness in `build/render-fw.mjs`) feeds each target's compiled
output through its **own** compiler + runtime and asserts real Control Room markup /
logic with props driving the output — so a component that works under React but
breaks under Svelte/Solid/Vue/Angular can't slip through. Angular can't be
SSR-rendered in plain Node (its distributed packages are partially-compiled and need
the Angular build linker), so its component **logic** is executed on the real
`@angular/core` instead — a genuine runtime check, one notch below full template
render. **All six targets are verified at runtime; five of them across every component.**

## Coverage

**Every component** is authored in Mitosis (`components/*.lite.tsx`) — Panel,
Button, Chip, Tag, StatusDot, SessionRow, Hero, Bezel, ArrowRail, Drip, Masthead,
Nav, Table, Tiles, Field, Input, Textarea, Select, Choice (checkbox/radio),
Switch, Instrument, EmptyState, the severity **Shape**, the **Breach** (Law 9),
the overlays (Modal on the native `<dialog>`, Toast, Tooltip), the seeded
pixel-**Cat**, the seeded cyber-**Sigil**, the seeded hardware **Chrome** strip,
the seeded **Ascii** density field, and the seeded **Telemetry** string (the
canvas ones imperative
`<canvas>`, painted in `onMount` — Mitosis resolves the ref correctly per target:
`canvasRef.current` in React, `bind:this` in Svelte, etc.).

Components apply the `cr-` classes and hold **no hardcoded appearance** — the
look lives in the token/CSS layer, so all six targets are identical from one
source. On top of that, every functional component exposes the **pt / dt /
unstyled styling contract** (`references/styling-contract.md`): a `data-part` on
each part, an `unstyled` opt-out, a `pt` pass-through, and per-instance `dt`
design tokens. Those are routed through the shared `lib/pt.ts` helpers rather
than authored as literal inline styles — the one place appearance reaches the
markup is a `dt` token map applied to the root, which is a set of CSS custom
properties, not brand values.

**You can still skip the components entirely.** The static pieces are just `cr-`
classes, so in a server-rendered page or a framework you don't compile for, apply
the class directly — the compiled components are a convenience, not a requirement.

## Author

`components/CrSwitch.lite.tsx` — a constrained JSX subset (props, `Show`, events):

```tsx
export interface CrSwitchProps { checked?: boolean; label?: string; onChange?: (n: boolean) => void; }
export default function CrSwitch(props: CrSwitchProps) {
  return (
    <button type="button" role="switch" aria-checked={props.checked ? "true" : "false"}
      class="cr-switch" onClick={() => props.onChange && props.onChange(!props.checked)}>
      <span class="cr-switch__track" aria-hidden="true" />
      {props.label}
    </button>
  );
}
```

## Build

```bash
pnpm run build:components     # → dist/frameworks/{react,vue,svelte,angular,solid,qwik}/
```

Output is a build artifact (git-ignored); CI compiles it on every push so the
sources can't silently break. Example generated output stays idiomatic — Vue
`<script setup>` + `:aria-checked`/`@click`, Svelte `export let` + `on:click`,
React `htmlFor` + hooks.

## Consume

Load the token + component CSS once (any framework), then import the compiled
component for your framework:

```html
<link rel="stylesheet" href="@alebianco/cr-design-system/css" />        <!-- tokens -->
<link rel="stylesheet" href="@alebianco/cr-design-system/components" />  <!-- cr- classes -->
```
Each framework has a **barrel entry** — import any component by name from one
subpath (`/react`, `/vue`, `/svelte`, `/angular`, `/solid`, `/qwik`):

```tsx
// React
import { CrSwitch, CrModal } from "@alebianco/cr-design-system/react";
<CrSwitch checked={on} label="Live" onChange={setOn} />
```
```vue
<!-- Vue -->
<script setup> import { CrSwitch } from "@alebianco/cr-design-system/vue"; </script>
<CrSwitch :checked="on" label="Live" @change="on = $event" />
```
```tsx
// Qwik
import { CrSwitch } from "@alebianco/cr-design-system/qwik";
<CrSwitch checked={on.value} label="Live" onChange$={(v) => (on.value = v)} />
```

The **`examples/console/`** app in this repository is a real Qwik dashboard built
on this barrel — read it for a full composition (nav rail, masthead, session
panels, breach). It is source-only; the published site does not host it.

Need just one component? The deep path still works (extension required):
`import CrSwitch from "@alebianco/cr-design-system/frameworks/react/components/CrSwitch.tsx"`.

The barrels re-export the **default** of every compiled component (Angular also
re-exports each `<Name>Module`). They ship as **source** — your app's bundler
transpiles the `.tsx`/`.vue`/`.svelte` (same as any first-party component); nothing
is pre-bundled, so tree-shaking and your own toolchain stay in charge. The barrels
live under the git-ignored `dist/frameworks/**` and are regenerated by
`build:components` (`build/build-barrels.mjs`), so they always match what compiled.

> **Svelte: legacy mode only — not runes.** Mitosis emits Svelte 4 idiom
> (`export let`, `on:`, `<slot>`, `$:`). Svelte 5 compiles all of it, because it
> auto-detects mode per file and a file without runes stays in legacy mode — the
> peer range is `>=4 <6` and both majors SSR-render byte-identical markup.
>
> What does **not** work is forcing runes project-wide. With
> `compilerOptions.runes: true`, 80 of 81 components fail to compile with
> `Cannot use 'export let' in runes mode` (or `afterUpdate cannot be used in
> runes mode`). Leave runes on auto-detect — the default — and your own
> components can still use runes: the setting is per-file, so ours stay legacy
> while yours don't have to. Runes-mode output
> needs a Mitosis generator that emits `$props()`; it is not something this
> repo can patch in `build/`.

## `cn()` — composing classes

Control Room ships CSS classes; apps frequently need to add or override a Tailwind
utility on a `cr-` element. Use the `cn()` helper (clsx + tailwind-merge) so
conflicting utilities resolve last-wins instead of both shipping:

```tsx
import { cn } from "@alebianco/cr-design-system/cn";
<button class={cn("cr-btn", primary && "cr-btn--accent", "px-4", className)} />
```

It is framework-agnostic (a plain ESM module) and directly importable — no build
step. Keep the styling itself in the `cr-` classes; `cn()` is only for composing
and de-conflicting.

## Rules & limits

- **MUST** keep appearance in the token/CSS layer — components apply `cr-`
  classes and never hardcode brand values in the markup, so all six targets look
  identical and the token layer stays the single source. The only styling a
  component writes to the DOM is via the pt/dt contract's `lib/pt.ts` helpers
  (a `dt` token map + `pt` pass-through), never a literal inline style.
- **MUST** author within Mitosis's supported JSX subset (props, `useStore`,
  `Show`, `For`, events). Complex logic may need per-target checks — CI compiles
  all targets to catch breakage.
- **SHOULD** only reach for Mitosis when a component has real logic/state/ARIA;
  static pieces ship as classes.
- **NEVER** hand-edit `dist/frameworks/**` — it is generated.
