# packages/

The `@alebianco/cr-*` workspaces. Each is independently publishable with its own
`dist` and `exports`; the root `@alebianco/cr-design-system` is a convenience
umbrella that re-exports every subpath, so consumers can import from either.

| Package | Scope | Depends on |
| --- | --- | --- |
| [tokens](./tokens) | `@alebianco/cr-tokens` — token source → CSS, themes, Tailwind, DTCG, contract | utils |
| [styles](./styles) | `@alebianco/cr-styles` — `cr-*` component styles (bundle + base + parts) | tokens |
| [utils](./utils) | `@alebianco/cr-utils` — cn · href · duration · position · time-scale · forms · theme | — |
| [icons](./icons) | `@alebianco/cr-icons` — Iconify tooling + path-data packs | — |
| [components](./components) | `@alebianco/cr-components` — Mitosis `.lite` → six frameworks | tokens · styles · utils · icons |
| [mcp](./mcp) | `@alebianco/cr-mcp` — Model Context Protocol server (agent tools) | tokens · components |
| [docs](./docs) | `@alebianco/cr-docs` — Astro + Starlight site, gallery, llms.txt, e2e (private) | everything |

Dependency edges form a DAG (no cycles). Cross-package references use
`@alebianco/cr-<pkg>` specifiers — never relative `../` hops across a boundary.

Build/verify fan out from the repo root (`npm run build`, `npm run verify`); see
the top-level [README](../README.md) and `references/monorepo-migration.md`.
