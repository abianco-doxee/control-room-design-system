# Control Room — extraction and design-system port

**Date:** 2026-08-11
**Status:** approved

## Summary

Extract the dashboard at `dp-tooling/skills/sprint-dashboard` into a standalone
`control-room` repository, and replace its private UI layer with the published
`@alebianco/cr-*` design system packages.

This is a **port of the presentation layer, not a rewrite**. The server layer,
widget logic, and test suite carry over largely intact. What changes is that
`src/ui/` — 35 hand-rolled primitives — mostly deletes in favour of package imports.

## Why this is a port

Four findings from inspection establish it:

| Area | Finding |
|---|---|
| Coupling | Zero hardcoded `dp-tooling` paths; all external config flows through env vars |
| Framework | App is Qwik; the design system compiles all 80 components to Qwik |
| Provenance | The design system was extracted *from* this app — ~30 of 35 local primitives have `Cr*` twins |
| History | 245 commits touch the skill, **all 245 touch only the skill** — cleanly separable |

The name "sprint-dashboard" understates it: the app is ~22k lines across 8 views
(sprint, sessions, jobs, notes, contacts, catalogue, settings, design), ~60 server
modules, 35 widgets, and ~150 test files. The sprint board is one view of eight.

## Scope

**In:** all 7 functional views, the server layer, the widgets, the test suite.

**Out:**

- The local `/design` gallery. The design system's Astro docs site now owns that
  role; maintaining two component galleries is the duplication this work removes.
- New features, redesign, and server-layer refactoring.
- Any change to `dp-tooling`. The original stays untouched and working as the
  fallback; retiring it is a separate, later decision.

## Decisions

| Decision | Choice |
|---|---|
| Scope | Everything except `/design` |
| Linking | `pnpm.overrides` → `link:` relative paths, sibling checkouts |
| Conflicts | `Cr*` wins; genuine gaps get fixed **upstream** in the design system |
| Sequencing | Extract first (Phase 1), port second (Phase 2) |
| Tests | Green gate at every step |
| Old copy | Left in place; cleaned up later |
| History | Preserved via `git filter-repo` |
| Leftover primitives | Judged individually during the port |
| Qwik export bug | Fixed upstream **before** the port begins |
| Per-swap gate | Read the `Cr*` contract, then assert rendered output |

## Phase 0 — spike (COMPLETE)

Ran before committing to the design, to prove the linked-Qwik-package path works.
A throwaway Qwik app consumed the design system via `link:` and rendered
`CrPanel` + `CrButton` + `CrStatusDot`.

**Result: viable, with two findings that changed the plan.**

### Finding 1 — the published `./qwik` export is broken

`@alebianco/cr-components/qwik` resolves to pre-compiled JS
(`dist/pkg/qwik/`) containing raw `component$()` calls. Qwik's optimizer only
transforms *source*, never `node_modules` JS, so the import fails:

```
Error: Optimizer should replace all usages of $() with some special syntax.
```

Rendering succeeded only when importing `dist/frameworks/qwik/index.ts` — the raw
`.tsx` source.

The package already does the right thing for other frameworks: **Vue, Angular, and
Solid all export raw source** for precisely this reason. Qwik is the outlier. This
is a real bug for any published Qwik consumer, and the fix follows the package's
own established convention.

### Finding 2 — prop drift fails silently (the main risk)

The spike wrote `<CrStatusDot state="work" />`, copying the local API. The real
contract is `signal` plus a **required** `label`:

```tsx
export interface CrStatusDotProps {
  signal?: "work" | "wait" | "done" | "err" | "idle";
  label: string;
  ...
}
```

The wrong prop rendered `--sig-idle` (wrong colour) with no `aria-label` — **and the
test still passed.** A mechanical rename-and-replace port would have shipped wrong
status colours and missing accessibility labels across a dashboard whose entire
purpose is conveying state at a glance.

This is why every swap must assert on rendered output, not merely "tests still green".

## Phase 1 — extract

Goal: a working `control-room` repo that still uses its own `src/ui`. This is the
known-good baseline every later step is measured against.

1. `git filter-repo` the 245 commits into a fresh repo, preserving history.
2. Add repo furniture the skill inherited from `dp-tooling`: `.github/`,
   `biome.json`, `README.md`, `.gitignore`, `.env.example`.
3. Delete the `/design` route and its tests.
4. Green gate: `pnpm install`, `pnpm test`, `pnpm dev` all working.

Exit criterion: the app runs and the suite passes with **zero design-system code involved.**

### Prerequisite — fix the Qwik export upstream

Before Phase 2, in `control-room-design-system`: repoint `./qwik` in
`packages/components/package.json` at `dist/frameworks/qwik` raw source, matching
the Vue/Angular/Solid pattern. Verify with the Phase 0 spike test. Own commit,
own repo.

## Phase 2 — port

### Step 2.0 — reconcile tokens first

The app has its own `src/styles/tokens.css` (224 lines) defining `--ground`,
`--panel`, `--sig-*`; `cr-tokens` defines its own set. If names overlap but values
or semantics diverge, swapping stylesheets shifts colours app-wide. The app also
has `tests/ui/tokenContract.test.ts` and `tests/styles/theme-bridge.test.ts` that
likely encode the local contract.

Diff both token sets, reconcile, get theme tests green. **Nothing else proceeds
until tokens are one layer** — every component swap depends on it.

### Step 2.1..N — one primitive per commit

For each of ~30 primitives:

1. **Read the `Cr*` source** prop interface. Do not assume the local API carries over.
2. Migrate call sites deliberately, honouring renamed and newly-required props.
3. Delete the local primitive.
4. **Assert rendered output** — correct token, correct ARIA, correct classes — not
   just a passing suite.
5. Run the full suite. Commit.

One primitive per commit, so any regression bisects to a single component.

Where a `Cr*` component genuinely lacks something the app needs, the gap is fixed
**upstream** in the design system in its own commit — never shimmed locally.

### Known prop drift

Confirmed so far (the full mapping emerges per-primitive during the port):

| Local | Design system | Drift |
|---|---|---|
| `StatusDot state=` | `CrStatusDot signal=` | renamed; `label` now **required** |
| `Panel` | `CrPanel` | gained `weight`, `inset`, `pt` |

### The four leftovers

`BracketLabel`, `RefCard`, `SourceHeader`, `SourceState` have no `Cr*` counterpart.
Judged individually when reached. Prior: `SourceHeader`/`SourceState` encode this
app's data-source-freshness domain and should stay local; `BracketLabel` is
probably general enough to upstream.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Token contract collision | High | Step 2.0, before any component swap |
| Prop drift shipping silently | High | Read contract + assert rendered output per swap |
| Styling-contract adoption (`pt`/`dt`) | Medium | Mechanical but broad; expect wide call-site churn |
| Qwik package integration | Resolved | Phase 0 proved it; export fix is a prerequisite |
| Leftover primitive placement | Low | Decided per component |

**Rollback:** `dp-tooling` stays untouched throughout, so the working dashboard is
always one `cd` away.

## Testing

The ~150-file suite is the gate: green before and after every primitive swap. UI
tests asserting local markup get rewritten to the `Cr*` contract as they break —
those rewrites are the real specification of each swap, and the honest cost centre
of this project.

Qwik tests use `qwikVite()` plus `createDOM()` from `@builder.io/qwik/testing`,
matching the app's existing `vitest.config.ts`.
