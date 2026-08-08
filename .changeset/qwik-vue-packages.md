---
"@control-room/design-system": minor
---

Distribution: real Qwik and Vue named-export entries (package stays private).

**Qwik** joins React as a **compiled** package — `build:pkg` now also emits
`dist/pkg/qwik` (ESM JS + `.d.ts`, JSX via Qwik's automatic runtime, relative
`.tsx → .js` specifiers rewritten). Prop types are re-exported from the barrel, so
consumers get `import { CrButton, type CrButtonProps } from
"@control-room/design-system/qwik"`. `@builder.io/qwik` is an (optional) peer dep;
the consumer's Qwik optimizer still adds QRL lazy-loading when it processes the
package. tsc's loose ref-typing notes on the generated Qwik code are tolerated (the
emit is correct), mirroring `verify:types`' leniency for React.

**Vue** is elevated to a first-class entry, distributed as **SFC source** (the
idiomatic Vue-library model — the consumer's bundler compiles the `.vue` files and
Volar types them). `./vue` gains proper `types`/`vue`/`import` export conditions and
`vue` as an (optional) peer dep.

`./react`, `./qwik`, `./vue` peers are all optional (you pull in only the framework
you use). `test:pkg` now covers all three — React renders via `react-dom/server`,
Qwik imports + loads its named exports, Vue's SFCs are structurally verified — and
each asserts typed declarations ship with no `.tsx` leaking. Docs: frameworks.md
"Consuming the packages". All gates green.
