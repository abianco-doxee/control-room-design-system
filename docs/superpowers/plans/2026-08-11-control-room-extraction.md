# Control Room Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the dashboard at `/Users/abianco/Workspace/DP/dp-tooling/skills/sprint-dashboard` (245 commits; **not** the 29-commit copy at `~/Workspace/AI/dx-skills`) into a standalone `control-room` repo and replace its private UI layer with the `@alebianco/cr-*` design system packages.

**Architecture:** Two phases with a hard boundary. Phase 1 moves the app verbatim (history preserved via `git filter-repo`) and gets it green with its own `src/ui` untouched — the known-good baseline. Phase 2 swaps the token layer, then the primitives one per commit, each swap gated on a test asserting *rendered output* rather than merely a passing suite.

**Tech Stack:** Qwik 1.20 + Qwik City, Vite 5, Vitest 2, pnpm workspaces, `@alebianco/cr-{components,tokens,styles,utils,icons}` consumed via `pnpm.overrides` → `link:` to a sibling checkout.

## Global Constraints

- **Package manager: `pnpm` only.** Never `npm` or `bun`.
- **Design system path:** the sibling checkout is `../control-room-design-system` relative to the new repo root.
- **Qwik import subpath:** always `@alebianco/cr-components/qwik`. Never deep-import `dist/pkg/qwik` (unoptimizable pre-compiled JS) or `dist/frameworks/...` (bypasses the export contract).
- **Theme:** exactly two schemes ship — `control-room` (dark) and `control-room-light`. `extreme` and `phosphor` are out of scope.
- **Signal ramp is not a branding surface.** Never redefine `--sig-*`; the app inherits them from the design system (Law 2).
- **Route accents:** MUST keep ≥15° OKLCH hue distance from every signal hue in both schemes and from each other.
- **Route accents paint only `--cr-nav-accent`.** Never let a route accent fill a content-area element.
- **One primitive per commit** in Phase 2. Never batch two primitive swaps into one commit.
- **Every swap asserts rendered output** — the correct token and the correct ARIA — not just "suite still green".
- **Do not modify `dp-tooling`.** It stays working as the rollback.
- Qwik tests use `qwikVite()` in `vitest.config.ts` plus `createDOM()` from `@builder.io/qwik/testing`.

**Reference:** the design spec is `docs/superpowers/specs/2026-08-11-control-room-extraction-design.md` in the design-system repo. Working verifier scripts live in that repo at `docs/superpowers/specs/assets/`.

---

## Addendum — design-system drift since 2026-08-11 (audited 2026-08-19)

This plan was written the same day as the spec. ~150 design-system commits have
landed since. The plan's **structure, sequencing and gates are unchanged** — the
drift lands almost entirely inside Task 11's per-primitive cycle, which exists to
catch exactly this. Corrections, all verified against source:

**Breaking prop drift** (changesets `w3`, `w7`, `w8-signal-vocabulary`):

| Component | Plan-era API | Current API | Plan task |
| --- | --- | --- | --- |
| `CrChip` | `tone=` taking `done` · `alt` | `signal=` taking `work` · `wait` · `done` · `err` · `idle` · `accent` (`alt` → `work`) | 11 #3 |
| `CrToggleChip` | `count?: number` | `badge?:` string · number · boolean (`true` = bare dot) | 11 #13, #14 (21 sites) |
| `CrPopover`/`CrMenu`/`CrHoverCard`/`CrModal` | `align=` taking `left` · `right` | `placement?: string` (`"bottom-start"` default) | 11 #9 |
| `CrCalendar` | `weekStart?: number` | `weekStart?=` taking `"sunday"` · `"monday"` | — |
| `CrKeyHints` | (no key API existed) | `hints: {keys,label}[]` | 11 #5 |
| `CrToastRegion` | 4 corners | 9 anchors; toasts dedup; `onDismiss` fires `newestId` | 11 #23 |
| `CrProgress` | `role="progressbar"` on root | moved down to `.cr-progress__track` | — |

**Unchanged — Tasks 8 and 10 are still accurate as written.** The signal-vocabulary
changeset canonicalised *other* components onto `CrStatusDot`'s existing list; it
did not rename `CrStatusDot` or `CrButton`. Note `CrPanel` still uses `tone` for
its eyebrow — the rename was **per-component, not global**. Always read the
contract; never pattern-match from a sibling.

**New tokens:** `--focus` (split from `--sig-work`; the light theme's cyan reached
only 2.86:1) and `--seam` (internal divider, split from the chassis-edge
`--border`). Both are auto-derived for brands that omit them, so `control-room`
stays valid — but Task 6's audit must not treat them as unknown app tokens.

**Additive, plan-relevant:** every leaf form control gains `invalid?: boolean` (an
a11y hook only — never set it for appearance; visual error state still derives
from the wrapping `CrField`). `CrInput` gains `icon`, `clearable`, `onClear`.

**Not affected:** `CrMeter` and `CrRadioGroup` were removed, but this plan never
referenced either. All 28 components in Task 11's table still exist.

### Build prerequisite (blocks Task 3)

`packages/components/dist/` is **gitignored and untracked** (0 files in git),
unlike `packages/tokens/dist` and `packages/styles/styles`, which are tracked. A
fresh sibling checkout therefore has **no** `dist/frameworks/qwik/index.ts`, and
Task 3's `link:` install plus smoke test will fail until the design system is
built. See Task 3 Step 0.

### Import specifier warning

`references/frameworks.md:17` and `:182` tell consumers to import from
`@alebianco/cr-design-system/qwik`. **That specifier is wrong for Qwik.** The root
package exports it to `packages/components/dist/pkg/qwik/index.js`, and all 81
files there contain raw `component$()` calls the Qwik optimizer cannot process —
the exact failure in the spec's Finding 1. Only `@alebianco/cr-components/qwik`
is correct. This is a live design-system bug for any Qwik consumer, independent of
this port; fixing it upstream is tracked in the Deferred section.

### Cascade context — new tier the plan predates

The design system gained a global `pt` / `locale` / `messages` tier. Export:
`CrContext` from `@alebianco/cr-components/qwik`; mount with
`useContextProvider(CrContext, { pt, locale, messages })` in `src/root.tsx`.
There is **no `<CrProvider>` component and no global `dt` tier** — `dt` stays
per-component. Mounting is optional (reads are rewritten to
`useContext(CrContext, null)`), so omitting it will not break the app; it just
leaves the tier unused. Locale-aware components this plan swaps: `CrRelativeTime`
(Task 11 #12), plus `CrCalendar`, `CrDateTime`, `CrDataGrid`, `CrLineChart`.
`CrModal`, `CrToastRegion` and `CrNav` take a `labels?: Record<string, any>` prop.
See Task 5b.

### Release state — this port IS the release validation

**Sequencing decision (2026-08-19): migrate first, fix what the port finds, then cut
1.0.0.** The port is the design system's first real consumer, so it is the only thing
that can establish whether the contract is shippable. Publishing first would freeze a
contract nothing has exercised.

Consequences for this plan:

- **Stay on `link:` for the whole port.** Do not publish mid-port. The `^1.0.0` deps
  in Task 3 resolve from no registry today; the `pnpm.overrides` block is
  load-bearing, not a convenience. All 7 packages are `0.0.0`;
  `.changeset/first-release.md` marks them `major`, so the eventual first release is
  `1.0.0` and the declared deps become correct at that moment.
- **Every upstream fix needs a changeset.** See the rule below — this is the one
  genuinely new discipline the sequencing imposes.
- **`.github/workflows/release.yml` stays gated** on `vars.RELEASE_ENABLED` until the
  port is green. Flipping it is the last step, not a prerequisite.
- **Expect the port to change the design system.** Findings are the deliverable, not
  a setback. Log them (Task 14) so the release notes describe what actually shipped.

#### Rule: every upstream fix carries a changeset

The plan already says to fix gaps **upstream** rather than shim locally (Task 11
Step 5, Task 12). Under this sequencing every such fix lands in the release cut
afterwards, so an unversioned fix either ships silently or blocks the release. So:

> Any commit to `control-room-design-system` made **because of** this port MUST add a
> `.changeset/*.md` in the same commit, with the correct bump. Breaking prop changes
> are `major`; additive props are `minor`; visual/CSS-only corrections are `patch`.

**Branch policy (decided 2026-08-19): straight to `main`.** No feature branch, no PR
per fix. Nothing is published, so `main` is not a release surface yet, and the
changeset rule above already makes every fix individually reviewable. The tradeoff:
the release cut is not one reviewable diff, so Task 14 Step 1's audit is what
catches an unversioned fix instead. Task 1 Step 0 tags `port-start` to bound it.

Since nothing is published yet, `major` is nearly free — prefer it over a shim or a
reluctant `minor` when a contract is genuinely wrong. This port is the last moment
breaking changes are cheap.

---

## File Structure

**Phase 1 creates the new repo** at `~/Workspace-personal/control-room` (sibling to `control-room-design-system`):

| Path | Responsibility |
| --- | --- |
| `src/routes/` | 7 view routes + ~30 API routes (moved verbatim) |
| `src/server/` | ~60 data-source and store modules (moved verbatim, never edited in Phase 2) |
| `src/widgets/` | 35 widgets — imports change in Phase 2, logic does not |
| `src/ui/` | 35 local primitives → shrinks to ~4 app-specific ones |
| `src/styles/tokens.css` | **deleted** in Task 6; replaced by design-system imports |
| `src/styles/app-tokens.css` | **new** in Task 6 — the 62 app-domain tokens, deriving from DS signals |
| `src/styles/global.css` | app layout + the `.cr-*` app-local classes; token references rewritten in Task 6 |
| `tests/` | ~150 files, the green gate |
| `tests/styles/route-accents.test.ts` | **new** in Task 7 — the ≥15° constraint gate |

**Phase 2 deletes** each `src/ui/<Primitive>.tsx` as its swap lands, plus its `tests/ui/<primitive>.test.tsx` where that test only asserted local markup.

---

## Phase 1 — Extract

### Task 1: Extract the repo with history

**Files:**
- Create: `~/Workspace-personal/control-room/` (whole repo)

**Interfaces:**
- Consumes: nothing.
- Produces: a git repo whose `HEAD` contains the app at its former `skills/sprint-dashboard/` paths, rewritten to the repo root, with all 245 commits.

**Context:** All 245 commits touching `skills/sprint-dashboard` touch *only* that directory (verified), so the filter is lossless with no mixed commits to untangle. `git-filter-repo` is already installed at `/opt/homebrew/bin/git-filter-repo`.

- [ ] **Step 0: Tag the design system at the port's starting point**

Port-driven fixes land straight on `main` in the design-system repo, so this tag is
the only reliable boundary for Task 14's changeset audit. Create it **before** any
port work.

```bash
cd ~/Workspace-personal/control-room-design-system
git tag port-start
git tag --list port-start   # confirm it exists
```

- [ ] **Step 1: Clone the source repo to the new location**

```bash
git clone /Users/abianco/Workspace/DP/dp-tooling ~/Workspace-personal/control-room
cd ~/Workspace-personal/control-room
```

- [ ] **Step 2: Verify the clone has the expected history**

```bash
git log --oneline -- skills/sprint-dashboard | wc -l
```

Expected: `245`

- [ ] **Step 3: Rewrite history to the subdirectory**

```bash
cd ~/Workspace-personal/control-room
git filter-repo --subdirectory-filter skills/sprint-dashboard --force
```

- [ ] **Step 4: Verify the rewrite**

```bash
git log --oneline | wc -l          # expect 245
ls package.json src/routes/index.tsx   # both must exist at the root now
git log --oneline -3
```

Expected: 245 commits; `package.json` and `src/routes/index.tsx` at the repo root.

- [ ] **Step 5: Detach from the origin and re-point at nothing**

```bash
git remote remove origin 2>/dev/null || true
git remote -v    # expect empty output
```

- [ ] **Step 6: Commit nothing yet — the filter already rewrote history**

No commit here. `git status` should be clean:

```bash
git status --short   # expect empty
```

---

### Task 2: Add repo furniture and drop the /design route

**Files:**
- Create: `~/Workspace-personal/control-room/README.md`
- Create: `~/Workspace-personal/control-room/biome.json`
- Delete: `src/routes/design/` (4 files)
- Delete: `tests/ui/componentInventory.test.tsx`, `tests/ui/typeScaleMap.test.tsx`, `tests/ui/designTones.test.tsx`, `tests/ui/hardenOnboardGate.test.tsx`, `tests/ui/inventory-coverage.test.ts`
- Modify: `SKILL.md` (remove the design-gates reference that pointed into `dp-tooling`)

**Interfaces:**
- Consumes: Task 1's repo.
- Produces: a repo with no `/design` route and no dangling references to it.

**Context:** The app inherited lint config and README from `dp-tooling`. The `/design` gallery is dropped because the design system's Astro docs site owns that role. Some `/design` tests live in `tests/ui/` rather than under a `design/` directory — they are listed explicitly above.

- [ ] **Step 1: Confirm which tests reference the design route**

```bash
cd ~/Workspace-personal/control-room
grep -rln "routes/design\|component-inventory\|type-scale-map\|law-parts" tests/ src/
```

Expected: the five test files listed above, plus `src/routes/design/*` themselves. If the list differs, delete what this command reports instead of the hardcoded list.

- [ ] **Step 2: Delete the design route and its tests**

```bash
cd ~/Workspace-personal/control-room
git rm -r src/routes/design
git rm tests/ui/componentInventory.test.tsx tests/ui/typeScaleMap.test.tsx \
       tests/ui/designTones.test.tsx tests/ui/hardenOnboardGate.test.tsx \
       tests/ui/inventory-coverage.test.ts
```

- [ ] **Step 3: Check for now-dangling references**

```bash
grep -rn "routes/design\|/design" src/ tests/ SKILL.md | grep -v node_modules
```

Any hit in `src/ui/Shell.tsx` (a nav entry) or `SKILL.md` must be removed. Edit those files to drop the `/design` nav item and the design-gates link.

- [ ] **Step 4: Write the README**

```markdown
# control-room

A personal operational dashboard — sprint board, Claude session monitor, job
runner, notes, contacts and a reference catalogue — built on the
[Control Room design system](https://github.com/alebianco/control-room-design-system).

## Requirements

- Node 22+
- pnpm
- A sibling checkout of `control-room-design-system` (the UI packages are consumed
  via `pnpm.overrides` → `link:../control-room-design-system/packages/*`).

## Run

```bash
pnpm install
cp .env.example .env   # then fill in the tokens you need
pnpm dev               # http://localhost:4178
```

## Test

```bash
pnpm test        # full suite
pnpm typecheck   # tsc --noEmit
```

## Configuration

See `.env.example`. Every external dependency is env-configured; there are no
hardcoded workspace paths. The sprint is auto-detected from
`$SPRINT_DASHBOARD_ROOT/docs/sprint/DP*/` and can be overridden with
`SPRINT_OVERRIDE`.
```

- [ ] **Step 5: Copy the lint config from the design system**

```bash
cp ~/Workspace-personal/control-room-design-system/biome.json ~/Workspace-personal/control-room/biome.json
```

- [ ] **Step 6: Run the test suite to see the current state**

```bash
cd ~/Workspace-personal/control-room
pnpm install
pnpm test 2>&1 | tail -20
```

Expected: PASS. If any test fails, it references the deleted `/design` route — fix by deleting that test or its `/design` reference. Do not proceed until green.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: stand up control-room as a standalone repo

Drop the /design gallery — the design system's docs site owns that role now.
Add the README and lint config the app previously inherited from dp-tooling."
```

---

### Task 3: Link the design system packages

**Files:**
- Modify: `~/Workspace-personal/control-room/package.json`

**Interfaces:**
- Consumes: Task 2's green repo.
- Produces: `@alebianco/cr-components/qwik`, `@alebianco/cr-tokens/css`, `@alebianco/cr-styles/components` resolvable from the app. **Nothing imports them yet.**

**Context:** The design system is a sibling checkout, so `link:` relative paths work. Declaring normal semver deps plus a `pnpm.overrides` block means switching to published packages later is a one-block deletion.

**As of 2026-08-19 the overrides are load-bearing, not a convenience.** Nothing is
published: all packages are `0.0.0`, and the release workflow is gated off
(`vars.RELEASE_ENABLED`) and targets restricted GitHub Packages. The `^1.0.0` deps
below resolve from no registry today. Keep them — they document intent and make the
future switch a one-block deletion — but do not expect a registry fallback.

- [ ] **Step 0: Build the design system first (REQUIRED)**

`packages/components/dist/` is gitignored and untracked, so a fresh sibling
checkout has no `dist/frameworks/qwik/index.ts` for `link:` to resolve. Tokens
and styles ARE tracked, so only components needs this.

```bash
cd ~/Workspace-personal/control-room-design-system
pnpm install
pnpm run build
test -f packages/components/dist/frameworks/qwik/index.ts && echo OK || echo BUILD-FAILED
```

Expected: `OK`. Without it, Step 3's smoke test fails on resolution, not on contract.

- [ ] **Step 1: Add the dependencies and overrides**

Add to `package.json` `dependencies`:

```json
    "@alebianco/cr-components": "^1.0.0",
    "@alebianco/cr-icons": "^1.0.0",
    "@alebianco/cr-styles": "^1.0.0",
    "@alebianco/cr-tokens": "^1.0.0",
    "@alebianco/cr-utils": "^1.0.0",
```

And add this top-level block:

```json
  "pnpm": {
    "overrides": {
      "@alebianco/cr-components": "link:../control-room-design-system/packages/components",
      "@alebianco/cr-icons": "link:../control-room-design-system/packages/icons",
      "@alebianco/cr-styles": "link:../control-room-design-system/packages/styles",
      "@alebianco/cr-tokens": "link:../control-room-design-system/packages/tokens",
      "@alebianco/cr-utils": "link:../control-room-design-system/packages/utils"
    }
  }
```

- [ ] **Step 2: Install**

```bash
cd ~/Workspace-personal/control-room
pnpm install
```

- [ ] **Step 3: Write a resolution smoke test**

Create `tests/styles/ds-link.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);

describe('design system link', () => {
  it('resolves the qwik components to optimizer-processable source', () => {
    const p = require_.resolve('@alebianco/cr-components/qwik');
    // The optimizer cannot process pre-compiled JS in node_modules, so this
    // must land on the raw framework source.
    expect(p).toMatch(/dist[/\\]frameworks[/\\]qwik[/\\]index\.ts$/);
  });

  it('resolves both shipped theme stylesheets and the structure layer', () => {
    expect(require_.resolve('@alebianco/cr-tokens/structure.css')).toMatch(/structure\.css$/);
    expect(require_.resolve('@alebianco/cr-styles/components')).toMatch(/\.css$/);
  });
});
```

- [ ] **Step 4: Run it**

```bash
pnpm test tests/styles/ds-link.test.ts 2>&1 | tail -15
```

Expected: PASS. If the first test fails pointing at `dist/pkg/qwik`, the design system's `./qwik` export regressed — fix it there (see design-system commit `91ae1d4`), do not work around it here.

- [ ] **Step 5: Run the full suite**

```bash
pnpm test 2>&1 | tail -10
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml tests/styles/ds-link.test.ts
git commit -m "build: link the cr-* design system packages

Semver deps plus pnpm.overrides -> link: a sibling checkout, so switching to
published packages later is a one-block deletion. Nothing imports them yet."
```

---

### Task 4: Prove one design-system component renders in this app

**Files:**
- Create: `tests/ui/dsSmoke.test.tsx`

**Interfaces:**
- Consumes: Task 3's linked packages.
- Produces: proof the linked-Qwik path works *inside this app's own Vitest config*, before 373 call sites depend on it.

**Context:** This mirrors the Phase 0 spike but inside the real app. It is deliberately a separate task from any swap: if it fails, the problem is integration, not a prop contract.

- [ ] **Step 1: Write the smoke test**

Create `tests/ui/dsSmoke.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { createDOM } from '@builder.io/qwik/testing';
import { CrPanel, CrButton, CrStatusDot } from '@alebianco/cr-components/qwik';

describe('design system components under this app\'s Qwik config', () => {
  it('renders a panel with a nested button and status dot', async () => {
    const { screen, render } = await createDOM();
    await render(
      <CrPanel title="SPRINT" weight="major">
        <CrButton>RUN SCAN</CrButton>
        <CrStatusDot signal="work" label="working" />
      </CrPanel>,
    );
    const html = screen.innerHTML;
    expect(html).toContain('cr-panel--major');
    expect(html).toContain('SPRINT');
    expect(html).toContain('cr-btn');
    // the signal token and the accessible name, not just the class
    expect(html).toContain('--sig-work');
    expect(html).toContain('aria-label="working"');
  });
});
```

- [ ] **Step 2: Run it**

```bash
pnpm test tests/ui/dsSmoke.test.tsx 2>&1 | tail -20
```

Expected: PASS. If it fails with `Optimizer should replace all usages of $()`, the import resolved to compiled JS — re-check Task 3 Step 4.

- [ ] **Step 3: Commit**

```bash
git add tests/ui/dsSmoke.test.tsx
git commit -m "test: prove linked cr-components render under the app's Qwik config"
```

---

### Task 5: Phase 1 exit gate

**Files:** none (verification only).

**Interfaces:**
- Consumes: Tasks 1-4.
- Produces: a recorded known-good baseline.

- [ ] **Step 1: Full verification**

```bash
cd ~/Workspace-personal/control-room
pnpm install
pnpm typecheck
pnpm test 2>&1 | tail -15
```

Expected: typecheck clean, suite PASS. Record the passing test count — Phase 2 must never drop below it except for tests deliberately deleted with a stated reason.

- [ ] **Step 2: Confirm the app boots**

```bash
pnpm dev
```

Open <http://localhost:4178>. Confirm the sprint view renders. Stop the server.

- [ ] **Step 3: Tag the baseline**

```bash
git tag phase-1-baseline
git log --oneline -1
```

---

### Task 5b: Mount the cascade context (added 2026-08-19)

**Files:**
- Modify: `src/root.tsx`
- Create: `tests/ui/crContext.test.tsx`

**Interfaces:**
- Consumes: Task 4's proven render.
- Produces: a global `pt` / `locale` / `messages` tier available to every `Cr*`.

**Context:** The design system gained a cascade context after this plan was
written. There is **no `<CrProvider>` component and no global `dt` tier** — `dt`
stays per-component. Mounting is optional: every read is compiled to
`useContext(CrContext, null)`, so the app works without it. Mount it anyway, so
locale-aware components (`CrRelativeTime`, `CrCalendar`, `CrDateTime`,
`CrDataGrid`, `CrLineChart`) resolve one locale rather than each defaulting.

- [ ] **Step 1: Mount it in `src/root.tsx`**

```tsx
import { useContextProvider } from '@builder.io/qwik';
import { CrContext } from '@alebianco/cr-components/qwik';

// inside the root component$, before the returned tree:
useContextProvider(CrContext, { locale: 'en-GB', pt: {}, messages: {} });
```

- [ ] **Step 2: Assert a locale-aware component honours it**

Write `tests/ui/crContext.test.tsx` rendering `CrRelativeTime` under the provider
and asserting the **rendered string** reflects the mounted locale — not merely
that it rendered.

- [ ] **Step 3: Run and commit**

```bash
pnpm test tests/ui/crContext.test.tsx 2>&1 | tail -15
pnpm test 2>&1 | tail -10
git commit -am "feat(ui): mount the design system cascade context at root"
```

---

## Phase 2 — Port

### Task 6: Swap the token layer

**Files:**
- Delete: `src/styles/tokens.css`
- Create: `src/styles/app-tokens.css`
- Modify: `src/root.tsx` (stylesheet imports)
- Modify: `src/styles/global.css` (typography token references)
- Modify: `tests/styles/tokens.test.ts`, `tests/styles/theme-bridge.test.ts`, `tests/ui/tokenContract.test.ts`

**Interfaces:**
- Consumes: Task 5's baseline.
- Produces: `--ground`/`--panel`/`--sig-*`/`--type-*` all sourced from the design system; the 62 app-domain tokens defined in `app-tokens.css` and deriving from DS signals. Every later task depends on this.

**Context — the measured divergence.** The app's 129 tokens vs the DS's 277: only 30 names shared, and 16 of those carry different values. Three groups:

1. **31 typography tokens** — mechanical rename. The app's four flat families become one namespaced family:
   | App | Design system |
   | --- | --- |
   | `--type-body` | `--type-body-size` |
   | `--leading-body` | `--type-body-leading` |
   | `--tracking-body` | `--type-body-tracking` |
   | `--weight-body` | `--type-body-weight` |

   Roles: `display`, `h1`, `h2`, `body`, `data`, `label`, `meta`, `chrome`.

0. **Two DS tokens that did not exist when this plan was written.** `--focus`
   (split from `--sig-work`) and `--seam` (internal divider, split from the
   chassis-edge `--border`). Both are auto-derived for brands that omit them, so
   `control-room` needs no change — but the token audit must recognise them as
   **design-system** roles, not stray app tokens. Never redefine either in
   `app-tokens.css`.

2. **6 `--on-sig-*` tokens — DELETE, do not port.** They exist because the app's `--sig-idle` (`#5a5a78`) sat at 4.14:1. The DS lightened idle to `#848496`; all four signal/foreground pairings clear AA in both shipped schemes (worst 5.53:1). Replace every `var(--on-sig-work)` etc. with `var(--on-sig)`, except `--on-sig-err` → `var(--on-err)` and `--on-sig-idle` → `var(--on-idle)`.

3. **62 app-domain tokens — keep, in `app-tokens.css`.** The 8-route wayfinding ramp plus the issue/job/note/ref-card/status-dot symbology ramps. They stay because they key colour to route identity and to this app's Jira/note enums, not to state — putting them upstream would install a Law 2 counterexample in the system.

- [ ] **Step 1: Write the failing theme test**

Replace the body of `tests/styles/tokens.test.ts` with:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);
const read = (spec: string) => readFileSync(require_.resolve(spec), 'utf8');

function tokens(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)/g)) {
    if (!(m[1] in out)) out[m[1]] = m[2].trim();
  }
  return out;
}

const structure = read('@alebianco/cr-tokens/structure.css');
const dark = read('@alebianco/cr-tokens/themes/control-room.css');
const light = read('@alebianco/cr-tokens/themes/control-room-light.css');
const app = readFileSync(new URL('../../src/styles/app-tokens.css', import.meta.url), 'utf8');

function lin(c: number) {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}
function luminance(hex: string) {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => lin(parseInt(h.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const PAIRS: Array<[string, string]> = [
  ['--sig-work', '--on-sig'], ['--sig-wait', '--on-sig'], ['--sig-done', '--on-sig'],
  ['--sig-err', '--on-err'], ['--sig-idle', '--on-idle'], ['--sig-accent', '--on-accent'],
];

describe.each([['dark', dark], ['light', light]])('%s scheme', (_name, themeCss) => {
  const t = { ...tokens(structure), ...tokens(themeCss) };

  it('clears AA for ink and muted on ground', () => {
    expect(contrast(t['--ink'], t['--ground'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t['--muted'], t['--ground'])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(PAIRS)('clears AA for %s on %s', (sig, on) => {
    expect(contrast(t[sig], t[on])).toBeGreaterThanOrEqual(4.5);
  });
});

describe('app token layer', () => {
  const a = tokens(app);

  it('defines the 8-route wayfinding ramp', () => {
    for (const r of ['attention', 'sessions', 'sprint', 'jobs', 'notes', 'catalogue', 'contacts', 'settings']) {
      expect(a[`--acc-${r}`], `--acc-${r}`).toBeTruthy();
    }
  });

  it('never redefines a design system signal', () => {
    for (const k of Object.keys(a)) {
      expect(k).not.toMatch(/^--sig-/);
      expect(k).not.toMatch(/^--(ground|panel|ink|muted)$/);
    }
  });

  it('has dropped the obsolete per-signal foregrounds', () => {
    for (const k of Object.keys(a)) expect(k).not.toMatch(/^--on-sig-/);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
pnpm test tests/styles/tokens.test.ts 2>&1 | tail -15
```

Expected: FAIL — `src/styles/app-tokens.css` does not exist yet.

- [ ] **Step 3: Create the app token layer**

Create `src/styles/app-tokens.css`. Copy the 62 domain tokens out of the old `src/styles/tokens.css`, keeping their `var(--acc-*)` / `var(--sig-*)` derivations, and applying the `--on-sig-*` replacements from the Context above. The route accent *values* are set in Task 7 — for now carry the old hex values so this task is verifiable on its own.

```css
/* src/styles/app-tokens.css — the app-domain token layer.
 *
 * These are NOT design system tokens and deliberately stay here: they key colour
 * to route identity and to this app's Jira/note/job enums, not to machine state.
 * Promoting them into @alebianco/cr-tokens would install a Law 2 counterexample
 * (colour MUST bind to real state) in the vocabulary components are generated from.
 *
 * Everything here DERIVES from design system signals — never redefine --sig-*.
 */
:root {
  /* Wayfinding — one hue per route. Values re-seeded in Task 7 under the
     >=15deg-from-every-signal constraint. */
  --acc-attention: #ff3b6b;
  --acc-sessions: #22d3ee;
  --acc-sprint: #a855f7;
  --acc-jobs: #fb923c;
  --acc-notes: #5eead4;
  --acc-catalogue: #38bdf8;
  --acc-contacts: #a3e635;
  --acc-settings: #8a8aa6;

  /* Foreground on a filled route accent. One value: the accents are tuned in
     Task 7 so a single dark ink clears AA on all eight. */
  --on-acc-attention: var(--on-sig);
  --on-acc-sessions: var(--on-sig);
  --on-acc-sprint: var(--on-sig);
  --on-acc-jobs: var(--on-sig);
  --on-acc-notes: var(--on-sig);
  --on-acc-catalogue: var(--on-sig);
  --on-acc-contacts: var(--on-sig);
  --on-acc-settings: var(--on-sig);

  --section-accent-attention: var(--acc-attention);
  --section-accent-sessions: var(--acc-sessions);
  --section-accent-sprint: var(--acc-sprint);
  --section-accent-jobs: var(--acc-jobs);
  --section-accent-notes: var(--acc-notes);
  --section-accent-catalogue: var(--acc-catalogue);
  --section-accent-contacts: var(--acc-contacts);
  --section-accent-settings: var(--acc-settings);

  /* Issue stage symbology — this app's Jira workflow, keyed to DS signals. */
  --issue-stage-fill-todo: var(--sig-idle);
  --issue-stage-fill-ready: var(--sig-wait);
  --issue-stage-fill-progress: var(--sig-work);
  --issue-stage-fill-review: var(--sig-accent);
  --issue-stage-fill-blocked: var(--sig-err);
  --issue-stage-fill-done: var(--sig-done);
  --issue-stage-ink-todo: var(--on-idle);
  --issue-stage-ink-ready: var(--on-sig);
  --issue-stage-ink-progress: var(--on-sig);
  --issue-stage-ink-review: var(--on-accent);
  --issue-stage-ink-blocked: var(--on-err);
  --issue-stage-ink-done: var(--on-sig);

  /* Job outcomes. */
  --job-status-fill-ok: var(--sig-done);
  --job-status-fill-error: var(--sig-err);
  --job-status-fill-skipped: var(--sig-idle);
  --job-status-fill-timeout: var(--sig-wait);

  /* Note taxonomy. */
  --note-type-fill-bug: var(--sig-err);
  --note-type-fill-idea: var(--acc-sprint);
  --note-type-fill-info: var(--sig-work);
  --note-type-fill-question: var(--sig-wait);
  --note-type-fill-task: var(--sig-done);
  --note-priority-edge-high: var(--sig-err);
  --note-priority-edge-med: var(--sig-wait);
  --note-priority-edge-low: var(--sig-idle);

  /* Reference catalogue sources. */
  --ref-card-accent-jira: var(--acc-sprint);
  --ref-card-accent-confluence: var(--acc-catalogue);
  --ref-card-accent-figma: var(--acc-notes);
  --ref-card-accent-pr: var(--acc-jobs);
  --ref-card-accent-repo: var(--acc-catalogue);
  --ref-card-accent-person: var(--acc-attention);
  --ref-card-accent-url: var(--acc-settings);
  --ref-card-accent-ceremony: var(--acc-jobs);
  --ref-card-accent-calendar-event: var(--acc-sessions);

  /* Status dot fills — kept for the app's own .cr-* classes in global.css.
     CrStatusDot itself reads --sig-* directly and needs none of these. */
  --status-dot-fill-working: var(--sig-work);
  --status-dot-fill-waiting: var(--sig-wait);
  --status-dot-fill-idle: var(--sig-idle);
  --status-dot-fill-error: var(--sig-err);
  --status-dot-fill-done: var(--sig-done);
}
```

- [ ] **Step 4: Point the app at the design system stylesheets**

In `src/root.tsx`, replace the `tokens.css` import with the split consumption path — structure once, then exactly the two shipped themes:

```tsx
import '@alebianco/cr-tokens/structure.css';
import '@alebianco/cr-tokens/themes/control-room.css';
import '@alebianco/cr-tokens/themes/control-room-light.css';
import '@alebianco/cr-styles/components';
import './styles/app-tokens.css';
import './styles/global.css';
```

Order matters: structure → themes → component styles → app tokens → app styles.

- [ ] **Step 5: Delete the old token file**

```bash
cd ~/Workspace-personal/control-room
git rm src/styles/tokens.css
```

- [ ] **Step 6: Rewrite the typography token references**

```bash
cd ~/Workspace-personal/control-room
for role in display h1 h2 body data label meta chrome; do
  sed -i '' "s/var(--type-$role)/var(--type-$role-size)/g;
             s/var(--leading-$role)/var(--type-$role-leading)/g;
             s/var(--tracking-$role)/var(--type-$role-tracking)/g;
             s/var(--weight-$role)/var(--type-$role-weight)/g" \
    src/styles/global.css
done
grep -cE 'var\(--(leading|tracking|weight)-' src/styles/global.css
```

Expected: `0`. Any remaining hit is a role not in the list — map it the same way.

- [ ] **Step 7: Replace the obsolete per-signal foregrounds**

```bash
cd ~/Workspace-personal/control-room
sed -i '' 's/var(--on-sig-err)/var(--on-err)/g;
           s/var(--on-sig-idle)/var(--on-idle)/g;
           s/var(--on-sig-accent)/var(--on-accent)/g;
           s/var(--on-sig-work)/var(--on-sig)/g;
           s/var(--on-sig-wait)/var(--on-sig)/g;
           s/var(--on-sig-done)/var(--on-sig)/g' \
  src/styles/global.css src/styles/app-tokens.css
grep -rn 'on-sig-' src/ | grep -v node_modules
```

Expected: no output.

- [ ] **Step 8: Run the theme test**

```bash
pnpm test tests/styles/tokens.test.ts 2>&1 | tail -20
```

Expected: PASS.

- [ ] **Step 9: Fix the remaining style tests**

```bash
pnpm test tests/styles/ tests/ui/tokenContract.test.ts 2>&1 | tail -30
```

`theme-bridge.test.ts` and `tokenContract.test.ts` assert the *old* local contract. Update each failing assertion to the design system's names (`--type-<role>-size` etc.) and to the two shipped theme names. Delete any assertion that only checked a token the app no longer owns — and say so in the commit message.

- [ ] **Step 10: Run the full suite**

```bash
pnpm test 2>&1 | tail -20
```

Expected: PASS. Failures here are call sites reading a renamed token — fix them; do not weaken the test.

- [ ] **Step 11: Visual check of BOTH schemes**

```bash
pnpm dev
```

Open <http://localhost:4178>. Step through all 7 views in dark, then switch to light and repeat. The token arithmetic is verified but the *look* is not: light mode especially is untested against dense dashboard content, and a neon-noir instrument style is most likely to read wrong there. Note anything illegible or washed out — fixes belong in `global.css` or a follow-up task, never in `--sig-*`.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(styles)!: source tokens from the design system

Adopt the control-room brand's two schemes via the split consumption path.
Rename the 31 typography tokens to the DS's --type-<role>-<axis> family and
delete the 6 --on-sig-* tokens: they existed because the app's --sig-idle sat
at 4.14:1, and the DS fixed that in the palette (all pairings clear AA in both
schemes, worst 5.53:1).

The 62 app-domain tokens move to src/styles/app-tokens.css and now derive from
DS signals instead of redefining them. They stay app-local because they key
colour to route identity and to this app's Jira/note enums, not to state."
```

---

### Task 7: Re-seed the route accents under the signal-safety constraint

**Files:**
- Modify: `src/styles/app-tokens.css`
- Create: `tests/styles/route-accents.test.ts`

**Interfaces:**
- Consumes: Task 6's token layer.
- Produces: 8 route accents each ≥15° in OKLCH hue from every signal in both schemes and from each other.

**Context:** The current accents are **not** safe — measured against the DS signals, 5 of 8 collide: `contacts` is **1.0°** from `--sig-accent-2`, `sessions` 6.5° from `--sig-work`, `attention` 9.2° from `--sig-err`, `notes` 12.9° from `--sig-done`, `catalogue` 14.6° from `--sig-work`. A route accent that reads as the error colour makes the nav lie about state. Target hues (22.0° guaranteed separation, computed against both shipped schemes): 49, 102, 193, 241, 263, 286, 309, 332.

- [ ] **Step 1: Write the failing constraint test**

Create `tests/styles/route-accents.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);
const read = (s: string) => readFileSync(require_.resolve(s), 'utf8');

function tokens(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)/g)) {
    if (!(m[1] in out)) out[m[1]] = m[2].trim();
  }
  return out;
}

function srgbToLinear(c: number) {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

/** sRGB hex -> OKLCH hue in degrees, plus chroma. */
function oklch(hex: string): { C: number; h: number } {
  let s = hex.trim().replace(/^#/, '');
  if (s.length === 3) s = [...s].map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => srgbToLinear(parseInt(s.slice(i, i + 2), 16)));
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const t = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const cbrt = (v: number) => (v > 0 ? Math.cbrt(v) : -Math.cbrt(-v));
  const [l_, m_, s_] = [cbrt(l), cbrt(m), cbrt(t)];
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  return { C: Math.hypot(a, bb), h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 };
}

function hueDistance(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

const MIN_SEPARATION = 15;
const ROUTES = ['attention', 'sessions', 'sprint', 'jobs', 'notes', 'catalogue', 'contacts', 'settings'];

// --sig-idle is excluded on purpose: at C~0.03 it is near-achromatic, so its hue
// angle is not perceptually meaningful and would forbid a ~36deg band for nothing.
const SIGNALS = ['--sig-work', '--sig-wait', '--sig-done', '--sig-err', '--sig-accent', '--sig-accent-2', '--stage'];

const structure = tokens(read('@alebianco/cr-tokens/structure.css'));
const schemes = {
  dark: { ...structure, ...tokens(read('@alebianco/cr-tokens/themes/control-room.css')) },
  light: { ...structure, ...tokens(read('@alebianco/cr-tokens/themes/control-room-light.css')) },
};
const app = tokens(readFileSync(new URL('../../src/styles/app-tokens.css', import.meta.url), 'utf8'));

const signalHues = Object.values(schemes).flatMap((t) =>
  SIGNALS.map((s) => t[s]).filter((v) => v?.startsWith('#')).map((v) => oklch(v).h),
);

const accents = ROUTES.map((r) => {
  const v = app[`--acc-${r}`];
  if (!v?.startsWith('#')) throw new Error(`--acc-${r} must be a literal hex, got: ${v}`);
  return { route: r, hue: oklch(v).h };
});

describe('route accents never read as machine state', () => {
  it.each(accents)('$route keeps >=15deg from every signal hue', ({ route, hue }) => {
    const nearest = Math.min(...signalHues.map((h) => hueDistance(hue, h)));
    expect(nearest, `--acc-${route} is ${nearest.toFixed(1)}deg from a signal`)
      .toBeGreaterThanOrEqual(MIN_SEPARATION);
  });

  it('keeps every pair of route accents >=15deg apart', () => {
    for (let i = 0; i < accents.length; i++) {
      for (let j = i + 1; j < accents.length; j++) {
        const d = hueDistance(accents[i].hue, accents[j].hue);
        expect(d, `${accents[i].route} vs ${accents[j].route}`).toBeGreaterThanOrEqual(MIN_SEPARATION);
      }
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
pnpm test tests/styles/route-accents.test.ts 2>&1 | tail -25
```

Expected: FAIL on `contacts` (~1°), `sessions` (~6.5°), `attention` (~9.2°), `notes` (~12.9°), `catalogue` (~14.6°). This proves the test has teeth against the real palette.

- [ ] **Step 3: Re-seed the accents**

Replace the eight `--acc-*` values in `src/styles/app-tokens.css`. These were
generated in OKLCH at the target hues, then gamut-checked and verified against both
shipped schemes — hue drift ≤1°, ≥21.8° from every signal, 20.3° minimum pairwise,
and AA ≥5.15:1 against `--on-sig`:

```css
  --acc-attention: #d06212;   /*  49deg  27.1deg from nearest signal  AA 5.26:1 */
  --acc-sessions:  #ad9a00;   /* 101deg  23.5deg  AA 7.15:1 */
  --acc-sprint:    #00a2a0;   /* 193deg  24.7deg  AA 6.45:1 */
  --acc-jobs:      #0098e6;   /* 242deg  24.4deg  AA 6.41:1 */
  --acc-notes:     #5182e5;   /* 263deg  44.7deg  AA 5.48:1 */
  --acc-catalogue: #8074e1;   /* 286deg  67.7deg  AA 5.32:1 */
  --acc-contacts:  #a267ce;   /* 309deg  45.1deg  AA 5.19:1 */
  --acc-settings:  #bc5db0;   /* 332deg  21.8deg  AA 5.15:1 */
```

**Do not hand-convert OKLCH to hex.** An earlier draft of this plan did and produced
three swatches that collided with signals — one at 0.8°, worse than the palette being
replaced. If these values ever need regenerating, use
`docs/superpowers/specs/assets/` in the design-system repo rather than eyeballing them.

- [ ] **Step 4: Run the constraint test**

```bash
pnpm test tests/styles/route-accents.test.ts 2>&1 | tail -20
```

Expected: PASS. If a hue is off, adjust that swatch's hue while holding L and C, then re-run — do not lower `MIN_SEPARATION`.

- [ ] **Step 5: Verify the accent foregrounds still clear AA**

Add to `tests/styles/route-accents.test.ts`:

```ts
describe('a filled route accent stays readable', () => {
  function lin(c: number) {
    const x = c / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  }
  function luminance(hex: string) {
    let h = hex.trim().replace(/^#/, '');
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    const [r, g, b] = [0, 2, 4].map((i) => lin(parseInt(h.slice(i, i + 2), 16)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  const contrast = (a: string, b: string) => {
    const x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };

  it.each(ROUTES)('%s accent clears AA against --on-sig in both schemes', (route) => {
    for (const t of Object.values(schemes)) {
      expect(contrast(app[`--acc-${route}`], t['--on-sig'])).toBeGreaterThanOrEqual(4.5);
    }
  });
});
```

```bash
pnpm test tests/styles/route-accents.test.ts 2>&1 | tail -20
```

Expected: PASS. If a swatch fails, lower its OKLCH L until it clears — brightness is free to move, hue is not.

- [ ] **Step 6: Run the full suite**

```bash
pnpm test 2>&1 | tail -15
```

Expected: PASS.

- [ ] **Step 7: Visual check of the nav in both schemes**

```bash
pnpm dev
```

Confirm each of the 7 routes shows a distinct rail accent and that none reads as an error or a "working" state. Check both schemes.

- [ ] **Step 8: Commit**

```bash
git add src/styles/app-tokens.css tests/styles/route-accents.test.ts
git commit -m "fix(styles): re-seed route accents away from the signal ramp

The old accents collided with machine state: contacts sat 1.0deg from
--sig-accent-2 and attention 9.2deg from --sig-err in OKLCH hue, so the nav
could read as an error. Re-seed all eight at >=15deg from every signal in both
schemes and from each other (22deg achieved), and gate it with a test that
fails on the old palette."
```

---

### Task 8: Swap StatusDot → CrStatusDot

**Files:**
- Delete: `src/ui/StatusDot.tsx`
- Modify: `src/ui/index.ts`, and the 5 files using `<StatusDot`
- Modify: `tests/ui/symbology.test.tsx`

**Interfaces:**
- Consumes: Task 6's tokens.
- Produces: `CrStatusDot` in use. `STATE_COLOR` / `stateColor` must survive — other widgets import them for chips.

**Context — the drift that fails silently.** This is the smallest swap and the clearest trap, which is why it goes first:

| Local `StatusDot` | `CrStatusDot` |
| --- | --- |
| `state="working"` | `signal="work"` |
| `state="waiting"` | `signal="wait"` |
| `state="idle"` | `signal="idle"` |
| `state="error"` | `signal="err"` |
| `state="done"` | `signal="done"` |
| (no label) | `label` is **required** |
| `icon?: boolean` | **no equivalent** |

Passing the old prop name renders `--sig-idle` with no `aria-label` **and the test still passes** — verified during design. Note the value renames too: `working`→`work`, `waiting`→`wait`, `error`→`err`.

`icon` has no `CrStatusDot` equivalent. It adds shape as a non-colour a11y channel, so it must not be silently dropped: keep a small app-local `StatusIcon` wrapper for the icon variant.

- [ ] **Step 1: Find every call site**

```bash
cd ~/Workspace-personal/control-room
grep -rn '<StatusDot' src/ | grep -v node_modules
grep -rn 'STATE_COLOR\|stateColor' src/ tests/ | grep -v node_modules
```

Record which call sites pass `icon`.

- [ ] **Step 2: Write the failing test**

Replace the `StatusDot` block in `tests/ui/symbology.test.tsx` with:

```tsx
import { describe, it, expect } from 'vitest';
import { createDOM } from '@builder.io/qwik/testing';
import { CrStatusDot } from '@alebianco/cr-components/qwik';
import { STATE_COLOR, stateColor } from '../../src/ui/statusColor';

describe('CrStatusDot carries state as colour AND as an accessible name', () => {
  it.each([
    ['work', '--sig-work'],
    ['wait', '--sig-wait'],
    ['done', '--sig-done'],
    ['err', '--sig-err'],
    ['idle', '--sig-idle'],
  ] as const)('signal=%s paints %s', async (signal, token) => {
    const { screen, render } = await createDOM();
    await render(<CrStatusDot signal={signal} label={signal} />);
    expect(screen.innerHTML).toContain(token);
    expect(screen.innerHTML).toContain(`aria-label="${signal}"`);
  });

  it('keeps one colour language between a dot and a chip', () => {
    expect(stateColor('working')).toBe(STATE_COLOR.working);
    expect(STATE_COLOR.working).toBe('var(--sig-work)');
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

```bash
pnpm test tests/ui/symbology.test.tsx 2>&1 | tail -15
```

Expected: FAIL — `src/ui/statusColor.ts` does not exist.

- [ ] **Step 4: Extract the colour map**

Create `src/ui/statusColor.ts` — the state→token map outlives the component, because chips beside a dot must agree with it:

```ts
/** The app's state vocabulary. Wider than the design system's signal names
 *  because the data sources speak in these words. */
export type State = 'working' | 'waiting' | 'idle' | 'error' | 'done';

/** app state -> design system signal name */
export const STATE_SIGNAL: Record<State, 'work' | 'wait' | 'idle' | 'err' | 'done'> = {
  working: 'work',
  waiting: 'wait',
  idle: 'idle',
  error: 'err',
  done: 'done',
};

/** Exported so a state chip can carry the same colour as the dot beside it.
 *  A chip and a dot disagreeing about one state is worse than an uncoloured chip. */
export const STATE_COLOR: Record<State, string> = {
  working: 'var(--sig-work)',
  waiting: 'var(--sig-wait)',
  idle: 'var(--sig-idle)',
  error: 'var(--sig-err)',
  done: 'var(--sig-done)',
};

export function stateColor(value: string): string | undefined {
  return STATE_COLOR[value as State];
}
```

- [ ] **Step 5: Add the icon-variant wrapper**

Create `src/ui/StatusIcon.tsx` — `CrStatusDot` has no `icon` prop, and shape is a non-colour a11y channel we must not lose:

```tsx
import { component$ } from '@builder.io/qwik';
import { CrIcon } from './CrIcon';
import type { State } from './statusColor';

/** The icon variant of a status indicator: shape as a second a11y channel so
 *  state is never colour-only. CrStatusDot covers the plain dot; this covers the
 *  glyph, which the design system has no equivalent for. */
export const StatusIcon = component$<{ state: State }>(({ state }) => (
  <span data-state={state} class="cr-status-dot--ink inline-flex items-center justify-center align-middle">
    <CrIcon name={state} size={14} label={state} />
  </span>
));
```

- [ ] **Step 6: Run the test**

```bash
pnpm test tests/ui/symbology.test.tsx 2>&1 | tail -15
```

Expected: PASS.

- [ ] **Step 7: Migrate the call sites**

For each file from Step 1:
- `<StatusDot state="working" />` → `<CrStatusDot signal="work" label="working" />`
- `<StatusDot state={x} />` → `<CrStatusDot signal={STATE_SIGNAL[x]} label={x} />`
- `<StatusDot state={x} icon />` → `<StatusIcon state={x} />`

Import `CrStatusDot` from `@alebianco/cr-components/qwik`; import `STATE_SIGNAL` from `./statusColor`. **Always pass `label`** — it is required and its absence is silent.

- [ ] **Step 8: Delete the old component and update the barrel**

```bash
cd ~/Workspace-personal/control-room
git rm src/ui/StatusDot.tsx
```

In `src/ui/index.ts`, replace the `StatusDot` export line with:

```ts
export { StatusIcon } from './StatusIcon';
export { STATE_COLOR, STATE_SIGNAL, stateColor, type State } from './statusColor';
```

- [ ] **Step 9: Run the full suite**

```bash
pnpm test 2>&1 | tail -20
pnpm typecheck
```

Expected: PASS and clean. A typecheck error naming `state` on `CrStatusDot` is a missed call site.

- [ ] **Step 10: Verify no call site lost its label**

```bash
grep -rn 'CrStatusDot' src/ | grep -v 'label=' | grep -v node_modules
```

Expected: no output.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "refactor(ui)!: swap StatusDot for CrStatusDot

The contracts differ in three ways that all fail silently: the prop is signal
not state, the values are renamed (working->work, error->err), and label is
required. Passing the old props renders --sig-idle with no aria-label while
tests still pass.

Extract STATE_COLOR/STATE_SIGNAL to statusColor.ts so chips keep agreeing with
dots, and keep the icon variant as StatusIcon — CrStatusDot has no icon prop
and shape is a non-colour a11y channel."
```

---

### Task 9: Swap Panel → CrPanel

**Files:**
- Delete: `src/ui/Panel.tsx`
- Create: `src/ui/AppPanel.tsx`
- Modify: `src/ui/index.ts`, and the 23 files using `<Panel`
- Modify: `tests/ui/panel.test.tsx`

**Interfaces:**
- Consumes: Task 6's tokens.
- Produces: `AppPanel` — a thin wrapper over `CrPanel` supplying the app-only behaviour. Call sites keep using one component.

**Context — this is the largest swap: 83 call sites across 23 files.** The contracts diverge substantially:

| Local `Panel` | `CrPanel` | Resolution |
| --- | --- | --- |
| `title` | `title` | direct |
| `inset` | `inset` | direct |
| — | `weight: "default" \| "major"` | new, optional |
| `crosshairs` | — | wrapper keeps it |
| `chromeSeed` | — | wrapper keeps it |
| `scroll` | — | wrapper keeps it |
| `flush` | — | wrapper keeps it |
| `accent` | — | wrapper maps to `dt` |
| `class` | `pt`/`dt` | wrapper maps it |

**Corrected 2026-08-19:** `CrPanel` now ships `marks?: boolean`, plus `eyebrow`,
`index`, `lede`, `footer`, `tone`, `bleed` and `ambient`. So `crosshairs` (marks
on/off) is now covered upstream and should map to `CrPanel marks`. But `marks` is
a **static boolean** applying the `.cr-mark` preset — it does NOT carry the app's
`chromeSeed`, which varies the marks per panel by hashing the title. So four
props, not five, remain genuinely app-local: `chromeSeed`, `scroll`, `flush`,
`accent`. The wrapper still earns its place; update the mapping table row for
`crosshairs` from "wrapper keeps it" to "→ `CrPanel marks`".

Four props have no `CrPanel` equivalent. They are real app behaviour (scroll containment, per-panel seeded mark variation, route accent) — **not** dead weight. Rather than 83 call-site rewrites plus five upstream features, wrap: `AppPanel` renders `CrPanel` for the frame and title and adds the app's own concerns around it.

This is the one place a wrapper is right. Elsewhere prefer the bare `Cr*` component.

- [ ] **Step 1: Read the current implementation and its test**

```bash
cd ~/Workspace-personal/control-room
cat src/ui/Panel.tsx
cat tests/ui/panel.test.tsx
grep -rn '<Panel' src/ | grep -v node_modules | wc -l    # expect 83
```

- [ ] **Step 2: Write the failing test**

Replace `tests/ui/panel.test.tsx` with:

```tsx
import { describe, it, expect } from 'vitest';
import { createDOM } from '@builder.io/qwik/testing';
import { AppPanel } from '../../src/ui/AppPanel';

describe('AppPanel', () => {
  it('renders the design system panel frame and its title', async () => {
    const { screen, render } = await createDOM();
    await render(<AppPanel title="Sessions"><p>body</p></AppPanel>);
    const html = screen.innerHTML;
    expect(html).toContain('cr-panel');
    expect(html).toContain('Sessions');
    expect(html).toContain('body');
  });

  it('marks a major panel through the design system weight', async () => {
    const { screen, render } = await createDOM();
    await render(<AppPanel title="Sprint" weight="major"><p>x</p></AppPanel>);
    expect(screen.innerHTML).toContain('cr-panel--major');
  });

  it('uses the design system inset variant for a nested panel', async () => {
    const { screen, render } = await createDOM();
    await render(<AppPanel inset><p>x</p></AppPanel>);
    expect(screen.innerHTML).toContain('cr-panel--inset');
  });

  // The registration marks are app-local (src/ui/Crosshair.tsx) and emit `cr-mark`.
  it('shows corner marks by default for a titled panel and none when untitled', async () => {
    const a = await createDOM();
    await a.render(<AppPanel title="Jobs"><p>x</p></AppPanel>);
    expect(a.screen.innerHTML).toContain('cr-mark');

    const b = await createDOM();
    await b.render(<AppPanel><p>x</p></AppPanel>);
    expect(b.screen.innerHTML).not.toContain('cr-mark');
  });

  it('contains scrolling in the body so the title stays put', async () => {
    const { screen, render } = await createDOM();
    await render(<AppPanel title="Feed" scroll><p>x</p></AppPanel>);
    expect(screen.innerHTML).toContain('overflow');
  });

  it('carries a route accent as a scoped custom property, never a signal', async () => {
    const { screen, render } = await createDOM();
    await render(<AppPanel title="Notes" accent="var(--acc-notes)"><p>x</p></AppPanel>);
    const html = screen.innerHTML;
    expect(html).toContain('--acc-notes');
    expect(html).not.toContain('--sig-');
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

```bash
pnpm test tests/ui/panel.test.tsx 2>&1 | tail -15
```

Expected: FAIL — `src/ui/AppPanel.tsx` does not exist.

- [ ] **Step 4: Write the wrapper**

Create `src/ui/AppPanel.tsx`. Copy the crosshair/scroll/flush/accent logic verbatim out of the old `src/ui/Panel.tsx` — it is app behaviour and must not be re-derived — and delegate the frame and title to `CrPanel`:

```tsx
import { component$, Slot } from '@builder.io/qwik';
import { CrPanel } from '@alebianco/cr-components/qwik';
import { cn, type ClassValue } from './cn';
import { CrosshairCorners } from './Crosshair';

export interface AppPanelProps {
  title?: string;
  /** Design system visual weight. */
  weight?: 'default' | 'major';
  /** Nested sub-panel — shadowless, per Law 1. */
  inset?: boolean;
  /**
   * Corner registration marks. On by default for a titled panel — chrome is what
   * makes the frame read as hardware, and opting in per call site left 29 of 33
   * panels bare. An untitled panel has no seed, so it stays off.
   */
  crosshairs?: boolean;
  /** Defaults to `title`; set it where two panels share a title but not a mark. */
  chromeSeed?: string;
  /** Scrolls its body only, so the title stays readable while the list moves. */
  scroll?: boolean;
  /**
   * Fills its parent but scrolls nothing itself — for a body with both pinned
   * chrome and a scrolling region, where `scroll` would carry the chrome away.
   */
  flush?: boolean;
  /** A route accent (`var(--acc-*)`). NEVER a signal: the frame is wayfinding. */
  accent?: string;
  class?: ClassValue;
}

/**
 * The app's panel. CrPanel supplies the frame, title and weight; this adds the
 * five app-only concerns the design system has no equivalent for — corner marks
 * seeded from the title, body-only scrolling, flush fill, and the route accent.
 */
export const AppPanel = component$<AppPanelProps>(
  ({ title, weight, inset, crosshairs, chromeSeed, scroll, flush, accent, class: klass }) => {
    const seed = chromeSeed ?? title;
    const chromeOn = crosshairs ?? Boolean(seed);

    return (
      <div
        class={cn('cr-typo-container relative', (scroll || flush) && 'flex flex-col min-h-0 overflow-hidden', klass)}
        style={accent ? { '--cr-panel-accent': accent } : undefined}
      >
        <CrPanel
          title={title}
          weight={weight}
          inset={inset}
          pt={{ root: { class: cn((scroll || flush) && 'flex flex-col min-h-0 overflow-hidden') } }}
        >
          <div class={cn(scroll && 'overflow-y-auto min-h-0 flex-1')}>
            <Slot />
          </div>
        </CrPanel>
        {chromeOn && seed ? <CrosshairCorners seed={seed} /> : null}
      </div>
    );
  },
);
```

- [ ] **Step 5: Run the test**

```bash
pnpm test tests/ui/panel.test.tsx 2>&1 | tail -25
```

Expected: PASS. If the accent test fails, check the wrapper is not leaking a `--sig-*` into the style attribute.

- [ ] **Step 6: Migrate the call sites**

```bash
cd ~/Workspace-personal/control-room
grep -rl '<Panel' src/ | xargs sed -i '' 's/<Panel\b/<AppPanel/g; s|</Panel>|</AppPanel>|g'
grep -rl "from '\(\.\./\)*ui/Panel'\|from './Panel'" src/ | \
  xargs sed -i '' "s|/Panel'|/AppPanel'|g; s/\bPanel\b/AppPanel/g"
grep -rn '<Panel\b' src/ | grep -v node_modules
```

Expected: no output from the last command. Then fix imports that come via the barrel:

```bash
grep -rn 'Panel' src/ui/index.ts
```

- [ ] **Step 7: Delete the old component and update the barrel**

```bash
git rm src/ui/Panel.tsx
```

In `src/ui/index.ts`, replace the `Panel` export with:

```ts
export { AppPanel, type AppPanelProps } from './AppPanel';
```

- [ ] **Step 8: Run the full suite and typecheck**

```bash
pnpm test 2>&1 | tail -25
pnpm typecheck
```

Expected: PASS and clean. Fix any straggling `Panel` reference.

- [ ] **Step 9: Visual check — the panel is on every view**

```bash
pnpm dev
```

Step through all 7 views in both schemes. Confirm titles render, corner marks appear on titled panels, scrolling panels keep their title pinned, and nested panels stay shadowless.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "refactor(ui)!: build the app panel on CrPanel

CrPanel supplies the frame, title and weight. Five app-only props have no
design system equivalent — crosshairs, chromeSeed, scroll, flush, accent — and
they are real behaviour (corner marks seeded from the title, body-only
scrolling, the route accent), so AppPanel wraps rather than drops them.

Wrapping beats 83 call-site rewrites plus five upstream features. This is the
one place a wrapper is right; elsewhere prefer the bare Cr* component."
```

---

### Task 10: Swap Button → CrButton

**Files:**
- Delete: `src/ui/Button.tsx`
- Modify: `src/ui/index.ts`, and the 24 files using `<Button`
- Modify: `tests/ui/button.test.tsx`

**Interfaces:**
- Consumes: Task 6's tokens.
- Produces: `CrButton` used directly, no wrapper.

**Context — 61 call sites, and the mapping is a semantic split.** The local `tone` conflates visual gravity with colour; `CrButton` separates them into `emphasis` (form) and `signal` (colour). The actual tones in use:

| Local `tone` | Uses | `CrButton` |
| --- | --- | --- |
| `secondary` | 18 | `emphasis="outline"` |
| `quiet` | 5 | `emphasis="ghost"` |
| `danger` | 4 | `emphasis="outline" signal="err"` |
| `bare` | 3 | `emphasis="link"` |
| `danger-solid` | 1 | `emphasis="solid" signal="err"` |
| `primary` | default | `emphasis="solid"` |

Sizes: `control` → `md`, `compact` → `sm`. `icon` has no equivalent — use `size="sm"` and keep the icon-only padding via `pt`.

The local `Button` also takes a required `label` (the accessible name, and the visible text unless `text` overrides). `CrButton` renders `children` and has no `label`, so each call site needs its accessible name preserved: text buttons pass children; icon-only buttons need an explicit `aria-label` via `pt`.

- [ ] **Step 1: Inventory the call sites**

```bash
cd ~/Workspace-personal/control-room
grep -rn '<Button' src/ | grep -v node_modules > /tmp/button-sites.txt
wc -l /tmp/button-sites.txt          # expect ~61
grep -c 'icon' /tmp/button-sites.txt  # icon-only sites needing aria-label
```

- [ ] **Step 2: Write the failing test**

Replace `tests/ui/button.test.tsx` with:

```tsx
import { describe, it, expect } from 'vitest';
import { createDOM } from '@builder.io/qwik/testing';
import { CrButton } from '@alebianco/cr-components/qwik';

describe('CrButton separates gravity from colour', () => {
  it('renders a solid primary by default with its text as the accessible name', async () => {
    const { screen, render } = await createDOM();
    await render(<CrButton>RUN SCAN</CrButton>);
    const html = screen.innerHTML;
    expect(html).toContain('cr-btn');
    expect(html).toContain('RUN SCAN');
    expect(html).toContain('type="button"');
  });

  it('renders a destructive secondary as outline + err, not a solid red', async () => {
    const { screen, render } = await createDOM();
    await render(<CrButton emphasis="outline" signal="err">DELETE</CrButton>);
    const html = screen.innerHTML;
    expect(html).toContain('cr-btn--outline');
    expect(html).toContain('cr-btn--sig-err');
  });

  it('becomes a real anchor when given an href', async () => {
    const { screen, render } = await createDOM();
    await render(<CrButton href="/sprint">SPRINT</CrButton>);
    const html = screen.innerHTML;
    expect(html).toContain('<a');
    expect(html).toContain('href="/sprint"');
  });

  it('keeps an accessible name on an icon-only control', async () => {
    const { screen, render } = await createDOM();
    await render(<CrButton size="sm" pt={{ root: { 'aria-label': 'Refresh' } }}>{''}</CrButton>);
    expect(screen.innerHTML).toContain('aria-label="Refresh"');
  });
});
```

- [ ] **Step 3: Run it to verify it fails or reveals the real class names**

```bash
pnpm test tests/ui/button.test.tsx 2>&1 | tail -25
```

If a class assertion fails, read the actual output and correct the expectation to the real `cr-btn` modifier names — do not weaken the test to `toContain('cr-btn')` alone. Check the emitted names:

```bash
grep -n 'cr-btn--' ~/Workspace-personal/control-room-design-system/packages/styles/styles/components.css | head -20
```

- [ ] **Step 4: Migrate the call sites**

Work file by file from `/tmp/button-sites.txt`. For each `<Button>`:

1. Map `tone` → `emphasis` (+ `signal`) using the table above. No `tone` means `emphasis="solid"`.
2. Map `size`: `control`→`md`, `compact`→`sm`, `icon`→`sm`.
3. Move `label` to children. If the button is icon-only, keep the name as `pt={{ root: { 'aria-label': '<label>' } }}`.
4. `onClick$` stays `onClick$`.
5. Import `CrButton` from `@alebianco/cr-components/qwik`.

- [ ] **Step 5: Verify no accessible name was dropped**

```bash
cd ~/Workspace-personal/control-room
grep -rn '<CrButton' -A3 src/ | grep -B1 'CrIcon' | grep -v 'aria-label' | head
```

Every icon-only button must carry an `aria-label`. Fix any that do not.

- [ ] **Step 6: Delete the old component and update the barrel**

```bash
git rm src/ui/Button.tsx
```

Remove the `Button` line from `src/ui/index.ts`.

- [ ] **Step 7: Run the full suite and typecheck**

```bash
pnpm test 2>&1 | tail -25
pnpm typecheck
```

Expected: PASS and clean.

- [ ] **Step 8: Visual check**

```bash
pnpm dev
```

Confirm in both schemes: primary buttons keep the offset chassis shadow, destructive controls read as outlined red rather than solid red, and every icon button is reachable by keyboard with a sensible screen-reader name.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor(ui)!: swap Button for CrButton

The local tone axis conflated visual gravity with colour; CrButton splits them
into emphasis (form) and signal (colour), so tone=danger becomes
emphasis=outline signal=err. The local required label prop is gone: text
buttons pass children and icon-only buttons keep an explicit aria-label, so no
control loses its accessible name."
```

---

### Task 11: Swap the remaining direct-map primitives

**Files:** one commit per primitive. Delete `src/ui/<Name>.tsx`, modify `src/ui/index.ts`, its call sites, and its test.

**Interfaces:**
- Consumes: Tasks 6-10.
- Produces: the design system in use for every primitive with a true counterpart.

**Context:** These are the primitives whose contracts are close enough to swap without a wrapper. Ordered by ascending call-site count so the cheap, low-risk ones land first and any systemic problem surfaces early.

| Order | Local | → | Sites | Drift since this plan was written |
| --- | --- | --- | --- | --- |
| 1 | `FrameBox` | `CrBezel` | 1 | — |
| 2 | `TelemetryStrip` | `CrTelemetry` | 1 | — |
| 3 | `Chip` | `CrChip` | 3 | ⚠ `tone=` → `signal=`; `tone="alt"` → `signal="work"` |
| 4 | `ScrollColumn` | `CrScrollArea` | 3 | — |
| 5 | `Cheatsheet` / `Kbd` | `CrKeyHints` / `CrKbd` | 8 | ⚠ `CrKeyHints` gained `hints: {keys,label}[]` — it had no key API when this plan was written |
| 6 | `PixelCat` | `CrCat` | 4 | — |
| 7 | `Avatar` | `CrAvatar` | 5 | — |
| 8 | `OptionSearch` | `CrCombobox` | 2 | — |
| 9 | `Dialog` / `ConfirmDialog` | `CrModal` | 11 | ⚠ overlay siblings use `placement=`, not `align=`; `CrModal` takes `labels?` |
| 10 | `StackBar` / `BarList` / `Sparkline` | `CrStackedBar` / `CrBarChart` / `CrSparkline` | 7 | — |
| 11 | `OverflowToggle` | `CrOverflow` | 6 | — |
| 12 | `RelativeTime` | `CrRelativeTime` | 7 | ⚠ now locale-aware via `CrContext` (Task 5b) |
| 13 | `IconToggle` | `CrToggleChip` | 5 | ⚠ `count=` → `badge=` |
| 14 | `ToggleChip` | `CrToggleChip` | 16 | ⚠ `count=` → `badge=` (`badge={true}` renders a bare dot) |
| 15 | `ErrorState` | `CrDrip` | 10 | — |
| 16 | `Hero` | `CrHero` | 10 | — |
| 17 | `Field` / `SelectField` | `CrField` / `CrInput` / `CrSelect` | 16 | ⚠ leaf controls gained `invalid?` (a11y only, never for looks); `CrInput` gained `icon`/`clearable`/`onClear` |
| 18 | `CronField` | `CrCronField` | 3 | — |
| 19 | `FilterBar` | `CrToolbar` | 6 | — |
| 20 | `MasterDetail` | `CrResizable` | 4 | — |
| 21 | `EmptyState` | `CrEmptyState` | 25 | — |
| 22 | `CrIcon` | `CrIcon` | 20 | — |
| 23 | `ToastStack` | `CrToastRegion` / `CrToast` | 2 | ⚠ 9 anchors not 4; toasts dedup; `onDismiss` fires `newestId`; takes `labels?` |
| 24 | `Shell` | `CrMasthead` + `CrNav` | 1 | — |

**Note on `ErrorState` (#15).** It maps to `CrDrip`, not `CrAlert`: the app's
error surface floods with `--sig-err` and carries Law 3's drip, which is exactly
`CrDrip`'s job. The design system's drip was fixed upstream first (commit
`ff278ca`) — it had been painting liquid `--sig-err` blobs instead of the vertical
`--drip` glitch the law specifies, and the app's version was the correct one. The
T1/T2/T3 glitch tiers moved upstream in the same commit, so **delete the app's
local `.cr-drip` and `.cr-glitch-t*` blocks from `global.css` during this swap**
rather than keeping a local copy. The app's `detail` prop becomes `sub`.

Verified safe: after Task 2 removes `/design`, `ErrorState` is the *only*
consumer of those classes in the app, so the local CSS is fully dead once
swapped. Law 3 also allows the drip on the masthead — if a masthead drip is
wanted later, apply `.cr-drip` from the style layer rather than re-adding the
local block.

**For each primitive, run this cycle. Do not batch.**

- [ ] **Step 1: Read both contracts before touching a call site**

```bash
cd ~/Workspace-personal/control-room
cat src/ui/<Name>.tsx
cat ~/Workspace-personal/control-room-design-system/packages/components/components/<CrName>.lite.tsx
```

Write down every prop that renames, changes meaning, or becomes required. **Do not assume the local API carries over** — `StatusDot`'s `state`→`signal` + required `label` is the pattern, not the exception.

- [ ] **Step 2: Find the call sites**

```bash
grep -rn '<<Name>' src/ | grep -v node_modules
```

- [ ] **Step 3: Rewrite the test to assert rendered output**

Update `tests/ui/<name>.test.tsx` to import the `Cr*` component and assert on the **rendered result** — the specific token, the specific ARIA attribute, the specific class — not merely that something rendered. Follow Task 8's test as the model.

- [ ] **Step 4: Run the test to verify it fails**

```bash
pnpm test tests/ui/<name>.test.tsx 2>&1 | tail -15
```

Expected: FAIL. If it passes before any change, it is not asserting anything specific enough — strengthen it.

- [ ] **Step 5: Migrate the call sites and delete the local component**

```bash
git rm src/ui/<Name>.tsx
```

Update `src/ui/index.ts`. Where the design system genuinely lacks something the app needs, **fix it upstream** in `control-room-design-system` as its own commit in that repo — never shim locally. (`AppPanel` in Task 9 is the sole sanctioned wrapper.)

**That upstream commit MUST include a `.changeset/*.md`** — this port validates the
unreleased 1.0.0, so an unversioned fix ships silently or blocks the release. Nothing
is published yet, so a `major` bump is nearly free: prefer breaking the contract
properly over shimming around it. Rebuild the design system afterwards
(`pnpm run build`) or the linked app will not see the change.

- [ ] **Step 6: Run the test, the suite, and typecheck**

```bash
pnpm test tests/ui/<name>.test.tsx 2>&1 | tail -15
pnpm test 2>&1 | tail -15
pnpm typecheck
```

Expected: all PASS, typecheck clean.

- [ ] **Step 7: Commit — one primitive only**

```bash
git add -A
git commit -m "refactor(ui)!: swap <Name> for <CrName>

<State the prop drift explicitly: what renamed, what became required, what has
no equivalent and how it was handled.>"
```

---

### Task 12: Decide the four leftovers

**Files:**
- Possibly modify: `src/ui/BracketLabel.tsx`, `src/ui/RefCard.tsx`, `src/ui/SourceHeader.tsx`, `src/ui/SourceState.tsx`

**Interfaces:**
- Consumes: Task 11.
- Produces: an explicit, recorded decision per component.

**Context:** These four have no `Cr*` counterpart. Judged individually. Prior from the design phase:

| Component | Sites | Prior |
| --- | --- | --- |
| `SourceHeader` | 15 | **Stay local** — encodes this app's data-source freshness domain |
| `SourceState` | 17 | **Stay local** — same |
| `RefCard` | 2 | **Stay local** — names specific integrations (jira, figma, confluence) |
| `BracketLabel` | 8 | **Probably upstream** — a general typographic device |

- [ ] **Step 1: Read each and apply the test**

```bash
cd ~/Workspace-personal/control-room
cat src/ui/BracketLabel.tsx src/ui/RefCard.tsx src/ui/SourceHeader.tsx src/ui/SourceState.tsx
```

The test: *is this a general instrument vocabulary, or does it encode this app's data model?* If it names a Jira status, a note type, or an integration, it stays local.

- [ ] **Step 2: For anything upstreamed, add it to the design system first**

In `~/Workspace-personal/control-room-design-system`: add `packages/components/components/Cr<Name>.lite.tsx`, its styles in `packages/styles/styles/parts/`, register it in `catalog/registry.json`, then:

```bash
cd ~/Workspace-personal/control-room-design-system
pnpm run build
pnpm run verify:types
git add -A && git commit -m "feat(components): add Cr<Name>"
```

Then swap it in the app per Task 11's cycle.

- [ ] **Step 3: Document what stayed and why**

Create `src/ui/README.md`:

```markdown
# src/ui — the app's own UI layer

Everything here is deliberately NOT in the design system. Two categories:

## App-domain components

They encode this app's data model, not a general instrument vocabulary. Promoting
them would put application concepts into a system meant to be framework- and
domain-agnostic.

- `SourceHeader`, `SourceState` — data-source freshness and failure states
- `RefCard` — reference cards naming specific integrations (jira, figma, confluence)
- `StatusIcon` — the icon variant of a status indicator; `CrStatusDot` has no
  `icon` prop and shape is a non-colour a11y channel we must not lose
- `statusColor.ts` — the app's state vocabulary and its map onto DS signal names

## The one sanctioned wrapper

- `AppPanel` — `CrPanel` supplies the frame, title and weight; the wrapper adds the
  five app-only concerns the design system has no equivalent for (corner marks
  seeded from the title, body-only scrolling, flush fill, route accent).

Everything else comes from `@alebianco/cr-components/qwik`. When a component is
missing a capability the app needs, fix it upstream — do not add a wrapper here.
```

- [ ] **Step 4: Run the suite**

```bash
pnpm test 2>&1 | tail -15
pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs(ui): record which components stay app-local and why"
```

---

### Task 13: Phase 2 exit gate

**Files:** none (verification only).

**Interfaces:**
- Consumes: Tasks 6-12.
- Produces: a verified port.

- [ ] **Step 1: Confirm the local UI layer actually shrank**

```bash
cd ~/Workspace-personal/control-room
ls src/ui/*.tsx | wc -l
```

Expected: roughly 6 — `AppPanel`, `StatusIcon`, `SourceHeader`, `SourceState`, `RefCard`, plus `Crosshair` if still needed. Anything else is an unplanned survivor; justify it in `src/ui/README.md` or swap it.

- [ ] **Step 2: Confirm no forbidden import path crept in**

```bash
grep -rn "dist/pkg/qwik\|dist/frameworks" src/ tests/ | grep -v node_modules
```

Expected: no output. Every import must be `@alebianco/cr-components/qwik`.

- [ ] **Step 3: Confirm no app file redefines a design system signal**

```bash
grep -rn -- '--sig-[a-z]*:' src/styles/ | grep -v node_modules
```

Expected: no output — the app derives from signals, never redefines them.

- [ ] **Step 4: Full verification**

```bash
pnpm install
pnpm typecheck
pnpm test 2>&1 | tail -20
pnpm build
```

Expected: all clean. Compare the passing count against the Task 5 baseline; every drop must be a test deliberately deleted with a reason in its commit message.

- [ ] **Step 5: Final visual pass, both schemes, all 7 views**

```bash
pnpm dev
```

For each of sprint, sessions, jobs, notes, contacts, catalogue, settings — in dark and light:
- panels, titles and corner marks render;
- status colours match their state and carry accessible names;
- the nav rail accent is distinct per route and never reads as an error;
- no element is illegible in light mode.

- [ ] **Step 6: Tag and commit**

```bash
git tag phase-2-complete
git log --oneline | head -20
```

---

### Task 14: Cut the 1.0.0 release (added 2026-08-19)

**Files:**
- Modify: `control-room-design-system` — `.changeset/first-release.md`, repo variable

**Interfaces:**
- Consumes: Task 13's verified port.
- Produces: a published 1.0.0 whose contract has been exercised by a real consumer.

**Context:** This runs in the **design-system** repo, not the app. It is the payoff
for the sequencing: the release describes what a real port proved, and every fix the
port forced is already versioned by the Task 11 changeset rule.

- [ ] **Step 1: Confirm every port-driven fix carried a changeset**

Port-driven fixes land **straight on `main`** (decided 2026-08-19), so the audit is
commit-scoped, not date- or branch-scoped. Task 1 tags the design system at the
moment the port begins:

```bash
cd ~/Workspace-personal/control-room-design-system
git tag port-start        # ← do this in Task 1, before any port work
```

Then at release time, flag commits that touched **shipped source** without a
changeset:

```bash
cd ~/Workspace-personal/control-room-design-system
for c in $(git rev-list port-start..main); do
  src=$(git show --name-only --format= $c -- \
    'packages/*/components/*' 'packages/*/styles/*' \
    'packages/tokens/brands/*' 'packages/*/lib/*' | grep -c . || true)
  cs=$(git show --name-only --format= $c -- .changeset/ | grep -c . || true)
  [ "$src" -gt 0 ] && [ "$cs" -eq 0 ] && echo "FLAG $(git log -1 --format='%h %s' $c)"
done
```

**This is a review prompt, not a hard gate.** The filter deliberately scopes to
shipped source so test-only and CI-only commits do not flag — but a flagged commit
is not automatically wrong. Judge each: a codegen or build-script fix that changes
no public contract may legitimately need no changeset; a prop or CSS change always
does. Add the missing ones before going further.

*(Verified against real history: over `HEAD~5..HEAD` this filter drops four test/CI
commits and flags one — `08b4e1d fix(angular)`, which changed seven `.lite.tsx`
files with no changeset. That commit predates the port and may be fine, but it is
exactly the kind of thing this step exists to surface.)*

- [ ] **Step 2: Reconcile the first-release notes with reality**

`.changeset/first-release.md` was written before the port. Check its claims still
hold — component counts, framework support, the feature list — and correct anything
the port disproved.

Known already: it says "83 catalogued components". `catalog/registry.json` holds 83
**entries** — 76 `component`, 4 `utility`, 3 `block` — against 81 `.lite.tsx` files.
Reword to "83 catalogued entries (76 components)" or similar.

- [ ] **Step 3: Full verification**

```bash
pnpm install
pnpm run build
pnpm run verify:types
pnpm run verify:pkg-types
pnpm test 2>&1 | tail -20
```

Expected: all clean.

- [ ] **Step 4: Fix the root `./qwik` export and the docs specifier**

The bug in the Deferred list below is a **release blocker** once publishing is real:
`@alebianco/cr-design-system` exports `./qwik` to unoptimizable pre-compiled JS, and
`references/frameworks.md:17`/`:182` document that specifier. Fix both, with a
changeset, before publishing.

- [ ] **Step 5: Enable and cut**

Set repo variable `RELEASE_ENABLED=true`, merge the changesets Version PR, and
confirm `changeset publish` pushed all 7 packages at `1.0.0`.

- [ ] **Step 6: Switch the app off `link:`**

```bash
cd ~/Workspace-personal/control-room
```

Delete the `pnpm.overrides` block — a one-block deletion, as Task 3 intended. The
`^1.0.0` deps now resolve from GitHub Packages. Requires an `.npmrc` with
`@alebianco:registry=https://npm.pkg.github.com` and a `read:packages` token.

```bash
pnpm install
pnpm test 2>&1 | tail -20
pnpm build
```

Expected: green against the **published** packages, not the linked checkout. This is
the real proof the release works.

---

## Deferred — not in this plan

- **Fix the root package's `./qwik` export upstream.** `@alebianco/cr-design-system`
  exports `./qwik` → `packages/components/dist/pkg/qwik/index.js`, where all 81
  files carry raw `component$()` calls the optimizer cannot process — the spec's
  Finding 1, reintroduced at the root package. `references/frameworks.md:17` and
  `:182` document that broken specifier. This port sidesteps it by importing
  `@alebianco/cr-components/qwik`, but it is a live bug for any other Qwik
  consumer and should be fixed in the design system on its own commit.

- **Retiring the `dp-tooling` copy.** It stays untouched as the rollback. Removing it, dropping it from `.claude-plugin/marketplace.json`, and repointing `tools/bin/dash` is a separate decision once this is proven.
- **A general wayfinding mechanism in the design system.** If a second consumer ever needs per-route accents, the right shape is a documented recipe for deriving an N-way ramp from a route name — the DS has `hashSeed`/`mulberry32` but no seeded-colour utility. That needs its own Law 2 boundary decision plus a contrast-safe hue generator.
- **`extreme` and `phosphor` support.** Out of scope. If added back, the route-accent constraint gains a case: phosphor is single-hue, so hue separation is impossible there and wayfinding must move to lightness.
