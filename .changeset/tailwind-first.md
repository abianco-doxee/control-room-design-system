---
"@control-room/design-system": minor
---

Add Tailwind-first authoring: a Tailwind v4 `@theme` generated from the tokens
(`dist/tw-theme.css`, colors reference the runtime vars so utilities follow
`html[data-theme]`), a consumer entry (`styles/tailwind.css`,
`@control-room/design-system/tailwind.css`), a `build:tw` script that emits a
prebuilt token-driven utility set (`dist/utilities.css`), and
`references/tailwind.md`. Utilities like `bg-work`, `text-on-err`, `p-3`,
`text-sm` resolve to the design tokens and re-theme automatically. The v3 preset
remains available as `./tailwind-preset`.
