# Control Room 1.0 — Component Browser Review Remediation

**Date:** 2026-08-11
**Status:** approved for planning
**Scope:** ~65 review items against the Component Browser, remediated in nine phases, ending in a docs deploy.

## Goal

Close every item from the component-browser review and cut a clean 1.0. No
backward compatibility is required — breaking API changes are explicitly
permitted and preferred over deprecation shims.

## Key findings from code exploration

Three findings materially change the shape of the work. They are recorded here
because they are the reason the phase list is nine items and not sixty-five.

### F1 — The positioning system already exists and is unused

`@alebianco/cr-utils/position` ships a complete collision-aware placement
helper: `computePosition` (pure math), `place` (DOM), and `autoPlace`
(scroll/resize-pinned), with `flip`, `shift`, `offset`, `padding`, and full
`${side}-${align}` placements.

No overlay component imports it. Instead:

- `CrPopover` has the algorithm **copy-pasted inline** (`CrPopover.lite.tsx:56-58`
  comments "Same algorithm as @alebianco/cr-utils/position"), computed **statically
  on open** — which is the cause of the reported open-flicker.
- `CrPopover`, `CrMenu`, `CrHoverCard` expose only `align?: "left" | "right"` —
  a single cross-axis with two values, no main axis, no `auto`, no viewport awareness.
- `CrTooltip` has no placement prop at all.

The four "position should be determined automatically" review items are therefore
**adoption of existing code plus deletion of a duplicate**, not new construction.

### F2 — The diagonal primitives have zero component usage

The four shapes of Law 4 — `cr-chev` (direction), `cr-notch` (state),
`cr-wedge` (focus), `cr-rail` (sequence) — exist in the stylesheet and appear
in exactly one place: the Component Browser's own demo card for
"diagonal-primitives".

Verified absent from `CrStepper`, `CrTabs`, `CrAvatar`, `CrHero`, `CrMasthead`,
`CrSegmented`, and `CrNav`. The design language defines a vocabulary that no
component speaks. This is a systemic gap, not four cosmetic misses.

### F3 — The dead-props bug is one pattern in four components

`CrAscii`, `CrSigil`, `CrCat`, and `CrChrome` paint imperatively inside
`onMount` with no `onUpdate`. The canvas is painted once at mount and never
repaints when props change.

The playground harness wires the props correctly
(`showcase-islands.jsx:1573-1635`) — the components ignore them. Three review
items ("props don't change the result") plus `CrChrome`, which was not reported
because the bug conceals itself.

### Supporting findings

- **Form validity is incoherent.** `CrInput`/`CrTextarea` use
  `invalid?: boolean`; `CrField` uses `error?: string`; and `CrSelect`,
  `CrInputGroup`, `CrNumberField`, `CrPinInput`, `CrTagsInput`, `CrCombobox`,
  `CrChoice`, `CrRadioGroup`, `CrSwitch` have **no validity prop at all**.
  "InputGroup has no error prop" is nine components missing it, and the two that
  have one disagree with the wrapper meant to own it.
- **`CrChoice` is one component with `type: "checkbox" | "radio"`**, which is
  precisely why the two control types look identical — same element, same parts,
  differing only in native input type. `CrRadioGroup` overlaps it.
- **`CrKeyHints` has no key-declaration API whatsoever** — only `revealKey`.
  Combo/sequence syntax is new API surface, not an extension.
- **`CrSpinner` takes no `signal` prop**, unlike `CrMeter` and `CrProgress`
  which both do. This is the "always blue" item and part of the signal-vocabulary
  inconsistency.
- **Theme-button chevron inconsistency** is generated: brand buttons are built
  with a trailing `▸` (`build-showcase.mjs:46`) that the four built-in buttons lack.

## Decisions taken

| Decision | Resolution |
| --- | --- |
| Backward compatibility | **Not required.** Break freely; no deprecation shims. |
| Meter vs Progress | **Merge Meter into Progress.** `CrMeter` is removed; `CrProgress` absorbs the `idle` signal and the `track` part. |
| Deploy | Merge to `main`. See "Deploy mechanism" below. |

## Deploy mechanism

`deploy` is not a command in this repo. `.github/workflows/deploy.yml` triggers
on **push to `main`**, builds, and publishes to GitHub Pages.

Consequences:

- All nine phases are executed on a feature branch, not on `main`.
- "Deploy the updated docs" == merging that branch to `main`.
- `release.yml` also fires on push to `main`, but is **dormant** — gated on the
  `RELEASE_ENABLED` repo variable, and even when enabled it only opens a
  "Version Packages" PR rather than publishing. Merging deploys docs; it does
  **not** publish to npm.
- The merge is therefore safely reversible, but it is an outward-facing publish
  and will be brought back to the user for explicit confirmation at the W9 gate
  rather than fired automatically.

## Phases

Nine workstreams. W1 and W2 are gates.

### W1 · Browser page + playground harness *(gate)*

The lens must be honest before any taste judgement is made through it.

- Compact the header theme list (currently consumes excessive width).
- Remove the generated `▸` chevron inconsistency on brand theme buttons.
- Fix the sidebar so it does not scroll away under the header; pin the filter to
  the top of the sidebar while the component list scrolls beneath it.
- Make prop-table ordering deterministic and consistent across all cards.
- Bring the playground to storybook-playground behaviour.

### W2 · Dead props / seeded generators *(gate)*

Add `onUpdate` repaint to `CrAscii`, `CrSigil`, `CrCat`, `CrChrome`. Until this
lands, no seeded component can be visually evaluated.

### W3 · Overlay positioning *(breaking)*

Adopt `cr-utils/position` in `CrPopover`, `CrMenu`, `CrHoverCard`, `CrTooltip`.
Replace `align: "left" | "right"` with a real `placement` model covering both
axes plus `auto`. Delete Popover's inline duplicate. Resolve the open-flicker by
replacing static-on-open measurement with `autoPlace`.

### W4 · Form contract *(breaking)*

One validity interface across all twelve form components. Choose a single shape
and apply it universally, including InputGroup's missing error state. Reconcile
`invalid: boolean` against `error: string`.

### W5 · Diagonal-primitive language

Make `CrStepper`, `CrTabs`, `CrAvatar`, `CrHero`, `CrMasthead` consume the four
Law 4 shapes. This is the "doesn't read as Control Room" cluster.

### W6 · Chrome & decoration

Bezel/Screen texture currently sits under the content; Accordion header chrome;
Alert frame and close-button consistency with Toast; DataGrid/Table chrome and
styled checkboxes; Breach content margin; Resizable drag handle distinctiveness;
Drip irregular spacing and sizing; Skeleton horizontal scanning animation;
Chrome "nuts-and-bolts" retune.

### W7 · Control ergonomics *(breaking)*

- Checkbox/Radio visual differentiation; dark-theme visibility of the unchecked
  state; eliminate the vertical shift on check. Resolve `CrChoice` vs
  `CrRadioGroup` overlap.
- Switch: on/off knob currently always renders on the left.
- ToggleChip: dark/light readability of pressed+hover; generalise `count: number`
  to a badge accepting text, number, icon, or boolean.
- Text input: in-field icons and a styled clear-content button.
- Textarea: bi-directional resize.
- Select: style the options popup.
- Calendar: dark-theme active+hover readability; month/year switcher; replace
  `weekStart: 0 | 1` with a named enum.

### W8 · API semantics *(breaking)*

- `CrKeyHints`: design and build a combo/sequence declaration API.
- Breadcrumb: replace the `/` default separator with a distinctive symbol; allow
  customisation.
- ToastRegion: pack identical messages with a counter; add center (vertical) and
  middle (horizontal) positions.
- Merge `CrMeter` into `CrProgress`.
- Add a `signal` prop to `CrSpinner`.
- Audit the tone/signal vocabulary across all components for consistent values
  and usage. Lands late because it depends on W5 and W7 being settled.

### W9 · Docs & examples

Keyed contact sheet example; decoration-utilities example; an Overflow demo that
shows something; Telemetry neutral (non-`ms`) decorative units; Masthead
"eyebrow" naming review; regenerate all bundles; build and verify the site.
Then the deploy gate.

## Sequencing

```
W1 → W2 → (W3 ∥ W4 ∥ W5) → (W6 ∥ W7) → W8 → W9 → deploy gate
```

- W1 and W2 are hard gates for the reasons given above.
- W3/W4/W5 are independent of each other and may run in parallel.
- W6/W7 are independent of each other; both depend on W5 for the shape vocabulary.
- W8 lands late: the signal audit needs W5 and W7 settled.
- W9 regenerates everything once, after all source changes.

## Verification

Each phase must leave the repo green:

- `pnpm run build` completes.
- The Playwright a11y and visual suites in `packages/docs/tests` pass.
- `tests/showcase-islands.spec.mjs` asserts `ISLAND_IDS` matches the `DEMOS`
  keys — any component added to or removed from the browser must keep these in
  sync.

Breaking changes are recorded in a changeset per phase, so the eventual Version
Packages PR carries an accurate migration note.

## Out of scope

- Enabling `RELEASE_ENABLED` / publishing to npm.
- Any consumer-side migration (the sprint dashboard extraction), which is a
  separate effort against the shipped 1.0.
