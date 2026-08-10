---
"@alebianco/cr-tokens": minor
"@alebianco/cr-styles": minor
"@alebianco/cr-utils": minor
"@alebianco/cr-icons": minor
"@alebianco/cr-components": minor
---

Restructure into npm workspaces: each layer is now an independently-publishable
`@alebianco/cr-*` package (tokens, styles, utils, icons, components) with its own
`dist` and `exports`. The root `@alebianco/cr-design-system` becomes a convenience
umbrella that re-exports every subpath, so existing `@alebianco/cr-design-system/*`
imports are unchanged. Cross-package references use `@alebianco/cr-*` specifiers.
Packaging polish: correct `sideEffects` (CSS packages vs pure modules), `keywords`,
`repository`+`directory`, `homepage`, and full `types` on every `utils` entrypoint.
