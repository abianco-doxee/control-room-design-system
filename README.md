# Control Room Design System

A formal, AI-native definition of the **Control Room** design language and
component library — the neon-noir, neobrutalist instrument style for dense
operational dashboards (session monitors, sprint boards, agent control rooms).

It is three things at once: a **published component library** (`@control-room/*`
scoped packages, authored once and compiled to six frameworks), **documentation
for humans** (an Astro + Starlight site), and a **Claude Code skill + MCP server**
an agent loads to produce work that reads as part of the system.

## Packages

An npm-workspaces monorepo. Each layer is its own independently-publishable
package under the `@control-room/*` scope; the root `@control-room/design-system`
is a convenience umbrella that re-exports every subpath, so existing
`@control-room/design-system/<subpath>` imports keep working unchanged.

```
control-room-design-system/
├── packages/
│   ├── tokens/        # @control-room/tokens   — tokens.json (source of truth) → CSS bundle,
│   │                  #   per-theme layers, structure layer, Tailwind @theme, DTCG, theme contract;
│   │                  #   author brands without forking via brands/*.json
│   ├── styles/        # @control-room/styles   — components.css bundle + base + per-component
│   │                  #   parts/*.css (import-on-use) + the Tailwind v4 entry   (depends on tokens)
│   ├── utils/         # @control-room/utils    — cn · href · duration · position · time-scale ·
│   │                  #   forms (ArkType ⇄ JSON Schema) · theme runtime  (framework-agnostic)
│   ├── icons/         # @control-room/icons    — Iconify build tooling + path-data packs (./pixel)
│   ├── components/    # @control-room/components — 80 Mitosis .lite.tsx → React/Vue/Svelte/Angular/
│   │                  #   Solid/Qwik; per-framework exports (./react …)  (depends on icons)
│   ├── mcp/           # @control-room/mcp      — Model Context Protocol server (npx-runnable)
│   └── docs/          # @control-room/docs     — Astro + Starlight site, gallery, component browser,
│                      #   llms.txt, Playwright a11y/visual suites  (private, dev-only)
├── references/        # the authored reference Markdown — SINGLE SOURCE OF TRUTH for the docs
│   ├── design-language.md   # the NINE LAWS — the why + do/don't for every decision
│   ├── tokens.md · theming.md · responsive.md · tailwind.md · motion.md · accessibility.md
│   ├── components.md · styling-contract.md · forms.md · frameworks.md
│   └── seeded-cat.md · seeded-sigil.md · decoration.md
├── catalog/           # registry.json (source) → catalog.json (GENERATED, queryable index)
├── templates/ · checklists/   # the component spec template + the ship gate
├── SKILL.md           # skill entry point — when to use, index, one-screen ruleset
├── skills/manifest.json · scripts/skills-sync.mjs   # install the skill into .claude/.cursor/.opencode
└── build/build-catalog.mjs · tailwind-input.css     # the few repo-root build inputs
```

Dependency edges: `tokens ← styles`, `tokens ← components`, `utils ← components`,
`icons ← components`, and `docs ← everything` (dev-only). No cycles.

## Install & use

Install one framework build plus the token and style layers:

```bash
npm i @control-room/components @control-room/tokens @control-room/styles
```

```js
import { CrButton } from "@control-room/components/react"; // or /vue /svelte /angular /solid /qwik
import "@control-room/tokens/css";        // the token layer (all four themes)
import "@control-room/styles/components"; // the component styles (or import parts/<name>.css on use)
```

```html
<html data-theme="dark"> <!-- dark | light | extreme | phosphor; omit for dark -->
```

Prefer plain CSS + classes (no framework)? Load the two stylesheets and use the
`cr-*` classes directly:

```html
<link rel="stylesheet" href="@control-room/design-system/css" />        <!-- tokens (first) -->
<link rel="stylesheet" href="@control-room/design-system/components" />  <!-- components -->
<button class="cr-btn">RUN SCAN</button>
```

Read `references/design-language.md` (the nine laws) before building anything new,
and `references/styling-contract.md` for the `pt` / `dt` / `unstyled` hooks.

## AI-native

Control Room is built to be **generated**, not just read. A frontier coding agent
has four machine surfaces:

- **`llms.txt`** — deployed at the site root (`…/llms.txt`), the llmstxt.org index:
  summary, install, every reference doc, all 83 components grouped and linked, and
  the machine-readable surfaces. `llms-full.txt` inlines the full text of every
  reference doc for one-shot ingestion.
- **`@control-room/mcp`** — a Model Context Protocol server: `npx @control-room/mcp`.
  Tools: `list_components`, `search_components`, `get_component` (variants + tokens +
  spec), `list_theme_roles` (the theme contract), `list_references` / `get_reference`
  (the nine laws, styling contract, forms…). Resources: `control-room://catalog`,
  `control-room://theme-contract`. See `packages/mcp/README.md`.
- **`catalog.json`** — every component with its variants, design tokens, keywords and
  spec anchor; also served at the site root and bundled into the MCP server.
- **`SKILL.md`** — the Claude Code / Cursor / opencode skill, installed via
  `npm run skills:sync`.

Register the MCP server in an agent, e.g. Claude Code:

```jsonc
{ "mcpServers": { "control-room": { "command": "npx", "args": ["-y", "@control-room/mcp"] } } }
```

## Design approach

Control Room is defined the way the strongest AI-native design systems are —
optimized to be *generable*, not just *readable*:

- **Constraint hierarchy.** Every rule is tagged `MUST` / `SHOULD` / `NEVER`, so an
  agent can obey it mechanically rather than interpreting prose.
- **Research-grounded language.** The nine laws cite what real productions are
  *documented* to do (Redline, Dandadan, Fallout's Pip-Boy, Evangelion/Khara,
  Edgerunners, neobrutalism) — decisions, not vibes.
- **Token-first.** A single token layer (`@control-room/tokens`) drives four themes
  on an intensity dial; any component built from tokens survives a theme flip with
  zero per-theme code.
- **Author once, ship six.** Components are one Mitosis `.lite.tsx` source compiled
  to React/Vue/Svelte/Angular/Solid/Qwik — structure + props + a11y + state only,
  styling lives in the CSS layer.
- **Spec'd components.** Each has a formal anatomy, token list, variants, copy-ready
  markup, motion, and a11y notes — plus a template and a ship checklist.

## Build & verify

The build fans out across the workspaces from the repo root:

```bash
npm install
npm run build            # full build — every package, in dependency order, then the docs site
npm run build:tokens     # @control-room/tokens → CSS + tw-theme + flat + DTCG + theme-contract
npm run build:components  # Mitosis .lite → six frameworks (incremental) + typed packages
npm run build:mcp        # bundle catalog + contract + docs into the MCP server
npm run build:llms       # → llms.txt / llms-full.txt (+ machine-readable copies)
npm run dev              # Astro + Starlight docs + gallery locally
npm run verify           # static gate: token/palette/styles/icons/catalog/llms/mcp drift + skill
npm run verify:types     # type-check the compiled framework output
npm run test:pkg         # per-framework package + export tests
npm run test:a11y        # accessibility gate (axe, all four themes) — blocks CI
npm run test:visual      # visual regression vs committed baselines
```

Generated artifacts are **committed and drift-gated** (`verify:*`) rather than
regenerated at deploy. The docs site (Astro + Starlight, `packages/docs`, output to
`packages/docs/site-dist`) and the gallery deploy to GitHub Pages via
`.github/workflows/deploy.yml` on push to `main`.

## Install as an agent skill

Control Room ships as a skill you can install in one command — via
[`@control-room/skill`](packages/skill).

**Claude Code — plugin (recommended):** installs the skill *and* the MCP server.

```
/plugin marketplace add abianco-doxee/control-room-design-system
/plugin install control-room-design-system@control-room
```

**Any project — npx installer** (Claude / Cursor / opencode):

```bash
npx @control-room/skill            # → ./.claude/skills (this project)
npx @control-room/skill --global   # → ~/.claude/skills (all projects)
npx @control-room/skill --provider=cursor   # or opencode
```

**Repo contributors:** `npm run skills:sync` installs into the repo's own provider
dirs for local development; `npm run skills:check` is the drift gate. The skill's
file set is declared once in `skills/manifest.json` and drives the bundle, the
plugin, and the npx installer alike.

## Interop with the Doxee Design-System-Hub

This package mirrors the conventions of `Doxee-Product-Management/Design-System-Hub`
so the two can converge: **Astro + Starlight** docs, **DTCG tokens**
(`@control-room/tokens`'s `design-tokens/control-room.tokens.json`, with the same
`com.doxee.cssVar` extension), a **generated JSON catalog** (`catalog/registry.json`
→ `catalog/catalog.json`), **generated-and-committed + drift gates**, a
**single-source skill with multi-provider fan-out**, and **GitHub Pages via Actions**.

**Intentionally distinct — brand.** The hub is built on PrimeVue/Aura with IBM Plex.
Control Room keeps its own neon-noir identity (Archivo / JetBrains Mono, the neon
signal ramp): a separate operator surface, not the general Doxee UI kit.

## Provenance & scope

- **Source of truth:** the reference Markdown in `references/` and the token source in
  `@control-room/tokens` (`packages/tokens/tokens/tokens.json`).
- **Themes:** `dark` is authoritative; `light`, `extreme`, and `phosphor` carry the
  full token set. `phosphor` is the extended monochrome CRT theme.
