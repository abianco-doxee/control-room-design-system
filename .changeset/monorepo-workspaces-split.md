---
"@control-room/tokens": minor
"@control-room/styles": minor
"@control-room/utils": minor
"@control-room/icons": minor
"@control-room/components": minor
---

Restructure into npm workspaces: each layer is now an independently-publishable
`@control-room/*` package (tokens, styles, utils, icons, components) with its own
`dist` and `exports`. The root `@control-room/design-system` becomes a convenience
umbrella that re-exports every subpath, so existing `@control-room/design-system/*`
imports are unchanged. Cross-package references use `@control-room/*` specifiers.
Packaging polish: correct `sideEffects` (CSS packages vs pure modules), `keywords`,
`repository`+`directory`, `homepage`, and full `types` on every `utils` entrypoint.
