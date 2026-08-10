---
"@abianco-doxee/cr-tokens": minor
"@abianco-doxee/cr-styles": minor
"@abianco-doxee/cr-utils": minor
"@abianco-doxee/cr-icons": minor
"@abianco-doxee/cr-components": minor
---

Restructure into npm workspaces: each layer is now an independently-publishable
`@abianco-doxee/cr-*` package (tokens, styles, utils, icons, components) with its own
`dist` and `exports`. The root `@abianco-doxee/cr-design-system` becomes a convenience
umbrella that re-exports every subpath, so existing `@abianco-doxee/cr-design-system/*`
imports are unchanged. Cross-package references use `@abianco-doxee/cr-*` specifiers.
Packaging polish: correct `sideEffects` (CSS packages vs pure modules), `keywords`,
`repository`+`directory`, `homepage`, and full `types` on every `utils` entrypoint.
