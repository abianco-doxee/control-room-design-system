# Component Browser Review Implementation Plan

> **STATUS — 2026-08-13: COMPLETE.** All 13 tasks are implemented and verified
> against the code (the `- [ ]` boxes below were never ticked during execution,
> so read this header, not the boxes). Audit method and evidence:
>
> | Task | Evidence |
> | --- | --- |
> | 1 sidebar filter | filter markup + script in `build-showcase.mjs` |
> | 2 collapse double-cards | **0** components carry both a static example and an island |
> | 3 promote static-only | 78 entries in `ISLAND_IDS`; only 5 static `EXAMPLES` remain, each a pure-CSS vocabulary strip with no component to mount |
> | 4 dead cards | 0 registry ids without an example |
> | 5 clipping | `overflow` rules present on the stage containers |
> | 6 CrKeyHints combos | `+` = chord, space = sequence, rendered as "then" |
> | 7 Select popup | `.cr-select option` / `option:disabled` styled |
> | 8 validation contract | `CrCronField` on the shared `error`-driven contract, with a comment stating there is deliberately no `invalid` boolean |
> | 9 diagonals + avatar | `avatar.css` uses a diagonal `clip-path` |
> | 10 breadcrumb separator | configurable, defaults to `▸` |
> | 11 diagonals elsewhere | `stepper.css` uses diagonal `clip-path` |
> | 12 bezel halftone | painted on `::after`, **above** the readout, with the rationale in the CSS |
> | 13 verification | see the gate list in the 2026-08-13 remediation commit |
>
> Two items the memory note `showcase-review-findings` still lists as open were
> found already fixed and are **not** outstanding: the `examples/console` 404
> (both `frameworks.md` and `forms.md` now say "source-only; the published site
> does not host it") and the missing radio example (`CrChoice` has a
> `type: checkbox | radio` control, and the broken `class="cr-check"`-on-`<input>`
> demo is gone).
>
> **The one genuinely deferred item — visual baselines — is now actionable:** see
> the "Deferred" section at the foot of this file.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Act on the 12-item review of the deployed Component Browser: make every card one live component with togglable props, fix the broken and missing examples, close three component-API gaps, and land four visual-design changes.

**Architecture:** The live-island harness already exists and already has typed prop controls (`boolean` / `number` / `enum` / `text` / `children`) plus a generated code snippet — 60 of 83 components use it. So this is **not** a harness rewrite. The work is: drop the redundant static cells beside the 35 islands that have both, promote the 14 static-only components to islands, give the 9 dead cards real content, then the API and visual items.

**Tech Stack:** `packages/docs/build/build-showcase.mjs` (page + `EXAMPLES`), `packages/docs/build/showcase-islands.jsx` (React islands + controls, esbuild-bundled IIFE), `packages/styles/styles/components.css`, `packages/components/components/*.lite.tsx` (Mitosis).

## Global Constraints

- **Package manager: `pnpm` only.**
- **One live component per card.** A card must not show a live island *and* a row of static state cells; a state worth seeing becomes a control on the island.
- **Never author a state that a prop cannot reach.** If a static cell showed something the component can't express, that's an API gap — fix the component, don't fake it in HTML.
- **Author styles in `packages/styles/styles/components.css` only.** `styles/base.css` and `styles/parts/*.css` are GENERATED — never hand-edit; run `node packages/styles/build/build-styles.mjs`.
- **Never redefine `--sig-*`.** Components derive from signals (Law 2).
- **Rebuild order after touching components or styles:** `node packages/styles/build/build-styles.mjs` → `pnpm run build:components` → `pnpm run build:skill` → `pnpm run build:showcase`. `pnpm run verify` fails on a stale skill bundle.
- **Every visual change gets a screenshot check**, both `control-room` and `control-room-light`. Two bugs this session (mojibake glyphs, merged spinner cells) were invisible to passing DOM tests.
- **Law 6 governs texture:** *"Texture belongs to hardware, never to content."*
- **Law 3 governs decay:** the drip is vertical, downward, in `--drip`; glitch tiers map to severity.
- **Accessibility is not optional:** `pnpm --filter @alebianco/cr-docs test:a11y` must stay green in all four themes. Never remove a focus outline to fix a clipping bug — fix the container.

**Reference:** the verified findings are in the memory note `showcase-review-findings`. The deployed page is `https://alebianco.github.io/control-room-design-system/components.html`.

---

## File Structure

| Path | Responsibility | Notes |
| --- | --- | --- |
| `packages/docs/build/build-showcase.mjs` | page shell, sidebar index, `EXAMPLES`, `ISLAND_IDS`, `stageHtml()` | 834 lines |
| `packages/docs/build/showcase-islands.jsx` | island registry, `Field`/`Playground` controls, `snippet()` | 1542 lines |
| `packages/docs/build/gallery-scripts.mjs` | shared browser-side script (theme switch, etc.) | keep the name; the showcase imports it |
| `packages/styles/styles/components.css` | **the only** hand-authored style source | |
| `packages/components/components/Cr*.lite.tsx` | Mitosis component sources | |

---

## Phase 1 — One live component per card

### Task 1: Make the sidebar filterable

**Files:**
- Modify: `packages/docs/build/build-showcase.mjs` (sidebar markup + `.idx` CSS + inline script)

**Interfaces:**
- Consumes: nothing.
- Produces: a text filter above the sticky component index that hides non-matching entries and their now-empty group headings.

**Context:** 83 components in a sticky sidebar (`.idx`, `max-height: calc(100vh - 61px); overflow: auto`). Finding one means scrolling. This task is first because it is self-contained and makes every later task's manual verification faster.

- [ ] **Step 1: Find the sidebar markup**

```bash
cd /Users/abianco/Workspace-personal/control-room-design-system
grep -n 'class="idx"\|idx__group\|idx__link' packages/docs/build/build-showcase.mjs | head
```

- [ ] **Step 2: Add the filter input above the index list**

Insert as the first child of `.idx`, before the first `.idx__group`:

```html
<label class="idx__filter">
  <span class="sr-only">Filter components</span>
  <input type="search" id="idx-filter" placeholder="filter components…" autocomplete="off" spellcheck="false" />
</label>
<p class="idx__none" hidden role="status">no match</p>
```

- [ ] **Step 3: Style it in the page's inline CSS**

Add beside the existing `.idx` rules:

```css
.idx__filter { display: block; margin-bottom: 12px; }
.idx__filter input {
  width: 100%; box-sizing: border-box; padding: 6px 8px;
  font-family: var(--font-mono); font-size: 12px;
  color: var(--ink); background: var(--panel);
  border: var(--brd) solid var(--border); border-radius: var(--radius);
}
.idx__filter input:focus-visible { outline: var(--focus-w) solid var(--sig-work); outline-offset: 2px; }
.idx__none { font-family: var(--font-mono); font-size: 12px; color: var(--muted); margin: 0; }
```

- [ ] **Step 4: Wire the filter**

Add to the page's inline script:

```js
(() => {
  const input = document.getElementById("idx-filter");
  if (!input) return;
  const none = document.querySelector(".idx__none");
  const groups = [...document.querySelectorAll(".idx__group")];
  const apply = () => {
    const q = input.value.trim().toLowerCase();
    let hits = 0;
    for (const group of groups) {
      let groupHits = 0;
      for (const link of group.querySelectorAll("a")) {
        const match = !q || link.textContent.toLowerCase().includes(q);
        link.hidden = !match;
        if (match) groupHits++;
      }
      // hide a heading whose every entry is filtered out
      group.hidden = groupHits === 0;
      hits += groupHits;
    }
    if (none) none.hidden = hits > 0;
  };
  input.addEventListener("input", apply);
  // Escape clears, so the keyboard path does not require reaching for the mouse
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { input.value = ""; apply(); }
  });
})();
```

- [ ] **Step 5: Rebuild and verify by hand**

```bash
pnpm run build:showcase
```

Open `packages/docs/public/components.html`. Type `com` — expect Combobox and any other match, with empty group headings gone. Press Escape — expect the full list back. Type `zzz` — expect "no match".

- [ ] **Step 6: Verify a11y and commit**

```bash
pnpm --filter @alebianco/cr-docs run test:a11y 2>&1 | tail -4
git add -A
git commit -m "feat(docs): filter the component browser sidebar

83 entries in a sticky index meant scrolling to find one. Filter hides
non-matching links and any group heading left empty; Escape clears."
```

---

### Task 2: Collapse the 35 double-cards to one live component

**Files:**
- Modify: `packages/docs/build/build-showcase.mjs` (`EXAMPLES`, `stageHtml`)
- Modify: `packages/docs/build/showcase-islands.jsx` (add controls for states only a static cell showed)

**Interfaces:**
- Consumes: Task 1.
- Produces: for every component with a live island, exactly one live cell and no static state cells.

**Context:** 35 components currently render a live island **and** a row of static cells — the confusion in the review. The islands already carry typed prop controls, so most static cells are redundant. The exception matters: where a static cell showed a state no control can reach, that is an API/controls gap to close, not a cell to delete silently.

- [ ] **Step 1: List the overlap and what each static cell shows**

```bash
cd /Users/abianco/Workspace-personal/control-room-design-system
python3 - <<'PY'
import re, json
s = open('packages/docs/build/build-showcase.mjs', encoding='utf8').read()
islands = set(re.findall(r'"([^"]+)"', re.search(r'const ISLAND_IDS = new Set\(\[(.*?)\]\)', s, re.S).group(1)))
isl = open('packages/docs/build/showcase-islands.jsx', encoding='utf8').read()
for key in sorted(islands):
    m = re.search(r'\n  "?' + re.escape(key) + r'"?:\s*\[', s)
    if not m:
        continue
    block = s[m.start(): s.index('\n  ]', m.start())]
    states = re.findall(r'state: "([^"]+)"', block)
    # which props the island already exposes
    im = re.search(r'"?' + re.escape(key) + r'"?:\s*\{', isl)
    props = []
    if im:
        seg = isl[im.start(): im.start() + 1200]
        props = re.findall(r'T\("(?:boolean|number|enum|text|children)",\s*"([^"]+)"', seg)
    print(f"{key:<20} static={states}")
    print(f"{'':<20} controls={props}")
PY
```

Read the output. For each component, decide per static state: **already reachable** by a control (delete the cell), or **not reachable** (add a control in Step 3).

- [ ] **Step 2: Delete the static cells for components that have an island**

For each key in the overlap list, remove its `EXAMPLES` entry entirely. Keep `EXAMPLES` entries only for components with **no** island (Task 3 handles those).

- [ ] **Step 3: Add the missing controls**

For each state from Step 1 that no control could reach, add a control to that island's `defs` in `showcase-islands.jsx`. The control factory is `T(type, prop, default, opts?)` with types `boolean` / `number` / `enum` / `text` / `children`:

```js
// example: a state only a static cell used to show
T("enum", "signal", "work", { options: ["work", "wait", "done", "err", "idle"] }),
T("boolean", "disabled", false),
```

Then thread it through that entry's `render(s)` so the prop actually reaches the component.

- [ ] **Step 3b: Fix the checkbox card and give radio an example**

This is a named review item and it is a real bug, not just redundancy. Verified:

```js
// current: the class is on the INPUT
html: `<label …><input type="checkbox" class="cr-check" aria-label="select"/> failing</label>`
```

but the CSS is a **wrapper** contract (`components.css:462-476`):

```css
.cr-check { … }
.cr-check input { … border: var(--brd) solid var(--cr-field-border); background: var(--cr-check-bg); }
.cr-check input:checked { background: var(--cr-check-checked); }
```

`.cr-check` on the `<input>` means `.cr-check input` never matches, so the demo has
been showing a **browser-default checkbox** — the styling never applied at all.

**The good news, verified:** the `checkbox` island renders **`CrChoice`** and already
exposes `T("enum", "type", "checkbox", { options: ["checkbox", "radio"] })` plus
`checked` and `disabled`. So the live playground can already show a radio and both
checked states — the card is only broken because the two hand-written static cells sit
beside it showing unstyled browser defaults.

So deleting the static cells (Step 2) fixes this item outright. All that remains is to
confirm `CrChoice`'s own output nests the input inside the `.cr-check` wrapper rather
than putting the class on the input:

```bash
pnpm run build:showcase
python3 - <<'PY'
import re
h = open('packages/docs/public/components.html', encoding='utf8').read()
# the class must be on a wrapper with an input inside it, never on the input
assert not re.search(r'<input[^>]*class="[^"]*cr-check', h), "cr-check must not sit on the input"
print("ok: no cr-check on an input")
PY
```

If `CrChoice`'s own output puts the class on the input, that is a component bug — fix
`packages/components/components/CrChoice.lite.tsx`, not the example.

- [ ] **Step 4: Simplify the live cell's label**

In `stageHtml()`, the live cell is labelled `playground · editable props`. With the static cells gone it is the only cell, so drop the now-redundant wrapper label logic if it reads oddly — keep the label itself, it tells a visitor the controls are live.

- [ ] **Step 5: Rebuild and check several cards by hand**

```bash
pnpm run build:showcase
```

Open the page. Confirm Button, Table, Tag, Alert, Panel and Toast each show **one** live cell with controls and no static row, and that every state the static cells used to show is reachable from the controls.

- [ ] **Step 6: Run the island gate**

```bash
pnpm --filter @alebianco/cr-docs run test:islands 2>&1 | tail -6
pnpm --filter @alebianco/cr-docs run test:a11y 2>&1 | tail -4
```

Expected: PASS. `showcase-islands.spec.mjs` asserts real components mount and stay interactive; if it references a deleted static cell, update the spec to the live cell.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(docs)!: one live component per showcase card

35 cards showed a live island AND a row of static state cells, so it was
unclear which was the real component. Delete the static cells wherever an
island exists and promote any state they showed to a control on the island,
so every state is reachable from the live component."
```

---

### Task 3: Promote the 14 static-only components to live islands

**Files:**
- Modify: `packages/docs/build/showcase-islands.jsx` (14 new registry entries)
- Modify: `packages/docs/build/build-showcase.mjs` (`ISLAND_IDS`, remove their `EXAMPLES`)

**Interfaces:**
- Consumes: Task 2.
- Produces: live islands for `ascii`, `ascii-detail`, `bezel`, `breach`, `chrome`, `data-list`, `diagonal-primitives`, `drip`, `hero`, `masthead`, `shape`, `sigil`, `skeleton`, `telemetry`.

**Context:** These 14 have static HTML only. Each maps to a shipped component (`CrAscii`, `CrBezel`, `CrBreach`, `CrChrome`, `CrDrip`, `CrHero`, `CrMasthead`, `CrShape`, `CrSigil`, `CrTelemetry`…), so a live island is authorable. `drip` is worth care: the drip was just corrected to Law 3's vertical `--drip` glitch, and `CrDrip` takes `title` + `sub`.

- [ ] **Step 1: Confirm the component and prop interface for each**

```bash
cd /Users/abianco/Workspace-personal/control-room-design-system
for c in CrAscii CrBezel CrBreach CrChrome CrDrip CrHero CrMasthead CrShape CrSigil CrTelemetry; do
  echo "──── $c"
  sed -n '/^export interface/,/^}/p' packages/components/components/$c.lite.tsx
done
```

**Read the real interface before authoring a control.** Do not assume the static HTML's classes match the component's props.

- [ ] **Step 2: Add one island registry entry per component**

Follow the existing shape in `showcase-islands.jsx`:

```js
  drip: {
    tag: "CrDrip",
    defs: [
      T("text", "title", "connection lost"),
      T("text", "sub", "ai-global-chat · SSE closed · retry 3/5"),
    ],
    render: (s) => h(CrDrip, { title: s.title, sub: s.sub }),
  },
```

For a component whose interesting axis is a child rather than a prop (`bezel`, `chrome`), pass demo children in `render` and expose the real props as controls.

- [ ] **Step 3: Register them and drop their static examples**

Add all 14 ids to `ISLAND_IDS` in `build-showcase.mjs` and delete their `EXAMPLES` entries.

- [ ] **Step 4: Rebuild and verify each card mounts**

```bash
pnpm run build:showcase
```

Open the page and visit all 14. A card still showing `mounting…` means the registry entry threw — check the browser console.

- [ ] **Step 5: Run the gates and commit**

```bash
pnpm --filter @alebianco/cr-docs run test:islands 2>&1 | tail -5
pnpm --filter @alebianco/cr-docs run test:a11y 2>&1 | tail -4
git add -A
git commit -m "feat(docs): live islands for the 14 static-only components"
```

---

### Task 4: Give the 9 dead cards real content

**Files:**
- Modify: `packages/docs/build/showcase-islands.jsx`, `packages/docs/build/build-showcase.mjs`
- Modify: `references/frameworks.md`, `references/forms.md`

**Interfaces:**
- Consumes: Task 3.
- Produces: live examples for `key-hints`, `toggle-chip`, `instrument`, `decoration-utilities`, `seeded-cat`, `overflow`, `rail`, `keyed-contact-sheet`, `relative-time`; no public reference to an undeployed app.

**Context — two review items land here.** These 9 have neither island nor static example, so `stageHtml()` falls through to *"Composed in the `examples/console` app."* — and **`examples/console` is not deployed** (verified 404). So a public visitor is pointed at nothing. `seeded-cat` is one of the 9, which is why the review says the pixel-cat results aren't shown.

- [ ] **Step 1: Confirm the dead list and the 404**

```bash
cd /Users/abianco/Workspace-personal/control-room-design-system
curl -sL -o /dev/null -w '%{http_code}\n' https://alebianco.github.io/control-room-design-system/examples/console/
grep -rn 'examples/console' packages/docs/build/build-showcase.mjs references/*.md
```

Expected: `404`, and three references.

- [ ] **Step 2: Read the interfaces**

```bash
for c in CrCat CrKeyHints CrToggleChip CrInstrument CrOverflow CrRelativeTime; do
  echo "──── $c"; sed -n '/^export interface/,/^}/p' packages/components/components/$c.lite.tsx
done
```

`CrCat` is the seeded pixel-cat — check `references/seeded-cat.md` for what a good demo shows (same seed → same cat, and the state hues).

- [ ] **Step 3: Add the pixel-cat island**

The review explicitly asks for the seeded pixel-cat results. Show that identity is deterministic from the seed:

```js
  "seeded-cat": {
    tag: "CrCat",
    defs: [
      T("text", "seed", "nova-01"),
      T("enum", "state", "working", { options: ["working", "waiting", "done", "err", "idle"] }),
      T("number", "size", 48, { min: 16, max: 96, step: 8 }),
    ],
    render: (s) =>
      h("div", { style: { display: "flex", gap: "16px", alignItems: "flex-end" } },
        h(CrCat, { seed: s.seed, state: s.state, size: s.size }),
        // same seed twice proves determinism; a second seed proves it varies
        h(CrCat, { seed: s.seed, state: s.state, size: s.size }),
        h(CrCat, { seed: s.seed + "-b", state: s.state, size: s.size })
      ),
  },
```

Verify against the real `CrCat` interface from Step 2 and correct the prop names if they differ.

- [ ] **Step 4: Add the other 8 islands**

One registry entry each, following Task 3's shape. `key-hints` is headless (it renders nothing and sets `data-cr-keys` on the root while a key is held) — pair it with visible `CrKbd` hint badges so the reveal gesture is observable. Task 6 revisits its prop interface.

- [ ] **Step 5: Remove the dead fallback**

In `stageHtml()`, replace the `examples/console` fallback. With Tasks 3-4 done nothing should reach it, so make it honest rather than a broken pointer:

```js
  if (!island && !ex.length) {
    return `<div class="stage stage--empty">No isolated example — this composes other components.</div>`;
  }
```

- [ ] **Step 6: Fix the two reference docs**

`references/frameworks.md:153` and `references/forms.md:137` cite `examples/console` as if a reader can see it. Either scope the mention to the repo (*"the `examples/console/` app in this repository"*) or drop it. Do not leave a bare public pointer to an undeployed path.

- [ ] **Step 7: Rebuild, verify, commit**

```bash
pnpm run build:showcase
grep -c 'examples/console' packages/docs/public/components.html   # expect 0
pnpm --filter @alebianco/cr-docs run test:islands 2>&1 | tail -5
git add -A
git commit -m "feat(docs): real examples for the 9 empty cards, incl. the seeded pixel-cat

These 9 fell through to 'Composed in the examples/console app' — an app that
is in the repo but NOT deployed (404), so the message pointed a public visitor
at nothing. seeded-cat was one of them, which is why the pixel-cat results were
not visible. Also scope the two reference-doc mentions to the repository."
```

---

### Task 5: Stop containers clipping content and focus outlines

**Files:**
- Modify: `packages/docs/build/build-showcase.mjs` (`.stage` / `.cell` CSS, per-example inline heights)

**Interfaces:**
- Consumes: Task 4.
- Produces: no demo whose content or focus ring is cut off by its container.

**Context:** `.stage` has no `overflow` rule, so clipping comes from per-example fixed dimensions — `min-height:150px` (combobox), `min-height:130px` (menu open panel), one `height:110px` — and from focus outlines drawn at a flush container edge. The review names combobox, toolbar and toast. **Never fix this by removing an outline.**

- [ ] **Step 1: Find every fixed dimension in the examples and islands**

```bash
cd /Users/abianco/Workspace-personal/control-room-design-system
grep -nE 'min-height:|max-height:|height: *[0-9]+px|overflow' packages/docs/build/build-showcase.mjs packages/docs/build/showcase-islands.jsx | grep -v '\.idx'
```

- [ ] **Step 2: Give the cell room instead of a fixed height**

In the page CSS, let a demo cell grow and keep a focus ring visible:

```css
.cell__demo { padding: 4px; }              /* room for outline-offset */
.cell--live .cell__demo { overflow: visible; }
```

Replace each `min-height:<N>px` on an overlay demo (combobox, menu, popover, select) with `padding-bottom` on the *cell*, so the open list has somewhere to go without the demo being clipped:

```css
.cell--overlay .cell__demo { padding-bottom: 160px; }
```

Then tag those cells `cell--overlay` in `stageHtml()` via a set of ids, rather than inline styles per example.

- [ ] **Step 3: Verify by hand at two widths**

```bash
pnpm run build:showcase
```

Open the page. For Combobox, Menu, Select, Popover, Toolbar and Toast: the full demo is visible, and tabbing to each control shows a complete focus ring on all four sides. Repeat at a narrow window (~420px).

- [ ] **Step 4: Run the responsive + a11y gates**

```bash
pnpm --filter @alebianco/cr-docs run test:responsive 2>&1 | tail -4
pnpm --filter @alebianco/cr-docs run test:a11y 2>&1 | tail -4
```

Expected: PASS — `responsive.spec.mjs` asserts no horizontal overflow at 375/768/1024.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix(docs): stop demo containers clipping content and focus rings"
```

---

## Phase 2 — Component APIs

### Task 6: Give CrKeyHints a real combo/sequence interface

**Files:**
- Modify: `packages/components/components/CrKeyHints.lite.tsx`
- Modify: `packages/docs/build/showcase-islands.jsx` (its island)
- Modify: `references/components.md`
- Test: `tests/keyhints.test.mjs`

**Interfaces:**
- Consumes: Task 4's island.
- Produces: `CrKeyHints` accepting a declared combo (`"Alt+K"`) and a sequence (`"g s"`), not just a single `revealKey`.

**Context:** Today the whole interface is `revealKey?: string` (default `"Alt"`), matched with `e.key === revealKey`. It cannot express a modifier combo or a two-key sequence, which is what the review asks for. Keep the reveal-on-hold behavior; add declaration.

- [ ] **Step 1: Write the failing test**

Create `tests/keyhints.test.mjs`:

```js
// CrKeyHints must be able to DECLARE what it listens for: a single key, a
// modifier combo, or a two-key sequence. The original interface was a bare
// `revealKey` string compared with `e.key ===`, which can express none of them.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(
  join(ROOT, "packages", "components", "components", "CrKeyHints.lite.tsx"),
  "utf8"
);

test("declares a combo prop", () => {
  assert.match(src, /combo\?:\s*string/, "combo is a declared prop");
});

test("declares a sequence prop", () => {
  assert.match(src, /sequence\?:\s*string/, "sequence is a declared prop");
});

test("parses modifiers rather than comparing e.key to one string", () => {
  assert.match(src, /altKey|ctrlKey|metaKey|shiftKey/, "modifiers are read from the event");
});

test("still supports the reveal-on-hold gesture", () => {
  assert.match(src, /data-cr-keys/, "the reveal attribute contract is unchanged");
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
cd /Users/abianco/Workspace-personal/control-room-design-system
node --test tests/keyhints.test.mjs 2>&1 | tail -8
```

Expected: FAIL on `combo` and `sequence`.

- [ ] **Step 3: Extend the interface**

In `CrKeyHints.lite.tsx`, keep `revealKey` (back-compatible) and add:

```ts
  /** Hold-to-reveal combo, e.g. "Alt" or "Alt+K". Modifiers: Alt · Ctrl · Meta · Shift. */
  combo?: string;
  /** Two-key sequence that toggles the reveal, e.g. "g s" (press g then s). */
  sequence?: string;
  /** Milliseconds allowed between the two keys of a sequence. Default 800. */
  sequenceWindow?: number;
```

Parse `combo` into modifier flags + a final key and match on the event's `altKey`/`ctrlKey`/`metaKey`/`shiftKey`. For `sequence`, track the last key and its timestamp in the store and fire when the second arrives inside `sequenceWindow`.

Mitosis constraint: no imports beyond `@builder.io/mitosis`, and state lives in `useStore`.

- [ ] **Step 4: Run the test and the framework gates**

```bash
node --test tests/keyhints.test.mjs 2>&1 | tail -6
pnpm run build:components && pnpm run verify:types
pnpm run test:frameworks 2>&1 | tail -4
```

Expected: all PASS.

- [ ] **Step 5: Update the island and the reference**

Expose `combo` and `sequence` as controls on the `key-hints` island, and document both in `references/components.md` under Key hints.

- [ ] **Step 6: Rebuild and commit**

```bash
node packages/styles/build/build-styles.mjs && pnpm run build:components && pnpm run build:skill && pnpm run build:showcase
pnpm run verify >/dev/null && echo "verify OK"
git add -A
git commit -m "feat(components): CrKeyHints declares combos and sequences

The whole interface was revealKey?: string matched with e.key === revealKey,
which cannot express a modifier combo or a two-key sequence. Add combo and
sequence (plus sequenceWindow) and parse modifiers off the event; revealKey
still works."
```

---

### Task 7: Style the Select options popup

**Files:**
- Modify: `packages/styles/styles/components.css`
- Modify: `packages/docs/build/showcase-islands.jsx` (`select` island)
- Test: extend `tests/spinner-kick.test.mjs`-style CSS assertions in a new `tests/select-popup.test.mjs`

**Interfaces:**
- Consumes: Task 2.
- Produces: a styled option list for `CrSelect`.

**Context:** the `select` example is a bare `<select class="cr-input">`, so the popup is the OS widget — unstyleable in a native `<select>`. Check what `CrSelect` actually renders first: if it is a real listbox, the popup is ours to style; if it wraps a native `<select>`, the honest fix is to style what CSS can reach (`option` where supported) and say so.

- [ ] **Step 1: Determine what CrSelect renders**

```bash
cd /Users/abianco/Workspace-personal/control-room-design-system
cat packages/components/components/CrSelect.lite.tsx
grep -n 'cr-select' packages/styles/styles/components.css | head
```

- [ ] **Step 2: Branch on the answer**

**If `CrSelect` renders a custom listbox** (its own button + `role="listbox"`): style `.cr-select__list` / `.cr-select__opt` to match `.cr-combobox__list` / `__opt` — same border, `--panel` background, `--radius`, and an active option using `--cr-combobox-opt-active-*` equivalents so the two controls agree.

**If it renders a native `<select>`:** a native popup cannot be fully styled. Style `.cr-select option` (honoured on several platforms), and add a one-line comment in `components.css` stating the limit so nobody re-opens it as a bug. Then consider whether the showcase should demo `CrCombobox` beside it as the styleable alternative.

- [ ] **Step 3: Write the assertion for whichever path applies**

Create `tests/select-popup.test.mjs` asserting the option list rules exist and share the combobox's tokens:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(ROOT, "packages", "styles", "styles", "components.css"), "utf8");

test("the select's option surface is styled, not left to the OS", () => {
  assert.match(css, /\.cr-select(__list| option)/, "option surface has a rule");
});
```

- [ ] **Step 4: Rebuild, screenshot both themes, commit**

```bash
node packages/styles/build/build-styles.mjs && pnpm run build:skill && pnpm run build:showcase
node --test tests/select-popup.test.mjs 2>&1 | tail -4
```

Open the Select card, open the list, and confirm it matches the Combobox list in both `control-room` and `control-room-light`.

```bash
git add -A && git commit -m "feat(styles): style the select option surface"
```

---

### Task 8: Decide the field validation contract

**Files:**
- Modify: `references/forms.md` (the decision), and `CrCronField`/`CrField`/`CrInput`/`CrTextarea` only if the decision is to change behavior.

**Interfaces:**
- Consumes: nothing.
- Produces: one documented, consistent validation contract across every field component.

**Context — the review's premise needs correcting before acting.** The review says CronField *"still takes the error from outside, does no validation internally. other fields use an invalid prop."* Verified: `CrField`, `CrInput`, `CrTextarea` and `CrFormRow` use the **same** outside-`error` contract; **none** has an `invalid` boolean. `CrCronField`'s own comment states this deliberately: *"`error` is the single source of truth: it sets aria-invalid, shows the error, and links it via aria-describedby. There is no hand-set `invalid` boolean — validity is derived."*

So CronField is *consistent*, and the real question is whether the whole family should validate internally. That is a published-API decision, not a bug fix.

- [ ] **Step 1: Confirm the current contract across all field components**

```bash
cd /Users/abianco/Workspace-personal/control-room-design-system
for c in CrField CrInput CrTextarea CrFormRow CrCronField; do
  echo "──── $c"; grep -nE 'error|invalid|aria-invalid' packages/components/components/$c.lite.tsx | head -6
done
grep -n 'error\|invalid' references/forms.md | head -12
```

- [ ] **Step 2: Present the finding and get a decision**

Do not change a published prop contract on an inferred premise. Report to the user: the family is already consistent; the options are (a) leave as-is and document it more prominently, (b) add optional internal validation to `CrCronField` only (it can parse a cron expression, so it *can* self-validate), or (c) add internal validation across the family. Ask which.

- [ ] **Step 3: Implement the chosen option**

If (a): add a short "Validity is derived, never hand-set" section to `references/forms.md` and stop.
If (b) or (c): add an opt-in prop (e.g. `validate?: boolean`) that derives `error` internally when no `error` is passed, so existing callers are unaffected. Write the failing test first, in `tests/`, asserting a bad value produces `aria-invalid` with no external `error`.

- [ ] **Step 4: Rebuild, verify, commit**

```bash
pnpm run build:components && pnpm run verify:types && pnpm run test:forms 2>&1 | tail -4
git add -A && git commit -m "docs(forms): state the derived-validity contract explicitly"
```

---

## Phase 3 — Visual design

### Task 9: Give the diagonal primitives room, and try them as avatar state

**Files:**
- Modify: `packages/docs/build/showcase-islands.jsx` (`diagonal-primitives`, `avatar`)
- Modify: `packages/styles/styles/components.css` (only if the avatar state variant lands)

**Interfaces:**
- Consumes: Task 3 (diagonal-primitives becomes an island there).
- Produces: a diagonal-primitives demo that does not scroll, and a judged answer on diagonals as avatar state.

**Context:** the review says the diagonals need more space to avoid scrolling, and asks whether they could carry avatar state. Law 4 governs them: *"The grid governs; diagonals carry meaning."* So a diagonal on an avatar must mean something — a state — not decorate.

- [ ] **Step 1: Read Law 4 and the current diagonal styles**

```bash
cd /Users/abianco/Workspace-personal/control-room-design-system
sed -n '/^## Law 4/,/^---/p' references/design-language.md
grep -n 'cr-chev\|cr-notch\|diagonal' packages/styles/styles/components.css | head
```

- [ ] **Step 2: Lay the demo out on a grid instead of a wrapping row**

Give the island a CSS grid with enough room per primitive that nothing scrolls at 1024px and it reflows at 420px:

```js
render: (s) =>
  h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "20px", width: "100%" } }, /* … */),
```

- [ ] **Step 3: Prototype the avatar state variant — as a REPLACEMENT, not an addition**

**Verified first:** `.cr-avatar` already carries state — `.cr-avatar__status`
(`components.css:1439`) is a `0.6rem` square pinned at `bottom: -3px; right: -3px`
with a `--panel` ring. So this is not "add state to the avatar"; it is "should that
square become a diagonal?" Adding a notch *beside* the existing dot would put two
state indicators on one avatar, which is worse than either alone.

Change the existing part rather than adding a sibling:

```css
/* The status marker is a diagonal corner flag, not a square pip: Law 4 gives the
 * diagonal meaning, and it reads at 24px where a 0.6rem square goes muddy. */
.cr-avatar__status {
  position: absolute; bottom: 0; right: 0;
  width: 0.7rem; height: 0.7rem; border: 0;
  background: var(--muted);
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
}
```

Note the `border` reset: the existing `1.5px solid var(--panel)` ring exists to
separate a square pip from the avatar behind it. A clip-path triangle cannot carry a
ring on its hypotenuse (the border would be clipped too), so the separation has to
come from the shape itself. **If it reads as muddy against a busy avatar, that is a
finding — report it rather than forcing the change.**

- [ ] **Step 4: Screenshot both, in both themes, and judge**

```bash
node packages/styles/build/build-styles.mjs && pnpm run build:skill && pnpm run build:showcase
```

Open the Diagonal primitives and Avatar cards. Confirm no scrolling in the primitives
demo; then judge the avatar at `--sm` (1.5rem), default (2.25rem) and `--lg` (3rem) in
both themes. **If the diagonal reads worse than the square at 1.5rem, revert the
avatar half and say so** — the review asked "maybe", so a reasoned no is a valid
answer, and the square already works.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix(docs): give the diagonal primitives room; try diagonals as avatar state"
```

---

### Task 10: Make the breadcrumb separator brutalist

**Files:**
- Modify: `packages/styles/styles/components.css`
- Test: extend `tests/` with a separator assertion

**Interfaces:**
- Consumes: nothing.
- Produces: a separator that reads as Control Room rather than as a generic chevron.

**Context:** the review calls the separator not brutalist/cyberpunk enough.

**Verified — it is currently a `"/"`** (`components.css:747`):

```css
.cr-breadcrumb__item + .cr-breadcrumb__item::before {
  content: "/"; color: color-mix(in srgb, var(--cr-breadcrumb-fg) 55%, transparent);
}
```

That matters for what to replace it with: a plain chevron `›` would be *less*
distinctive than a slash, not more — a chevron is the generic web default. The
brutalist move is a **drawn mark**, not a different character.

- [ ] **Step 1: Read the current separator and the diagonal vocabulary**

```bash
cd /Users/abianco/Workspace-personal/control-room-design-system
grep -n 'cr-breadcrumb' packages/styles/styles/components.css
sed -n '/Diagonal primitives (Law 4/,/^$/p' packages/styles/styles/components.css | head -30
```

- [ ] **Step 2: Replace it with a drawn slash**

Keep the slash's *angle* — it already reads as machine path syntax — but draw it as a
hard skewed bar so it has weight and takes the theme's border colour. Drawn, not a
glyph: this sheet ships without `@charset`, so a literal non-ASCII glyph decodes as
mojibake for a consumer whose document declares no encoding (hit this session with the
spinner's `█`).

```css
.cr-breadcrumb__item + .cr-breadcrumb__item::before {
  content: ""; display: inline-block; flex: none;
  width: 2px; height: 0.7em; transform: skewX(-20deg);
  background: color-mix(in srgb, var(--cr-breadcrumb-fg) 55%, transparent);
}
```

ASCII-only, inherits the theme, and gains the chassis's hard edge.

- [ ] **Step 3: Screenshot both themes and commit**

```bash
node packages/styles/build/build-styles.mjs && pnpm run build:skill && pnpm run build:showcase
pnpm --filter @alebianco/cr-docs run test:a11y 2>&1 | tail -3
git add -A && git commit -m "feat(styles): a sharper breadcrumb separator"
```

---

### Task 11: Consider diagonals for segmented, stepper and other state components

**Files:**
- Modify: `packages/styles/styles/components.css`
- Modify: `packages/docs/build/showcase-islands.jsx` if a control is needed to show it

**Interfaces:**
- Consumes: Task 9 (the avatar judgment informs this).
- Produces: a decision, applied or explicitly declined, for `cr-segmented`, `cr-stepper` and comparable state components.

**Context:** the review asks whether segmented/stepper should leverage the diagonal primitives. Law 4 permits it *only* where the diagonal carries meaning. A segmented control's selected option and a stepper's current/complete step are genuine state, so a diagonal is defensible — but three components all sprouting notches risks the noise Law 4 warns about.

- [ ] **Step 1: Look at the current selected/active treatments**

```bash
cd /Users/abianco/Workspace-personal/control-room-design-system
grep -n 'cr-segmented\|cr-stepper' packages/styles/styles/components.css
```

- [ ] **Step 2: Apply a diagonal to ONE of them first**

Do segmented only. Give the selected option a diagonal leading edge keyed to the signal, holding its box otherwise.

- [ ] **Step 3: Screenshot and judge before doing the second**

Rebuild and look at it in both themes beside the untouched stepper. Only carry it to the stepper if segmented clearly reads better. **Record the judgment either way in the commit message** — "tried and declined" is a result.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(styles): diagonal selected-edge for the segmented control"
```

---

### Task 12: Move the Bezel halftone into the chrome

**Files:**
- Modify: `packages/styles/styles/components.css`
- Test: `tests/law6-texture.test.mjs`

**Interfaces:**
- Consumes: Task 3 (`bezel` becomes an island).
- Produces: halftone on the bezel frame band only; the screen area behind content clean.

**Context — the user chose "halftone on the bezel frame only."** This is Law 6 exactly: *"Texture belongs to hardware, never to content."*

**Where it actually is (verified — do not trust a guess here):** the halftone is on
`.cr-bezel__screen::before`, a `z-index: -1` layer inside the *screen*, at
`opacity: calc(0.55 * var(--decoration-intensity, 1))`. `.cr-bezel` (the frame, at
`components.css:134`) has **no** texture — only a `--brd-brush` border, `--panel-2`
background and the offset shadow. The screen sets `isolation: isolate`, which is what
makes the negative z-index layer stay inside it.

The existing code carries a comment defending the current placement — *"CRT halftone
rides BEHIND the text (own layer, toned + dialable) so the readout stays crisp —
texture under body text is a readability tax, not a feature."* That reasoning is about
**legibility**, and it is sound as far as it goes. The review's point is different and
takes precedence: Law 6 is about *what the texture is attached to*. A dot screen behind
the readout is still texture on the content surface; the frame is the hardware. Moving
it satisfies both concerns at once — the readout gets a fully clean surface, and the
texture lands on the part that is literally a physical bezel.

The review also says the halftone effect itself could be better.

- [ ] **Step 1: Read the current bezel and halftone rules**

```bash
cd /Users/abianco/Workspace-personal/control-room-design-system
grep -n 'cr-bezel\|halftone' packages/styles/styles/components.css packages/styles/styles/base.css
grep -n 'halftone' packages/tokens/dist/themes/control-room.css
sed -n '/^## Law 6/,/^---/p' references/design-language.md
```

- [ ] **Step 2: Write the failing test**

Create `tests/law6-texture.test.mjs`:

```js
// Law 6 — "Texture belongs to hardware, never to content."
// The bezel's halftone used to sit under the screen content. It belongs on the
// frame band: the frame is hardware, the screen area is where content lives.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(ROOT, "packages", "styles", "styles", "components.css"), "utf8");

/** The rule block starting at `selector` — brace-matched, so a `::before`
 *  block is not mistaken for its owner's. */
function block(selector) {
  const i = css.indexOf(selector + " {");
  assert.notEqual(i, -1, `${selector} must exist`);
  return css.slice(i, css.indexOf("}", i) + 1);
}

test("the bezel frame carries the halftone", () => {
  assert.match(block(".cr-bezel"), /halftone/, "the frame is hardware — texture belongs here");
});

test("no halftone layer sits inside the screen", () => {
  // It used to live on .cr-bezel__screen::before at z-index -1.
  const i = css.indexOf(".cr-bezel__screen::before");
  if (i !== -1) {
    const b = css.slice(i, css.indexOf("}", i) + 1);
    assert.doesNotMatch(b, /halftone/, "the screen surface must be clean");
  }
});
```

- [ ] **Step 3: Run it to verify it fails**

```bash
node --test tests/law6-texture.test.mjs 2>&1 | tail -8
```

Expected: the first test FAILS (`.cr-bezel` has no texture today) and the second FAILS
(`.cr-bezel__screen::before` currently carries it). If either already passes, re-read
Step 1's output — the code moved since this plan was written.

- [ ] **Step 4: Move the halftone to the frame and improve it**

Delete the `.cr-bezel__screen::before` halftone layer entirely (and the now-stale
comment defending it), then texture the frame. Two offset layers at different scales
read as a printed screen rather than one flat dot grid; keep both under
`--decoration-intensity` so the loudness dial still governs them:

```css
.cr-bezel {
  border: var(--brd-brush) solid var(--border); background: var(--panel-2); padding: var(--space-3);
  box-shadow: var(--shadow-off) var(--shadow-off) 0 var(--shadow-col);
  position: relative; isolation: isolate;
}
/* Texture on the hardware (Law 6). Two offset dot layers at different scales so
 * the frame reads as a printed screen, not one flat grid. */
.cr-bezel::before {
  content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none;
  background-image: var(--halftone), var(--halftone);
  background-size: var(--halftone-size) var(--halftone-size),
                   calc(var(--halftone-size) * 2.5) calc(var(--halftone-size) * 2.5);
  background-position: 0 0, calc(var(--halftone-size) / 2) calc(var(--halftone-size) / 2);
  opacity: calc(0.55 * var(--decoration-intensity, 1));
}
```

`.cr-bezel` needs `isolation: isolate` for the same reason the screen had it: it keeps
the `z-index: -1` layer inside the frame instead of painting behind the page.

- [ ] **Step 5: Run the test, screenshot both themes**

```bash
node --test tests/law6-texture.test.mjs 2>&1 | tail -5
node packages/styles/build/build-styles.mjs && pnpm run build:skill && pnpm run build:showcase
```

Open the Bezel + Screen card. Confirm the frame carries visible texture, content sits on a clean screen, and text over the screen is fully legible in both themes.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "fix(styles)!: move the bezel halftone onto the frame (Law 6)

Texture belongs to hardware, never to content — the halftone sat under the
screen content. Put it on the frame band and clear the screen surface, and give
the frame two offset dot layers so it reads as a printed screen."
```

---

## Phase 4 — Ship

### Task 13: Full verification and deploy

**Files:** none (verification only).

- [ ] **Step 1: Rebuild everything in dependency order**

```bash
cd /Users/abianco/Workspace-personal/control-room-design-system
node packages/styles/build/build-styles.mjs
pnpm run build:components
pnpm run build:skill
pnpm run build
```

- [ ] **Step 2: Run every gate CI runs**

```bash
pnpm run lint                    # must be 0 errors
pnpm run verify
pnpm run verify:types
for g in test:pkg test:contract test:theme test:tooling test:frameworks test:forms test:position test:rtl test:separation; do
  printf "%-18s " "$g"; pnpm run $g >/dev/null 2>&1 && echo OK || echo FAIL
done
node --test tests/*.test.mjs 2>&1 | tail -3
pnpm --filter @alebianco/cr-docs run test:a11y 2>&1 | tail -3
pnpm --filter @alebianco/cr-docs run test:islands 2>&1 | tail -3
pnpm --filter @alebianco/cr-docs run test:responsive 2>&1 | tail -3
```

All must pass. Lint must be **0 errors** — spec/scratch scripts belong outside the Biome `includes` globs.

- [ ] **Step 3: Manual pass over the whole browser, both themes**

Open `packages/docs/public/components.html`. For every card: exactly one live cell, controls reach every interesting state, nothing clipped, focus rings complete. Switch to `control-room-light` and repeat.

- [ ] **Step 4: Push and watch the deploy**

```bash
git push origin main
gh run watch "$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')" --exit-status
```

The visual-regression step is `continue-on-error` and has no baselines yet — expect it to fail without blocking.

- [ ] **Step 5: Verify the live site**

```bash
curl -sL https://alebianco.github.io/control-room-design-system/components.html -o /tmp/live.html
grep -c 'examples/console' /tmp/live.html      # expect 0
grep -c 'idx__filter' /tmp/live.html           # expect >0
```

---

## Deferred — not in this plan

- **Deploying `examples/console`.** Task 4 removed the dead public pointer and both
  `frameworks.md` and `forms.md` now state the app is source-only. Actually
  publishing it remains a separate decision (it would need its own build step in
  the Pages artifact).
- **Visual-regression baselines.** *(Resolved 2026-08-13 — the mechanism exists;
  one manual run is still required.)* Playwright baselines are platform-suffixed,
  so a maintainer's macOS run produces `-chromium-darwin` files CI can never
  match. Two changes close this:
  1. `.github/workflows/visual-baselines.yml` — `workflow_dispatch` job that
     regenerates baselines on `ubuntu-latest`, re-runs the gate against them to
     prove they are deterministic, and commits the `-chromium-linux` files.
  2. `tests/visual.spec.mjs` now asserts the baseline **exists** before
     comparing. Playwright's default is to write a missing baseline and pass,
     which reported a green visual gate that had compared nothing — the precise
     failure this suite exists to catch.

  **Remaining manual step:** run the "Visual baselines" workflow once on `main`
  (Actions → Visual baselines → Run workflow), then remove
  `continue-on-error: true` from the visual step in `deploy.yml`. It is left
  non-blocking until then because the suite now fails loudly on a missing
  baseline, and flipping both at once would red every build until that first run
  lands.
- **The `control-room` app extraction.** Tracked in `docs/superpowers/plans/2026-08-11-control-room-extraction.md`; unaffected by this work except that Task 6-8 change component APIs the app will consume.
