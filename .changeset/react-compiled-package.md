---
"@control-room/design-system": minor
---

Distribution: the React entry is now a **real compiled, typed package** (the
package stays private — this just makes its framework entry point genuinely
consumable). `build:pkg` compiles `dist/frameworks/react` into `dist/pkg/react`:
ESM JS + `.d.ts` declarations, with relative import extensions rewritten `.tsx →
.js` so the emit resolves in both Node ESM and bundlers. `react`/`react-dom` stay
external (declared as peer deps).

The barrel now re-exports prop types too, so consumers get fully-typed named
exports from one entry: `import { CrButton, type CrButtonProps } from
"@control-room/design-system/react"`. The `./react` export gained proper
`types`/`import` conditions pointing at the compiled output; a `prepack` builds it
so `npm pack` / workspace linking ships a usable package.

New `build:pkg` (in the `build` chain) + `verify:pkg` (compile-only type gate) and
a `test:pkg` consumability suite that imports the built package exactly as a
consumer would and renders components through `react-dom/server` (asserting the
Control Room markup + that typed `.d.ts` ship with no `.tsx` specifiers leaking).
CI runs it. The other five framework entries remain source exports for now.
