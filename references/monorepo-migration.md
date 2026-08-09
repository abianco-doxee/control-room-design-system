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
- [ ] Extract `@control-room/icons`, `@control-room/components`, `@control-room/docs`
      (in that dependency order).

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
