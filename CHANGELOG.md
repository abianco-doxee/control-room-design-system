# Changelog

All notable changes to the Control Room design system are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Monorepo — independently-publishable `@abianco-doxee/cr-*` packages.** Split into
  npm workspaces: `@abianco-doxee/cr-tokens`, `styles`, `utils`, `icons`, `components`,
  plus a private `docs` site — each with its own `dist` and `exports`. The root
  `@abianco-doxee/cr-design-system` stays a convenience umbrella re-exporting every
  subpath, so existing `@abianco-doxee/cr-design-system/*` imports are unchanged.
- **AI-native surfaces.** `@abianco-doxee/cr-mcp` — a Model Context Protocol server
  (`npx @abianco-doxee/cr-mcp`) exposing the catalog, theme contract, and reference
  docs as tools/resources; `llms.txt` + `llms-full.txt` and `catalog.json` /
  `theme-contract.json` served at the docs site root. Guarded by `test:tooling`.
- **One-command skill install.** `@abianco-doxee/cr-skill` — a Claude Code plugin
  (`/plugin marketplace add …` + `/plugin install`, which also wires the MCP
  server) and an npx installer (`npx @abianco-doxee/cr-skill`, `--global` /
  `--provider` / `--dir`) for Claude / Cursor / opencode.
- **`CrIcon` raw-path escape hatch** (`path` / `filled`) — inject any Iconify
  family or hand-drawn 24×24 glyph per-use without a rebuild; `@abianco-doxee/cr-icons`
  ships importable per-family path-data packs (`./pixel`).
- **Prebuilt Tailwind utilities** — `@abianco-doxee/cr-styles/utilities.css`.
- **Framework components (Mitosis)** — interactive components authored once as
  `.lite.tsx` and compiled to six targets (React, Vue, Svelte, Angular, Solid,
  Qwik), shipped as per-framework package exports with typed props. Guarded by
  `verify:types`, `test:frameworks`, and `test:pkg`.
- **Interactive component browser** — `public/components.html`: every component
  mounted as a live React island and exercised across states, with a category
  index and a live theme switch.
- **Forms** — `CrForm`, a schema-driven form with ArkType ⇄ JSON-Schema
  validation and per-field re-render isolation (`references/forms.md`).
- **pt / dt / unstyled styling contract** — a PrimeVue-shaped styling API across
  every functional component (library-wide, enforced by the styling-contract
  gate): `unstyled` opt-out, `pt` pass-through, and per-instance `dt` design
  tokens, with `data-part` / `data-state` hooks. Backed by a shared `pt.ts` helper
  and finer per-component `--cr-<comp>-*` tokens (`references/styling-contract.md`).
- **Theming & branding** — per-brand `data-theme` layers over the four base
  themes (`references/theming.md`).
- **Accessibility gate + visual regression (Playwright + axe-core)** —
  `test:a11y` fails CI on any serious/critical WCAG 2.1 A/AA violation across all
  four themes (hard gate, blocks deploy); `test:visual` snapshots the gallery per
  theme (informational; baselines in `tests/*-snapshots/`). Wired into
  `.github/workflows/deploy.yml`.
- **Shipped component layer** — `styles/components.css`: consumable `cr-`prefixed
  component classes built entirely on the token layer, exposed via the
  `./components` package export; the living gallery consumes this exact file.
- **Component catalog** — `catalog/registry.json` (source) → `catalog/catalog.json`
  (generated, deterministic, drift-gated via `verify:catalog`), plus a rendered
  catalog page.
- **DTCG token export** — `design-tokens/control-room.tokens.json` in the Design
  Tokens Community Group format with the `com.doxee.cssVar` extension. Emitted by
  `build:tokens` and covered by the `verify:tokens` drift gate.
- **Multi-provider skill install** — `skills/manifest.json` +
  `scripts/skills-sync.mjs` (`skills:sync` / `skills:check`) install the skill
  into `.claude` / `.cursor` / `.opencode` from a single source, with a
  validity/drift gate wired into CI.
- **`--on-err` token** — contrast-safe foreground for error (`--sig-err`) fills.
- Brand fonts (Archivo, JetBrains Mono) bundled for the docs site; `metadata`
  (version / license / bundle) on the SKILL.md frontmatter.

### Fixed

- **Contrast (WCAG AA) across all four themes**, found by the a11y gate: light
  `--on-sig` corrected from white to dark; phosphor `--muted` brightened
  (`#1f8c42` → `#2fac55`); drip/error surfaces use `--on-err` instead of a
  hardcoded `#fff`; removed contrast-eroding opacity on hero/drip sub-text.
- **Docs chrome now tracks the theme** — the Starlight sidebar and the component-
  browser index no longer use the always-dark `--rail`, so the menu is no longer
  dark under the light theme.

### Changed

- **Docs re-platformed to Astro + Starlight** (from VitePress) to match the Doxee
  `Design-System-Hub` stack. Reference Markdown is generated into Starlight
  content by `build:content` (source of truth stays in `references/`); a neon-noir
  skin maps `--sl-*` onto the Control Room tokens. Astro output goes to
  `site-dist/`; Pages workflow updated accordingly.
- `dist/control-room.css` is now the generated runtime stylesheet; the
  hand-written `tokens/control-room.css` was removed to keep one source of truth.

## [1.0.0] — 2026-08-03

### Added

- **Design language** — the seven laws formalized with research grounding and
  `MUST` / `SHOULD` / `NEVER` rules (`references/design-language.md`).
- **Token layer** — machine-readable `tokens/tokens.json` covering four themes
  (dark / light / extreme / phosphor) plus theme-independent chassis, typography,
  and motion tokens.
- **Token build** — Style Dictionary pipeline generating `dist/control-room.css`,
  `dist/tailwind-preset.cjs`, and `dist/tokens.flat.json`, with a
  `verify:tokens` drift check.
- **Component library** — formal specs + copy-ready markup for Panel, Masthead,
  Hero, Rail, SessionRow, StatusDot, Chip, Button, Bezel, Table, Tag, the four
  diagonal primitives, keyed tiles, drip, and empty/error states
  (`references/components.md`).
- **Motion** — four-tier motion architecture, the glitch/CRT vocabulary, and the
  reduced-motion contract (`references/motion.md`).
- **Accessibility** — WCAG 2.1 AA contract for the aesthetic
  (`references/accessibility.md`).
- **Seeded pixel-cat** — deterministic identity+state sprite generator
  (`references/seeded-cat.md`).
- **Living gallery** — self-contained page demoing tokens, typography, and
  components live across all four themes (`/gallery.html`).
- **Docs site** — VitePress site publishing the references, deployed to GitHub
  Pages.
- **Governance** — component authoring template, ship checklist, and this
  changelog.
- Published as a Claude Code skill (`SKILL.md`).

[Unreleased]: https://github.com/abianco-doxee/control-room-design-system/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/abianco-doxee/control-room-design-system/releases/tag/v1.0.0
