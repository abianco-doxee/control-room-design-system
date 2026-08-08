---
"@control-room/design-system": minor
---

Make the "six frameworks" claim true at runtime. Previously only React was
runtime-tested and the other targets were type-checked only. New `test:frameworks`
gate (harness in `build/render-fw.mjs`) compiles each target's output with its
**own** toolchain and SSR-renders it in Node:

- **Vue** — compiled SFC → `@vue/server-renderer`
- **Svelte** — `svelte/compiler` (ssr) → `.render()`
- **Solid** — `babel-preset-solid` (ssr) → `renderToString`

Each asserts real Control Room markup with props driving the output (so a component
that renders under React but breaks elsewhere can't slip through). Combined with the
existing gates, verification now stands at: React (render), Vue/Svelte/Solid (SSR
render), Qwik (import) — five of six at runtime; Angular remains build-verified only
(its runtime needs a heavier platform-server harness), documented as the one honest
gap. Wired into CI; frameworks.md gains a verification matrix.
