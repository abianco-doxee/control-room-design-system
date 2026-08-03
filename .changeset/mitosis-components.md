---
"@control-room/design-system": minor
---

Every component is now authored once in Mitosis (`components/*.lite.tsx`) and
compiles to idiomatic React, Vue, Svelte, Angular, and Solid
(`npm run build:components` → `dist/frameworks/`). 23 components total — the full
library, including the imperative seeded pixel-cat (`<canvas>` painted in
onMount, ref resolved correctly per target). Components apply the `cr-` classes
and carry no styling, so all targets are identical and the token/CSS layer stays
the single source; static components remain usable as plain classes for
server-rendered / uncompiled contexts. CI compiles all targets on every push.
Docs: `references/frameworks.md`.
