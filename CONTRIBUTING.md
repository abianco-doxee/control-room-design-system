# Extending Control Room

Control Room is a **constraint-based** system: the value is in everything staying
consistent. Whether you're adding a component, a token, or a theme, the same rules
apply — they're what keep the system coherent instead of becoming a pile of
one-offs.

Read [the nine laws](references/design-language.md) before proposing anything
visual. Most design questions are already answered there.

## The three rules that never bend

- **The token layer is the single source of truth.**
  `packages/tokens/tokens/tokens.json` is authored by hand; everything under
  `packages/*/dist/` is derived from it. Never hand-edit a generated `dist/` — it
  will be overwritten, and `pnpm run verify` will fail.
- **Nothing bypasses the laws.** If a change needs a rule that doesn't exist yet,
  add the rule (a law, a token, or a component spec) — don't freelance it inside
  one component.
- **Every change survives a theme flip.** dark / light / extreme / phosphor, with
  zero per-theme code.

## Local setup

```bash
pnpm install
pnpm run build          # full build: tokens, styles, components, catalog, docs
pnpm run dev            # Astro + Starlight docs + live gallery
pnpm run verify         # drift gate: tokens, styles, catalog, skill (what CI runs)
```

## Changing a token

1. Edit `packages/tokens/tokens/tokens.json` — set the value for **all four themes**.
2. `pnpm run build:tokens` regenerates `packages/tokens/dist/` (theme CSS, the
   Tailwind `@theme` layer, the flat map) and the DTCG export under
   `design-tokens/`.
3. Commit the source **and** the regenerated output. `pnpm run verify:tokens`
   fails if they drift.
4. Adding a new signal hue? Check `--on-sig` contrast against it in every theme —
   see [accessibility](references/accessibility.md).

## Adding a component

1. Write a spec from [`templates/component.md`](templates/component.md) — fill
   every section.
2. Build it from tokens only: no raw hex, no `border-radius`, hard shadow only.
3. Add a live demo in `packages/docs/build/build-gallery.mjs` so it's visible in
   all four themes.
4. Register it in `catalog/registry.json` (id, category, kind, lifecycle, tokens,
   variants, keywords), then `pnpm run build:catalog`.
5. Walk the [ship checklist](checklists/component-checklist.md). Every box must
   pass in all four themes.

Before it's done, confirm:

- **Naming follows the house vocabulary.** A signal selector is `signal` with
  values `work·wait·done·err·idle·accent` — not `tone`/`state`/`kind` with a
  bespoke value set. Sizes are `sm`/`md`. Reuse existing prop names before
  coining new ones.
- **Every state is handled** — hover, active, disabled, focus-visible, plus
  loading / empty / error where relevant. Focus uses the tokenized ring
  (`--focus-*`); never suppress the global `*:focus-visible`.
- **It's accessible** — every control has an accessible name (a `label` prop or a
  documented `CrField` pairing, never a placeholder as the name), ARIA matches
  the WAI pattern, and colour is never the only signal.
- **It compiles** — `pnpm run build:components && pnpm run verify:types` is clean.

## Interactive components (Mitosis)

Static components ship as `cr-` CSS classes and are framework-agnostic.
Components with real state, logic, or ARIA are authored **once** as Mitosis
`.lite.tsx` files in `packages/components/components/` and compiled to React,
Vue, Svelte, Angular, Solid, and Qwik via `pnpm run build:components`. The
compiled output applies `cr-` classes and carries no styling of its own.

See [framework components](references/frameworks.md). CI compiles every target,
so a source change can't silently break one framework. A real Qwik app built on
the compiled output lives in `examples/console/`.

## Testing

```bash
pnpm run test:a11y            # axe-core over the gallery, all 4 themes
pnpm run test:visual          # visual regression vs committed baselines
pnpm run test:visual:update   # regenerate baselines after an intentional change
```

The **a11y gate is a hard CI gate** — a serious or critical WCAG violation blocks
the deploy, in all four themes.

**Visual baselines** (`packages/docs/tests/*-snapshots/`) are committed and
platform-suffixed, so they're environment-sensitive; visual regression is
**informational** in CI. Regenerate and commit them when you intend a visual
change.

## Skills

The skill is authored once at the repo root (`SKILL.md` + `references/` +
`templates/` + `checklists/` + generated token artifacts) and installed into each
agent provider from `skills/manifest.json`:

```bash
pnpm run skills:sync    # install into .claude / .cursor / .opencode
pnpm run skills:check   # validate the source, fail on install drift (CI)
```

Provider installs are generated and git-ignored — edit the root files and
re-sync, never the installs.

## Versioning

Packages follow **semver**:

- **patch** — a value tweak that doesn't change intent (e.g. a contrast fix).
- **minor** — a new token, component, or theme; backward compatible.
- **major** — a renamed or removed token, or a changed law that breaks consumers.

Releases are automated with [Changesets](https://github.com/changesets/changesets).
Add one with your change (`pnpm run changeset`), pick the bump, write a one-liner,
and commit the generated `.changeset/*.md`. On merge to `main`, the Release
workflow opens a **Version Packages** PR that bumps versions and writes each
package's `CHANGELOG.md`; merging it publishes to GitHub Packages. Don't hand-edit
a `CHANGELOG.md` — changesets own them.

## Deprecation policy

Nothing that ships is removed without a documented path:

1. **Deprecate, don't delete.** Keep the old API working and mark it
   `@deprecated` in the JSDoc, naming the replacement (e.g. Tag's `tone` →
   `signal`). Legacy values keep resolving.
2. **Announce it** in a changeset (minor bump), naming the old API, the new one,
   and the removal target.
3. **Remove only on a major**, after at least one minor shipped the deprecation.
   Update the catalog, the docs, and `examples/console/` in the same change.

Renames follow the same rule: add the new prop, alias the old one as a deprecated
fallback, migrate consumers, then drop the alias on the next major.
