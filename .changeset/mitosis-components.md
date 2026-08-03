---
"@control-room/design-system": minor
---

Add compile-to-many interactive components via Mitosis: author once in
`components/*.lite.tsx`, compile to idiomatic **React, Vue, Svelte, Angular, and
Solid** (`npm run build:components` → `dist/frameworks/`). First components:
`CrButton`, `CrSwitch`, `CrField`. They apply the `cr-` classes and carry no
styling, so all targets stay identical and the token/CSS layer remains the single
source. CI compiles every target on push. Static components still ship as CSS
classes (most portable). Docs: `references/frameworks.md`.
