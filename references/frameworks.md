# Framework components (Mitosis)

Interactive components are authored **once** as [Mitosis](https://github.com/BuilderIO/mitosis)
`.lite.tsx` sources in `components/` and compiled to **idiomatic native code** for
each framework — so the library stays one source and apps ship coherent,
framework-native components (not a foreign runtime).

Targets: **React, Vue, Svelte, Angular, Solid** (`mitosis.config.cjs`).

## Coverage

**Every component** is authored in Mitosis (`components/*.lite.tsx`) — Panel,
Button, Chip, Tag, StatusDot, SessionRow, Hero, Bezel, ArrowRail, Drip, Masthead,
Nav, Table, Tiles, Field, Input, Textarea, Select, Choice (checkbox/radio),
Switch, Instrument, EmptyState, the overlays (Modal on the native `<dialog>`,
Toast, Tooltip), and the seeded pixel-**Cat** (an imperative
`<canvas>`, painted in `onMount` — Mitosis resolves the ref correctly per target:
`canvasRef.current` in React, `bind:this` in Svelte, etc.).

Components apply the `cr-` classes and contain **no styling**, so all five
targets are identical and the token/CSS layer stays the single source.

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
