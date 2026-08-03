# Contributing to Control Room

Control Room is a **constraint-based** system: the value is in everything staying
consistent. Contributions are welcome, but they go through the same gates every
component does. Read `references/design-language.md` (the seven laws) before
proposing anything visual — most questions are already answered there.

## Ground rules

- **The token layer is the single source of truth.** `tokens/tokens.json` is
  authored by hand; everything in `dist/` is generated from it. Never hand-edit
  `dist/`.
- **Nothing bypasses the laws.** If a change needs a rule that doesn't exist yet,
  add the rule (a law, a token, or a component spec) — don't freelance it in one
  component.
- **Every change survives a theme flip.** dark / light / extreme / phosphor, with
  zero per-theme code.

## Local setup

```bash
npm install
npm run build:tokens   # regenerate dist/ + design-tokens/ from tokens/tokens.json
npm run build:catalog  # regenerate catalog/catalog.json from catalog/registry.json
npm run dev            # Astro + Starlight docs + gallery at localhost
npm run build          # full build: tokens + catalog + gallery + content + site
npm run verify         # token drift + catalog drift + skill validity (the CI gate)
```

## Changing tokens

1. Edit `tokens/tokens.json` — add/adjust the value for **all four themes**.
2. `npm run build:tokens` to regenerate `dist/control-room.css`,
   `dist/tailwind-preset.cjs`, `dist/tokens.flat.json`, and the DTCG export
   `design-tokens/control-room.tokens.json`.
3. Commit `tokens/tokens.json` **and** the regenerated `dist/` + `design-tokens/`.
4. CI runs `npm run verify:tokens` and fails the PR if any generated file is stale.
5. New signal hue? Verify `--on-sig` contrast against it in every theme
   (`references/accessibility.md`).

## Adding or changing a component

1. Write a spec using `templates/component.md` — fill every section.
2. Build it from tokens only (no raw hex, no `border-radius`, hard shadow only).
3. Add a live demo to the gallery (`build/build-gallery.mjs`) so it is visible
   across all four themes.
4. Register it in `catalog/registry.json` (id, category, kind, lifecycle,
   tokens, variants, keywords) and run `npm run build:catalog`. Commit both.
5. Run it through the ship gate: `checklists/component-checklist.md`. Every box
   must pass in all four themes.
6. Add a changeset (`npm run changeset`) — see Versioning below.

## Commit & PR conventions

- Small, focused commits. Reference the law/component you touched.
- PR description states: what changed, which laws/tokens it touches, and a note
  confirming the ship checklist passes.
- Add a changeset (`npm run changeset`); don't hand-edit `CHANGELOG.md`.

## Testing

```bash
npm run test:a11y            # axe-core over the gallery, all 4 themes (hard gate)
npm run test:visual          # visual regression vs committed baselines
npm run test:visual:update   # regenerate baselines after intentional visual changes
npm run test:e2e             # both (builds the gallery first)
```

- The **a11y gate is a hard CI gate** — a serious/critical WCAG violation blocks
  the deploy. New/changed components must pass in all four themes.
- **Visual baselines** (`tests/*-snapshots/`) are committed and platform-suffixed.
  They're environment-sensitive, so visual is **informational** in CI; regenerate
  with `test:visual:update` when you intend a visual change, and commit them.

## Interactive components (Mitosis)

Static components ship as `cr-` CSS classes (framework-agnostic). Components with
real state/logic/ARIA are authored once as Mitosis `.lite.tsx` in `components/`
and compiled to React/Vue/Svelte/Angular/Solid (`npm run build:components`). They
apply `cr-` classes and carry no styling. See `references/frameworks.md`. CI
compiles all targets so sources can't silently break.

## Skills

The skill is authored once (repo root: `SKILL.md` + `references/` + `templates/`
+ `checklists/` + the generated token artifacts) and installed into every agent
provider from `skills/manifest.json`:

```bash
npm run skills:sync    # install into .claude / .cursor / .opencode
npm run skills:check   # validate the source + fail on install drift (CI)
```

Provider installs are generated and git-ignored — never edit them by hand; edit
the root files and re-sync.

## Figma bridge (optional)

The system is code-first; Figma is optional. If you use the free Figma → code
bridge (`references/figma-bridge.md`):

- Provide the Figma token **only** as the `FIGMA_TOKEN` env var (Claude Code
  environment settings or a git-ignored `.env`). Read-only, short-lived, revoked
  when done. **Never** paste it in chat, a commit, or a tracked file — `.gitignore`
  blocks `.env*` / `*.pat` / `*.secret`, but the real guard is not committing it.
- Map Figma components in each entry's `figma` field in `catalog/registry.json`,
  then `npm run build:catalog`. The map is optional and fills incrementally.
- Confidential file? Only point the bridge at a company-approved model — the
  design content reaches whatever LLM the agent uses.

## Versioning

The token package follows **semver**:

- **patch** — a token value tweak that doesn't change intent (e.g. a contrast fix).
- **minor** — a new token, component, or theme; backward compatible.
- **major** — a renamed/removed token or a changed law that breaks existing
  consumers.

Releases are automated with **Changesets** (`.changeset/`):

1. With your change, run `npm run changeset`, pick the bump, write a one-liner —
   commit the generated `.changeset/*.md`.
2. On merge to `main`, the **Release** workflow opens a **"Version Packages"** PR
   that bumps `version` and updates `CHANGELOG.md` from the changesets.
3. Merge that PR to cut the release. The package is **private** — no npm publish.

(You no longer hand-edit `CHANGELOG.md`; changesets own it going forward.)
