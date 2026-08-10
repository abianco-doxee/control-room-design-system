# @alebianco/cr-components

The component library of the [Control Room design system](https://github.com/alebianco/control-room-design-system) —
80 components authored once as Mitosis `.lite.tsx` and compiled to idiomatic
React, Vue, Svelte, Angular, Solid, and Qwik. Structure + props + a11y + state
only; styling lives in `@alebianco/cr-styles`, tokens in `@alebianco/cr-tokens`.

```bash
npm i @alebianco/cr-components @alebianco/cr-tokens @alebianco/cr-styles
```

```js
import { CrButton, CrModal } from "@alebianco/cr-components/react";
import "@alebianco/cr-tokens/css";
import "@alebianco/cr-styles/components";
```

## Exports

`./react` · `./vue` · `./svelte` · `./angular` · `./solid` · `./qwik` — the
per-framework barrels (every component). `./frameworks/*` reaches individual
compiled files. React and Qwik ship as compiled, typed packages; the other four
ship as idiomatic single-file components with `.d.ts`.

## Styling contract

Every functional component exposes `data-part` hooks and accepts `pt` / `dt` /
`unstyled` for per-part class/token overrides — see the styling-contract
reference. Author new components as one `.lite.tsx` in `components/`; the build
(`npm run build -w @alebianco/cr-components`) is an incremental Mitosis compiler
that is byte-identical to `mitosis build` (its parity oracle is `build:cli`).
