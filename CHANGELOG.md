# Changelog

All notable changes to the Control Room design system are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
