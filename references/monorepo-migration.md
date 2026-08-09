# Monorepo / multi-repo migration plan

Status: **in progress** (branch `claude/monorepo-workspaces`). This is the concrete
blueprint for splitting the single package into workspaces, and — later — into
separate published repos.

Decision (locked): **each package publishes independently** under the `@control-room/*`
scope, owning its own `dist/`, its own `exports`, deps and version. The root
`@control-room/design-system` stays as a convenience umbrella that re-points its
subpath exports (`./css`, `./theme`, `./react`, …) into the sub-packages, so existing
`@control-room/design-system/*` consumers keep working unchanged. Cross-package
references use `@control-room/<pkg>` specifiers (resolved through the workspace
symlinks), never relative `../` hops across package boundaries.

Progress:
- [x] Stage 1 — scaffold workspaces (`workspaces: ["packages/*"]`, stub manifests).
- [x] Extract `@control-room/utils` (cn · href · duration · position · time-scale ·
      forms · theme). Pure source move; green.
- [x] Extract `@control-room/tokens` (tokens.json · brands · build-tokens/theme/palette
      + chassis/ramp/signals/type helpers → dist/themes/*, control-room.css, structure.css,
      theme-contract, tw-theme, flat, dtcg). Owns its own dist + theme.test; green.
- [x] Extract `@control-room/styles` (components.css authored bundle · base.css + parts/*
      partials · tailwind.css entry · build-styles). Depends on `@control-room/tokens`
      (tailwind.css imports `@control-room/tokens/tw-theme.css`). Green.
- [x] Extract `@control-room/icons` (Iconify build tooling + path-data packs; ships the
      pixel pack, exports `./pixel`). Bake-in model: `build-barrels` vendors the pack from
      `@control-room/icons` into every target so `CrIcon`'s relative import resolves and the
      compiled bundles stay self-contained + byte-identical. `CrIcon` also gained a raw-path
      escape hatch (`path`/`filled`) so any glyph/family can be injected per-use. Green.
- [x] Extract `@control-room/components` (all 80 `.lite.tsx` + overrides + `lib/pt.ts` +
      the full Mitosis pipeline: compile-mitosis, build-fix-*, build-barrels, build-pkg,
      build-pkg-types, render-fw, mitosis.config + tsconfigs). Owns its `dist/frameworks`
      + `dist/pkg` and the framework exports (./react ./vue ./svelte ./angular ./solid
      ./qwik ./frameworks/*); depends on @control-room/icons. compile-mitosis resolves the
      Mitosis version via require.resolve (hoist-safe); build:components:cli runs the CLI
      oracle in-package via workspace delegation. Green: build:components (driver + CLI),
      verify:types, pkg (17/17), frameworks (24/24), contract (16/16), separation, biome.
- [x] Extract `@control-room/docs` (private, dev-only leaf): astro/starlight site (src,
      astro.config, public), the gallery/showcase/docs-content/brand-preview builders +
      showcase-islands + gallery-scripts, and the Playwright a11y/islands/responsive/visual
      suites (+ visual snapshot baselines). Consumes the sibling packages via `@control-room/*`
      specifiers (starlight-theme.css imports `@control-room/tokens/css`) and repo-root reads
      via `../..`. Root delegates build:content/gallery/showcase/brand-preview/site + dev/
      preview + the playwright test:* scripts to the docs workspace (so astro/playwright run
      with CWD=packages/docs); the Pages deploy uploads `packages/docs/site-dist`. Validated:
      astro build (22 pages), all generators, verify, biome. Playwright runs in CI (browser).

## Status: complete

All six workspaces are extracted and independently publishable under `@control-room/*`
(`utils`, `tokens`, `styles`, `icons`, `components`) plus the private `docs` site. The root
`@control-room/design-system` remains a convenience umbrella re-exporting every subpath into
the packages, so existing `@control-room/design-system/*` consumers are unchanged. Cross-
package references use `@control-room/<pkg>` specifiers throughout.

### Release-readiness & scope decisions

Blocking a real release (deferred by the team — see the release checklist):

- **Publish story.** The install docs (`npm i @control-room/*`, `npx @control-room/mcp`,
  `npx @control-room/skill`, `/plugin install`) all assume a registry, but the repo is
  configured **private / no-publish** (`.changeset` `access: restricted`, `release.yml` has
  no publish step, `license: UNLICENSED`). Decision needed: publish to public npm, a private
  registry (GitHub Packages), or keep private and reframe the install docs.
- **Pre-split changeset queue.** The ~85 changesets predating the split all name
  `@control-room/design-system` (now the private workspace root Changesets no longer tracks),
  so `changeset status` / the Version Packages PR error. Their content is preserved in this
  CHANGELOG's `[Unreleased]` section and in git. Reconcile at release time — remove the
  vestigial pre-1.0 queue (recommended) or re-point them — once the publish model is chosen.

Deliberate scope (not defects):

- **Per-package build devDeps.** The shared toolchain (Mitosis, framework compilers,
  astro/playwright) lives in the root devDependencies and is hoisted to every workspace.
  Splitting build-only devDeps into each manifest only pays off for standalone installs
  outside the monorepo, and is best validated with `npm pack` + a clean install — a
  publish-time task.
- **Compiled packages: React + Qwik only.** Vue/Svelte/Angular/Solid ship as idiomatic
  framework *source* (SFCs / `.ts` / `.jsx`) via `./frameworks/*` + typed barrels — the
  normal delivery for those toolchains, which compile on consume. React and Qwik additionally
  get a precompiled JS `dist/pkg`. All six are consumable; the asymmetry is intentional.
- **One baked icon family.** `CrIcon`'s portable single-`<path>` model (no `innerHTML`, so
  Vue/Solid-safe across six targets) rules out general multi-element families (Lucide/Tabler)
  as *baked* sets. Multi-family is delivered two ways instead: `@control-room/icons` exposes
  importable per-family path packs, and `CrIcon`'s `path` escape hatch renders any glyph
  per-use. A second baked set would need another single-`<path>` (pixel-style) source.

Done since the split: `build:tw` now emits `@control-room/styles/utilities.css` (was an
orphan at the repo root).

## Why this is staged, not done in one commit

The repo is one package whose ~20 build scripts, the `exports` map, the incremental
Mitosis compiler, CI, and every test resolve paths relative to a **flat root**
(`components/`, `styles/`, `tokens/`, `lib/`, `dist/`, `src/`). A physical move into
`packages/*` rewrites all of those at once. `main` is currently green and deployed;
a restructure that half-lands leaves it undeployable. So it runs on a dedicated
branch, in the staged order below, each stage verified green before the next.

Note on scope for automated sessions: creating *separate GitHub repositories* and
wiring cross-repo publishing needs repo-admin permissions a Claude Code session does
not hold. The **in-repo workspaces** stage (below) is fully doable here; the
**true multi-repo** stage is a human/admin step, documented at the end.

## Target layout (npm workspaces, one repo, one build)

```
control-room-design-system/
├─ package.json                 # workspaces: ["packages/*"], dev tooling, orchestration
├─ packages/
│  ├─ tokens/                   # @control-room/tokens
│  │   tokens/tokens.json · brands/ · build/build-tokens.mjs · build/build-theme.mjs
│  │   → dist/control-room.css · themes/* · structure.css · dtcg · flat · theme-contract
│  ├─ styles/                   # @control-room/styles  (depends on tokens)
│  │   styles/components.css (authored) · build/build-styles.mjs → base.css + parts/*
│  ├─ utils/                    # @control-room/utils   (cn · href · duration · position · time-scale · forms · theme)
│  ├─ icons/                    # @control-room/icons   (icon DATA + Iconify build tooling)
│  │   lib/icons/*.ts (pixel + future families) · build/build-icons.mjs
│  │   → per-pack path-data modules, one per Iconify set, keyed by name
│  ├─ components/               # @control-room/components (depends on tokens, styles, utils, icons)
│  │   components/*.lite.tsx · overrides/ · lib/pt.ts · build/compile-mitosis.mjs
│  │   build/build-fix-*.mjs · build/build-barrels.mjs · build/build-pkg*.mjs
│  │   → dist/frameworks/* · dist/pkg/*  (CrIcon renders; reads packs from @control-room/icons)
│  └─ docs/                     # @control-room/docs (private) — astro/starlight
│      src/ · build/build-docs-content.mjs · build/build-gallery.mjs · build/build-showcase.mjs
│      astro.config.mjs · public/
└─ catalog/                     # generated index (or packages/components/catalog)
```

Dependency edges: `tokens ← styles ← components`; `utils ← components`;
`icons ← components`; `docs ← (everything, dev-only)`. No cycles.

**Why icons get their own package.** The icon *data* (baked path packs) and the
Iconify build tooling are separable from component logic and are the thing most
likely to grow — one pack per Iconify set (pixelarticons today; add a family = add
one `@iconify-json/<set>` devDep + a name-map, run `build-icons`). Keeping them in
`@control-room/icons` isolates that growth (and the Iconify devDeps) from the
component runtime, and lets an app consume raw icon path data directly. `CrIcon`
stays in `@control-room/components` and depends on `@control-room/icons` for the
packs; the house geometric glyph map (the identity set) stays inline in `CrIcon`.

## Staged execution (each stage: move → rewire paths → `verify` + gates green → commit)

1. **Scaffold workspaces.** Add root `"workspaces": ["packages/*"]`; create empty
   `packages/*/package.json` with names + the dependency edges above. No files move
   yet. `npm install` links them. Green by construction.
2. **Extract `docs` first** (highest value, lowest risk — it's leaf, dev-only).
   Move `src/`, `astro.config.mjs`, the gallery/showcase/docs-content build scripts,
   `public/`. Rewire their `ROOT` joins to the package root; docs reads the built
   artifacts from the other packages via workspace deps. Deploy workflow points at
   `packages/docs`. Verify the site builds + a11y/islands/responsive gates.
3. **Extract `tokens`.** Move token sources + `build-tokens`/`build-theme`/palette.
   Re-point `verify:tokens/theme/palette`. Consumers import `@control-room/tokens/css`.
4. **Extract `utils`.** Move `utils/` + `lib/forms` + `lib/theme`; move their tests.
   Pure move; `utils-ports`/`forms`/`theme`/`position`/`time-scale` tests follow.
5. **Extract `styles`** (depends on tokens). Move `styles/` + `build-styles`.
6. **Extract `icons`** (leaf data + tooling). Move `lib/icons/` + `build-icons.mjs`;
   re-point `verify:icons`. `CrIcon` (still in `components`) imports the packs from
   `@control-room/icons` instead of `../lib/icons/…`; `build-barrels` copies the pack
   from the icons package into each target tree.
7. **Extract `components`** (the big one). Move `components/`, `overrides/`, `lib/pt.ts`,
   the Mitosis compiler + fix + barrels + pkg builds, and the component/contract/
   framework tests. Rewire `compile-mitosis.mjs`, `mitosis.config`, and `build-barrels`
   roots. This is where the incremental compiler + byte-identical guarantees get
   re-verified against a pre-move snapshot.
8. **Root orchestration.** Root `build`/`verify`/`lint`/test scripts fan out via
   `npm -ws` (or turbo/nx if we want caching). CI runs the aggregate. Re-confirm the
   full gate matrix + a green Pages deploy.

Rollback: each stage is a commit; revert the stage if a gate fails.

## Keeping the single-source guarantees through the move

- The `.lite → 6 targets` build stays **one** pipeline inside `packages/components`;
  it is not split per framework.
- Tokens stay the single source for CSS + DTCG + Tailwind, in `packages/tokens`.
- The byte-identical incremental compiler is re-validated after stage 6 with the same
  `build:components:cli` parity oracle used today.

## Later: true separate repos + publishing (admin step)

Once the workspaces are stable and independently versioned (Changesets already in the
repo), promoting a package to its own git repo is mechanical:

1. `git subtree split --prefix=packages/<name> -b split/<name>` → push that branch to
   a new repo (needs repo-creation perms).
2. Replace the in-repo workspace dep with the published version range.
3. Wire the new repo's own CI (reuse `.github/workflows/deploy.yml` per package).

Recommendation: stop at **workspaces** unless a package genuinely needs an independent
release cadence or external ownership — the subpath exports (`./css`, `./theme`,
`./forms`, `./react`, …) already give consumers per-layer imports today, so multi-repo
mostly adds coordination cost. Split a package out only when that cost is justified.
