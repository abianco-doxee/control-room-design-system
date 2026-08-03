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
npm run build:tokens   # regenerate dist/ from tokens/tokens.json
npm run dev            # live docs + gallery at localhost
npm run build          # full build: tokens + gallery + site
```

## Changing tokens

1. Edit `tokens/tokens.json` — add/adjust the value for **all four themes**.
2. `npm run build:tokens` to regenerate `dist/control-room.css`,
   `dist/tailwind-preset.cjs`, and `dist/tokens.flat.json`.
3. Commit `tokens/tokens.json` **and** the regenerated `dist/`.
4. CI runs `npm run verify:tokens` and fails the PR if `dist/` is stale.
5. New signal hue? Verify `--on-sig` contrast against it in every theme
   (`references/accessibility.md`).

## Adding or changing a component

1. Write a spec using `templates/component.md` — fill every section.
2. Build it from tokens only (no raw hex, no `border-radius`, hard shadow only).
3. Add a live demo to the gallery (`build/build-gallery.mjs`) so it is visible
   across all four themes.
4. Run it through the ship gate: `checklists/component-checklist.md`. Every box
   must pass in all four themes.
5. Add a changelog entry (see below).

## Commit & PR conventions

- Small, focused commits. Reference the law/component you touched.
- PR description states: what changed, which laws/tokens it touches, and a note
  confirming the ship checklist passes.
- Update `CHANGELOG.md` under `## [Unreleased]`.

## Versioning

The token package follows **semver**:

- **patch** — a token value tweak that doesn't change intent (e.g. a contrast fix).
- **minor** — a new token, component, or theme; backward compatible.
- **major** — a renamed/removed token or a changed law that breaks existing
  consumers.

On release, move `## [Unreleased]` entries under a new version heading and bump
`version` in `package.json`.
