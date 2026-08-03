# Changelog

All notable changes to the Control Room design system are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Docs re-platformed to Astro + Starlight** (from VitePress) to match the Doxee
  `Design-System-Hub` stack, enabling eventual fold-in. Reference Markdown is
  generated into Starlight content by `build:content` (source of truth stays in
  `references/`); a neon-noir skin maps `--sl-*` onto the Control Room tokens.
  Astro output goes to `site-dist/`; Pages workflow updated accordingly.

### Added

- **Component catalog** — `catalog/registry.json` (source) → `catalog/catalog.json`
  (generated, deterministic, drift-gated via `verify:catalog`), plus a rendered
  catalog page. Mirrors the hub's registry → catalog model.
- Brand fonts (Archivo, JetBrains Mono) bundled for the docs site.


- **DTCG token export** — `design-tokens/control-room.tokens.json` in the Design
  Tokens Community Group format with the `com.doxee.cssVar` extension, mirroring
  the Doxee `Design-System-Hub` convention. Emitted by `build:tokens` and covered
  by the `verify:tokens` drift gate.
- **Multi-provider skill install** — `skills/manifest.json` +
  `scripts/skills-sync.mjs` (`skills:sync` / `skills:check`) install the skill
  into `.claude` / `.cursor` / `.opencode` from a single source, with a
  validity/drift gate wired into CI.
- `metadata` (version / license / bundle) on the SKILL.md frontmatter.

### Changed

- `dist/control-room.css` is now the generated runtime stylesheet; the
  hand-written `tokens/control-room.css` was removed to keep one source of truth.
  Consumers now load `dist/control-room.css`.

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
