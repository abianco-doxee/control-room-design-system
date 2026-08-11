# Control Room 1.0 — Component Browser Review Remediation

**Date:** 2026-08-11
**Status:** approved for planning
**Scope:** ~65 review items against the Component Browser, remediated in ten phases, ending in a docs deploy.

## Goal

Close every item from the component-browser review and cut a clean 1.0. No
backward compatibility is required — breaking API changes are explicitly
permitted and preferred over deprecation shims.

## Key findings from code exploration

Three findings materially change the shape of the work. They are recorded here
because they are the reason the phase list is ten items and not sixty-five.

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

- **Form validity is applied unevenly, mostly in CSS.** `CrInput`/`CrTextarea`
  expose `invalid?: boolean`; `CrField` owns `error?: string`; nine other
  controls have no validity prop. These are not competing conventions but two
  layers of one contract (see "Validation ownership"). The larger gap is in the
  **stylesheet**, not the API: only `.cr-input`, `.cr-textarea` and `.cr-select`
  have any `.cr-field--error` styling, leaving **eight** parts with no error
  appearance at all. Error styling is derived from the wrapper's class and needs
  no prop; `invalid` exists only to set `aria-invalid`, which CSS cannot do.
- **`CrChoice` is one component with `type: "checkbox" | "radio"`**, which is
  precisely why the two control types look identical — same element, same parts,
  differing only in native input type. `CrRadioGroup` does not reuse it: it
  hand-rolls a **second** radio implementation with different DOM
  (`<button role="radio">` + `.cr-radio__box`). No checkbox-group exists.
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
| Validation ownership | **Three layers, already established in-repo.** See below. |
| Radio/checkbox grouping | **`CrChoiceGroup` replaces `CrRadioGroup`.** See W4b. |
| Deploy | Merge to `main`. See "Deploy mechanism" below. |

### Validation ownership (resolves the W4 open question)

The repo has already committed to a three-layer split; the defect is that it was
only carried through on some components, not that the architecture is unsettled.
`CrField.lite.tsx:27-32` states the doctrine outright: *"There is no hand-set
`invalid` boolean — validity comes from a validator, not a guess."*

| Layer | Components | Prop | Renders the message? |
| --- | --- | --- | --- |
| Container | `CrForm` | `validate`, `errors`, `mode`, `revalidateMode` | No — owns **deciding** validity |
| Field wrapper | `CrField`, `CrFormRow` | `error?: string` | **Yes**, plus all aria wiring |
| Leaf control | `CrInput`, `CrTextarea`, `CrSelect`, `CrChoice`, `CrSwitch`, … | `invalid?: boolean` | No — **styling only** |

Consequences:

- Leaf controls deliberately do **not** get `error?: string`. Two ways to render
  one message is the thing this contract exists to prevent.

#### Styling is derived; aria is not

The visual and accessible halves of "invalid" have **different** answers, and
conflating them overstates the work.

**Styling is already derived from the parent.** `input.css:12-14` is a descendant
selector — `.cr-field--error .cr-input, .cr-textarea, .cr-select` — so a wrapped
control gets its error border from `CrField`'s class with no prop involved.
`CrInput`'s `invalid` prop contributes **nothing** to styling; it sets only
`aria-invalid` and `data-state` (`CrInput.lite.tsx:42-43`), and its own comment
says so: *"a low-level aria hook — for real validation use CrField / CrForm."*

**`aria-invalid` cannot be derived.** CSS can style a descendant but cannot set
an attribute on one. A screen reader needs `aria-invalid="true"` on the focused
control itself; an error border on an ancestor is invisible to it. A
wrapper-sets-it-via-DOM approach was rejected: imperative DOM-poking is fragile
across six Mitosis targets and breaks SSR, since the attribute would be absent
from server HTML and appear only after hydration.

Resolution: **leaves keep `invalid?: boolean` as an aria-only hook**, and
`CrField` passes it down to the control it renders. Authors never set it for
looks. It is load-bearing for the **composite** leaves — `CrInputGroup`,
`CrPinInput`, `CrCombobox`, `CrTagsInput` — because those render their own inner
elements and only the component knows which one should carry the attribute; a
wrapper cannot reach inside them.

This splits W4 into two halves that were previously conflated:

| Half | Work | Components |
| --- | --- | --- |
| **CSS** (visible) | add `.cr-field--error` descendant rules | the **eight** parts with no error styling at all: `input-group`, `checkbox`, `radio-group`, `switch`, `number-field`, `pin-input`, `tags-input`, `combobox` |
| **Props** (a11y) | add `invalid?: boolean`, aria-only | the leaves lacking it, composites first |

Only `.cr-input`, `.cr-textarea`, `.cr-select` currently have any error styling —
so the stylesheet, not the component API, is where most of the real gap is. Note
`.cr-select` is already styled for error despite `CrSelect` having no prop,
which is consistent: styling never needed one.

The review item "InputGroup has no error prop" therefore resolves as: it needs a
`.cr-field--error` CSS rule for the visible defect, plus `invalid?: boolean` for
the a11y half — **not** `error?: string`.

## Deploy mechanism

`deploy` is not a command in this repo. `.github/workflows/deploy.yml` triggers
on **push to `main`**, builds, and publishes to GitHub Pages.

Consequences:

- All ten phases are executed on a feature branch, not on `main`.
- "Deploy the updated docs" == merging that branch to `main`.
- `release.yml` also fires on push to `main`, but is **dormant** — gated on the
  `RELEASE_ENABLED` repo variable, and even when enabled it only opens a
  "Version Packages" PR rather than publishing. Merging deploys docs; it does
  **not** publish to npm.
- The merge is therefore safely reversible, but it is an outward-facing publish
  and will be brought back to the user for explicit confirmation at the W9 gate
  rather than fired automatically.

## Phases

Ten workstreams (W1-W9, with W4b split out of W7). W1 and W2 are gates.

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

Apply the three-layer validation contract (see "Validation ownership") uniformly.
Two distinct halves — the CSS half is the larger and more visible one.

**CSS (the visible defect).** Add `.cr-field--error` descendant rules to the
eight parts that have **no error styling whatsoever**: `input-group`, `checkbox`,
`radio-group`, `switch`, `number-field`, `pin-input`, `tags-input`, `combobox`.
Extend `input.css:12-14`'s existing pattern rather than inventing a second one.
No component changes are needed for this half.

**Props (the a11y half).** Add `invalid?: boolean` — documented as an
**aria-only hook, never a style hook** — to the leaves lacking it. Prioritise the
composites (`CrInputGroup`, `CrPinInput`, `CrCombobox`, `CrTagsInput`), where it
is genuinely load-bearing because a wrapper cannot reach their inner elements.
Have `CrField` pass `invalid` down to the control it renders, so wrapped use
requires no author action.

Also:

- Leave `CrField`/`CrFormRow` owning `error?: string` and the message aria wiring.
- Do **not** add `error?: string` to leaves.
- Audit `onChange` signatures for consistency while here — payload types
  legitimately vary (`string` vs `number` vs `string[]`), but naming and arity
  should not.

### W4b · CrChoiceGroup *(breaking, structural)*

Promoted out of W7: this is a structural consolidation, not an ergonomics fix.

Today there are three overlapping things:

- `CrChoice` handles both types via `type: "checkbox" | "radio"` — which is
  exactly **why** the two controls look identical (same element, same parts).
- `CrRadioGroup` does **not** use `CrChoice`. It hand-rolls
  `<button role="radio">` with its own `.cr-radio__box` markup — a second,
  independent radio implementation with different DOM.
- There is **no checkbox-group equivalent**, so grouped checkboxes get no group
  label, no shared name, and no coordinated layout.

Resolution: build `CrChoiceGroup` rendering `CrChoice` internally, and delete
`CrRadioGroup`. The two types share layout, label, `disabled`, and the `invalid`
hook, but **must not** share the keyboard model:

| | `type="radio"` | `type="checkbox"` |
| --- | --- | --- |
| roles | `radiogroup` / `radio` | `group` + native checkboxes |
| `value` | `string` (single) | `string[]` (multiple) |
| keyboard | roving tabindex; arrows **move selection** | each independently tabbable; arrows inert |

Applying radio arrow-key selection to checkboxes would be an accessibility
defect, so the branch is mandatory rather than an implementation convenience.

Pairs with W7's divergent checkbox/radio box styling: once `CrChoice` is the
single implementation, making the two types look different is a one-place fix.

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

- Checkbox/Radio visual differentiation (a one-place fix once W4b makes
  `CrChoice` the single implementation); dark-theme visibility of the unchecked
  state, which is currently near-invisible in dark and very dark in light;
  eliminate the vertical shift on check.
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
W1 → W2 → (W3 ∥ W4 → W4b ∥ W5) → (W6 ∥ W7) → W8 → W9 → deploy gate
```

- W1 and W2 are hard gates for the reasons given above.
- W3, the W4→W4b chain, and W5 are independent of each other and may run in parallel.
- W4b follows W4: the group component needs the leaf `invalid` contract to exist
  before it can pass one down.
- W6/W7 are independent of each other; both depend on W5 for the shape vocabulary.
  W7's checkbox/radio differentiation additionally depends on W4b.
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

### Deleted components ripple past the source tree

`CrMeter` (W8) and `CrRadioGroup` (W4b) are removed outright. Each deletion must
also update, in the same phase:

- `catalog/registry.json` → regenerated `catalog/catalog.json` (drives both the
  Component Browser cards and the MCP server's queryable index).
- `ISLAND_IDS` in `build-showcase.mjs` **and** the matching `DEMOS` key in
  `build/showcase-islands.jsx` — `tests/showcase-islands.spec.mjs` asserts these
  stay in sync and will fail the build otherwise.
- Per-framework barrels and package types (`build:components`, `build:pkg`).
- Any `references/*.md` prose naming the component, plus the regenerated
  `llms.txt` / `llms-full.txt`.
- The per-component CSS part in `packages/styles` (`.cr-meter`, `.cr-radiogroup`).

New components (`CrChoiceGroup`) need the same list in reverse.

## Out of scope

- Enabling `RELEASE_ENABLED` / publishing to npm.
- Any consumer-side migration (the sprint dashboard extraction), which is a
  separate effort against the shipped 1.0.
