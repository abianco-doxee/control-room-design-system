# Framework components (Mitosis)

Interactive components are authored **once** as [Mitosis](https://github.com/BuilderIO/mitosis)
`.lite.tsx` sources in `components/` and compiled to **idiomatic native code** for
each framework — so the library stays one source and apps ship coherent,
framework-native components (not a foreign runtime).

Targets: **React, Vue, Svelte, Angular, Solid** (`mitosis.config.cjs`).

## Why only *some* components are here

Styling and layout live in CSS (`styles/components.css`) and are already
framework-agnostic — a `cr-` class works in any framework or server-rendered
page. So the **static** components (Panel, Chip, Tag, Table, …) need no
compilation; you just apply the class.

Mitosis is reserved for the **interactive** components that carry props / state /
ARIA logic worth writing once: currently `CrButton`, `CrSwitch`, `CrField`
(more as overlays land). They render `cr-` classes and contain **no styling** —
so there is nothing to diverge across targets.

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
npm run build:components     # → dist/frameworks/{react,vue,svelte,angular,solid}/
```

Output is a build artifact (git-ignored); CI compiles it on every push so the
sources can't silently break. Example generated output stays idiomatic — Vue
`<script setup>` + `:aria-checked`/`@click`, Svelte `export let` + `on:click`,
React `htmlFor` + hooks.

## Consume

Load the token + component CSS once (any framework), then import the compiled
component for your framework:

```html
<link rel="stylesheet" href="@control-room/design-system/css" />        <!-- tokens -->
<link rel="stylesheet" href="@control-room/design-system/components" />  <!-- cr- classes -->
```
```tsx
// React
import CrSwitch from "@control-room/design-system/frameworks/react/components/CrSwitch";
<CrSwitch checked={on} label="Live" onChange={setOn} />
```
```vue
<!-- Vue -->
<script setup> import CrSwitch from "@control-room/design-system/frameworks/vue/components/CrSwitch.vue"; </script>
<CrSwitch :checked="on" label="Live" @change="on = $event" />
```

## Rules & limits

- **MUST** keep styling in CSS — Mitosis components apply `cr-` classes, never
  inline styles, so all five targets look identical and the token layer stays the
  single source.
- **MUST** author within Mitosis's supported JSX subset (props, `useStore`,
  `Show`, `For`, events). Complex logic may need per-target checks — CI compiles
  all targets to catch breakage.
- **SHOULD** only reach for Mitosis when a component has real logic/state/ARIA;
  static pieces ship as classes.
- **NEVER** hand-edit `dist/frameworks/**` — it is generated.
