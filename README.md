# Control Room Design System

A formal, AI-native definition of the **Control Room** design language and
component library — the neon-noir, neobrutalist instrument style for dense
operational dashboards (session monitors, sprint boards, agent control rooms).

This package is both **documentation for humans** and a **Claude Code skill** an
agent loads to produce work that reads as part of the system. It formalizes and
extends what was prototyped in the two "Control Room" design artifacts (the *Art
Style Language v2* and the *Design Direction* proposal) and partially
implemented in the `dp-tooling` `sprint-dashboard` skill.

## What's here

```
control-room-design-system/
├── SKILL.md                       # entry point — when to use, index, one-screen ruleset
├── README.md                      # this file
├── references/
│   ├── design-language.md         # the SEVEN LAWS — the why + do/don't for every decision
│   ├── tokens.md                  # full token reference (4 themes) + how to consume
│   ├── components.md              # component library — spec + copy-ready markup per component
│   ├── motion.md                  # four motion tiers, glitch/CRT vocabulary, reduced-motion
│   ├── accessibility.md           # WCAG 2.1 AA contract for the aesthetic
│   └── seeded-cat.md              # the identity+state pixel-cat generator (paint() contract)
├── tokens/
│   └── tokens.json                # machine-readable token SOURCE OF TRUTH (author here)
├── build/
│   ├── build-tokens.mjs           # Style Dictionary → dist/ + design-tokens/ (DTCG)
│   └── build-gallery.mjs          # → public/gallery.html (live, self-contained)
├── dist/                          # GENERATED — do not edit
│   ├── control-room.css           # ready-to-use CSS custom properties, all 4 themes
│   ├── tailwind-preset.cjs        # Tailwind preset (colors resolve to CSS vars)
│   └── tokens.flat.json           # resolved cssVar → value, per theme
├── design-tokens/
│   └── control-room.tokens.json   # GENERATED — DTCG format (Doxee-hub compatible)
├── references/                    # design-language, tokens, components, motion, a11y, seeded-cat
├── templates/component.md         # the spec template every new component follows
├── checklists/component-checklist.md  # the ship gate
├── skills/manifest.json           # skill install manifest (source → providers)
├── scripts/skills-sync.mjs        # install the skill into .claude / .cursor / .opencode
└── site/                          # VitePress docs site (publishes the references)
```

## Design approach

Control Room is defined the way the strongest AI-native design systems are —
optimized to be *generable*, not just *readable*:

- **Constraint hierarchy.** Every rule is tagged `MUST` / `SHOULD` / `NEVER`, so
  an agent can obey it mechanically rather than interpreting prose.
- **Research-grounded language.** The seven laws cite what real productions are
  *documented* to do (Redline, Dandadan, Fallout's Pip-Boy, Evangelion/Khara,
  Edgerunners, neobrutalism) — decisions, not vibes.
- **Token-first.** A single token layer (`tokens/`) drives four themes on an
  intensity dial; any component built from tokens survives a theme flip with zero
  per-theme code.
- **Spec'd components.** Each component has a formal anatomy, token list,
  variants, copy-ready markup, motion, and a11y notes — plus a template and a
  ship checklist so new ones stay consistent.

## Quick start

```html
<link rel="stylesheet" href="dist/control-room.css" />
<html data-theme="dark">   <!-- or light | extreme | phosphor; omit for dark -->
```

Then compose from `references/components.md`. Read `references/design-language.md`
first before building anything new.

## Build & publish

```bash
npm install
npm run build:tokens   # tokens.json → dist/ (CSS, Tailwind, flat) + design-tokens/ (DTCG)
npm run build:gallery  # → public/gallery.html (live, self-contained, all 4 themes)
npm run dev            # VitePress docs + gallery locally
npm run build          # full build (tokens + gallery + site)
npm run verify         # CI gate: token drift + skill validity
```

The docs site (`site/`, VitePress) and the gallery deploy to GitHub Pages via
`.github/workflows/deploy.yml` on push to `main` (one-time: Settings → Pages →
Source → GitHub Actions).

## Install as an agent skill

Control Room is a skill. Install it into every agent provider from the single
source of truth:

```bash
npm run skills:sync    # → .claude/skills, .cursor/skills, .opencode/skills
npm run skills:check   # validity + drift gate (runs in CI)
```

Providers and the file set are declared in `skills/manifest.json`.

## Interop with the Doxee Design-System-Hub

This package deliberately mirrors the conventions of `Doxee-Product-Management/
Design-System-Hub` so the two can converge:

- **DTCG tokens** — `design-tokens/control-room.tokens.json` uses the Design
  Tokens Community Group format with the same `com.doxee.cssVar` extension as the
  hub's `design-tokens/components/*.tokens.json`.
- **Generated-and-committed + drift gates** — like the hub's `catalog:check` /
  `skills:check`, our `verify:tokens` and `skills:check` fail CI on drift rather
  than regenerating at deploy.
- **Single-source skill, multi-provider fan-out** — the hub installs skills via a
  CLI into `.claude` / `.cursor` / `.opencode` / …; `scripts/skills-sync.mjs` is
  the lightweight equivalent.
- **GitHub Pages via Actions**, base-path aware — same publishing model.

**Not adopted (intentional):** the hub is an **Astro + Starlight** site built on
**PrimeVue/Aura** with **IBM Plex** type and a `--brand-*` / `--p-*` token plane.
Control Room is a distinct **neon-noir** surface (Archivo / JetBrains Mono, the
neon signal ramp) documented with VitePress. Aligning platform (Starlight) or
brand (inheriting Doxee brand tokens) are open decisions — see below.

## Provenance & scope

- **Source of truth:** the two Control Room artifacts (art style language +
  design direction), transcribed faithfully into `tokens/` and the references.
- **Not yet reconciled:** the live `dp-tooling/skills/sprint-dashboard`
  implementation was private/out of scope for this pass. When integrating,
  reconcile its actual token names against `tokens/tokens.json` and fold any
  divergences back here so this package stays the single source of truth.
- **Themes:** `dark` is authoritative; `light`, `extreme`, and `phosphor` carry
  the full token set. `phosphor` is the extended monochrome CRT theme.
