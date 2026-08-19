---
"@alebianco/cr-skill": patch
---

Every documented import path names a package you can actually install.

The reference docs told consumers to import from
`@alebianco/cr-design-system/<subpath>` — 38 occurrences across 9 files. That is
the **private workspace root** (`"private": true`), which is never published, so
any consumer following the docs failed at install rather than at runtime. The
Qwik path was doubly wrong: the root's `./qwik` export points at
`dist/pkg/qwik/index.js`, the pre-compiled JS the Qwik optimizer cannot process.

All rewritten to the published packages:

- framework entries → `@alebianco/cr-components/{react,vue,svelte,angular,solid,qwik}`
- `css` · `structure.css` · `themes/*` · `theme-contract` → `@alebianco/cr-tokens/…`
- `components` · `base` · `parts/*` · `tailwind.css` → `@alebianco/cr-styles/…`
- `cn` · `href` · `duration` · `position` · `forms` · `theme` · `time-scale` → `@alebianco/cr-utils/…`
- `pixel` → `@alebianco/cr-icons/pixel`

`monorepo-migration.md` keeps its references, since it is describing the umbrella
root deliberately. Every rewritten path verified to resolve from a real consuming
app, not just from inside this repo.

Found by the control-room port: it is the first consumer to install these
packages by name.
