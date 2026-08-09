# packages/

The `@control-room/*` workspaces. Each is independently publishable with its own
`dist` and `exports`; the root `@control-room/design-system` is a convenience
umbrella that re-exports every subpath, so consumers can import from either.

| Package | Scope | Depends on |
| --- | --- | --- |
| [tokens](./tokens) | `@control-room/tokens` — token source → CSS, themes, Tailwind, DTCG, contract | utils |
| [styles](./styles) | `@control-room/styles` — `cr-*` component styles (bundle + base + parts) | tokens |
| [utils](./utils) | `@control-room/utils` — cn · href · duration · position · time-scale · forms · theme | — |
| [icons](./icons) | `@control-room/icons` — Iconify tooling + path-data packs | — |
| [components](./components) | `@control-room/components` — Mitosis `.lite` → six frameworks | tokens · styles · utils · icons |
| [mcp](./mcp) | `@control-room/mcp` — Model Context Protocol server (agent tools) | tokens · components |
| [docs](./docs) | `@control-room/docs` — Astro + Starlight site, gallery, llms.txt, e2e (private) | everything |

Dependency edges form a DAG (no cycles). Cross-package references use
`@control-room/<pkg>` specifiers — never relative `../` hops across a boundary.

Build/verify fan out from the repo root (`npm run build`, `npm run verify`); see
the top-level [README](../README.md) and `references/monorepo-migration.md`.
