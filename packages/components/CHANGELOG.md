# @alebianco/cr-components

## 1.0.0

### Major Changes

- a3cae7f: First release — Control Room 1.0.0, published privately to GitHub Packages under the
  `@alebianco` scope.

  A neon-noir, neobrutalist design system for dense operational dashboards: the nine laws,
  a token layer driving four core themes and seven brand themes, 83 catalogued
  entries (76 components, 4 utilities, 3 blocks),
  interactive components compiled to six frameworks, a WCAG 2.1 AA contract enforced in CI,
  and AI-native surfaces (MCP server, `llms.txt`, queryable catalog, installable skill).

  Installing needs a GitHub token with `read:packages`. See the
  [changelog](https://github.com/alebianco/control-room-design-system/blob/main/CHANGELOG.md)
  for the full contents and
  [Getting Started](https://github.com/alebianco/control-room-design-system/blob/main/references/getting-started.md)
  to wire it up.

- c3d66b9: **Breaking:** overlay placement is now collision-aware and two-axis. `CrPopover`,
  `CrMenu` and `CrHoverCard` no longer accept `align?: "left" | "right"` — use
  `placement?: string` instead (`"bottom-start"` default, `${side}` or
  `${side}-${align}`). `CrTooltip` gains the same `placement` prop.

  All four now flip and shift to stay within the viewport. `CrMenu` and
  `CrHoverCard` previously had no placement logic at all (alignment was a CSS
  modifier); `CrPopover`'s panel no longer flickers on open.

  Migration: `align="left"` → `placement="bottom-start"`, `align="right"` →
  `placement="bottom-end"`.

- 61f7c71: **Breaking:** `CrRadioGroup` is removed, replaced by `CrChoiceGroup`, which
  handles both radio and checkbox grouping and renders `CrChoice` internally
  instead of hand-rolling a second radio implementation.

  The two types keep deliberately different keyboard models: radio uses a roving
  tabindex where arrows move the selection; checkbox makes every box independently
  tabbable with arrows inert. Radio takes `value` + `onChange`; checkbox takes
  `values` + `onChangeMany`.

  Migration: `<CrRadioGroup options value onChange />` →
  `<CrChoiceGroup type="radio" options value onChange />`.

- 3d48212: **Breaking:** `CrToggleChip`'s `count?: number` is replaced by
  `badge?: string | number | boolean` (a bare `true` renders a dot).
  `CrCalendar`'s `weekStart?: number` is replaced by
  `weekStart?: "sunday" | "monday"` — `0`/`1` carried no meaning at the call site.

  Also: checkbox and radio are now visually distinct, visible when unchecked in
  every theme, and no longer shift the row when toggled; the switch knob tracks
  its state instead of always sitting left; `CrToggleChip`'s pressed and hover
  states are legible in all four themes; `CrInput` gains `icon`, `clearable` and
  `onClear`; the textarea resizes in both directions; and the calendar gains a
  month/year switcher (`switcher`, `yearSpan`) plus a readable selected+hovered
  day.

  The calendar's selected day was unreadable while hovered — `.cr-calendar__day:hover`
  is two classes and outranked the single-class `--selected`, dropping the
  near-black selected foreground onto the plain hover surface at 1.30:1 (dark),
  1.32:1 (extreme) and 1.19:1 (phosphor). Hovering a selected day now keeps the
  accent, sunk 15% toward the calendar's own surface: 8.46 · 6.49 · 9.51 · 11.09
  across dark/light/extreme/phosphor, all clear of the 4.5:1 small-text bar.

  The switcher preserves the SSR contract: `month` and `today` stay injected and
  the component still never reads the clock. Its year list is derived from the
  _displayed_ year, and the month dropdown, year dropdown and the existing
  prev/next steppers all emit `onMonthChange` with the new `YYYY-MM`.

  Migration: `count={3}` → `badge={3}`; `weekStart={1}` → `weekStart="monday"`,
  `weekStart={0}` → `weekStart="sunday"` (or omit — sunday is the default).

- 4a38a6d: **Breaking:** `CrMeter` is removed — use `CrProgress`, which absorbs its `idle`
  signal and `track` part. The two components were near-duplicates with no
  articulable difference.

  `CrProgress` now renders an optional `label` inline before the bar, so it covers
  the capacity / utilisation reading Meter used to serve. Its root is now a flex
  wrapper and the bar itself is the new `.cr-progress__track` part — restyle any
  rule that targeted `.cr-progress` as the bar. The `.cr-meter` class family is
  gone.

  `role="progressbar"` and the `aria-value*` attributes also moved from the root
  down to the track, so selectors and tests matching
  `[role=progressbar].cr-progress` or `.cr-progress[aria-valuenow]` must now target
  `.cr-progress__track`.

  Migration: `<CrMeter … />` → `<CrProgress … />`.

- 71e9524: One canonical signal vocabulary, and two token splits that stop a colour meaning
  two different things.

  **`signal` is the only name for the state channel.** Every component that keys to
  Law 2's state ramp now spells the prop `signal` and draws its members from one
  list — `work · wait · done · err · idle · accent · accent2` — recorded in Law 2 of
  `references/design-language.md`. A component may still ship a _subset_, but only
  by dropping members from the tail, never by renaming one: `idle` is dropped where
  the component only exists while something is happening (Toast, Alert, Timeline),
  and `accent`/`accent2` are dropped from pure state readouts (StatusDot,
  SessionRow, Spinner, Progress) where an action key would be a category error.

  Two divergences turned out to be the same channel wearing a different name, so
  both are **breaking**:

  - `CrChip`'s `tone?: "done" | "alt"` is now
    `signal?: "work" | "wait" | "done" | "err" | "idle" | "accent"`. `alt` was never
    a separate concept — `.cr-chip--alt` resolved to `var(--sig-work)`, i.e.
    `signal="work"`. `done` stays the default and needs no modifier. Migrate
    `tone="done"` → `signal="done"` and `tone="alt"` → `signal="work"`. Chip gains
    the four members it was missing; all six variants clear 4.5:1 for their
    `--text-xs` label in all four themes.
  - `CrAlert`'s `signal="info"` is now `signal="work"` (and `.cr-alert--info` is
    `.cr-alert--work`). `info` already resolved to `var(--sig-work)`; it was the
    working state under a non-canonical name.

  **`--focus` is now its own token, separate from `--sig-work`.** WCAG 2.4.11 wants
  a focus indicator at 3:1 against the surfaces it touches, and the light theme's
  working cyan `#0891b2` reached only **2.86:1** against `--board`. The ring now
  draws in `--focus`, which tracks `--sig-work` exactly in dark, extreme and
  phosphor and darkens to `#00627a` in light — same hue, **5.38:1** at its worst
  surface (was 2.86). `--sig-work` itself is unchanged in every theme, so progress
  fills, spinners and status dots keep their existing colour and their `--on-sig`
  pairing. A brand that re-keys `--sig-work` can no longer silently break its own
  focus ring. This also fixes a latent bug: `.cr-chart__key:focus-visible` already
  referenced `var(--focus)`, which had never been defined.

  **`--seam` splits the chassis edge from the internal seam.** `--border` is
  near-black, so inside a panel it measured **1.21 / 1.21 / 1.01** on dark /
  extreme / phosphor — correct as an outer contour against the lighter board,
  invisible as a divider drawn within a panel. The new `--seam` role brackets
  between surface and ink in every theme (**5.19 / 7.02 / 7.45 / 6.26** against
  `--panel`), and three internal rules move onto it:

  | Rule                                        | before                     | after                     |
  | ------------------------------------------- | -------------------------- | ------------------------- |
  | `.cr-accordion__item + .cr-accordion__item` | 1.21 / 20.34 / 1.21 / 1.01 | 5.19 / 7.02 / 7.45 / 6.26 |
  | `.cr-resizable__handle::before`             | 1.21 / 20.34 / 1.21 / 1.01 | 5.19 / 7.02 / 7.45 / 6.26 |
  | `.cr-grid__row` bottom rule                 | 1.07 / 4.46 / 1.07 / 1.03  | 5.19 / 7.02 / 7.45 / 6.26 |

  The grid row rule had been `color-mix(--cr-datagrid-border 55%, transparent)`,
  which was diluting a line that already sat below the floor — mixing a colour
  toward the background it matches lowers the ratio rather than raising it. Outer
  edges keep `--border`: `--cr-accordion-border` and `--cr-datagrid-border` still
  mean _chassis edge_, and the new `--cr-accordion-seam` / `--cr-datagrid-seam`
  mean _internal divider_. Both are per-component overridable as usual.

  `--seam` and `--focus` are theme values, not new required roles, so existing
  brands stay valid without changes. A brand that supplies neither now has them
  **derived**: `--focus` from `--sig-work` and `--seam` from `--muted`, re-derived
  whenever the source role (or the surface ramp) moves, and `--focus` additionally
  fitted so it clears 3:1 against every surface in that theme. Without this a brand
  whose `$modes.light` flips `$scheme` to light while still `$extends`-ing `dark`
  would inherit the dark ring onto a near-white board (1.44:1). A brand that sets
  either token by hand keeps its own value. New `@alebianco/cr-utils` exports:
  `DERIVED_ROLES` and `deriveDerivedRoles`.

  **`CrPagination` uses the house direction glyphs.** Its prev/next controls were
  `‹ ›`, the only place in the library those appeared; they are now `◂ ▸`, the same
  solid triangles `CrCalendar` and `CrCarousel` already use for the identical
  control, each `aria-hidden` behind the button's `aria-label`. The marker-versus-
  control distinction is carried by the element, not by a second glyph shape — now
  recorded under Law 4.

### Minor Changes

- a17db6f: Clicking `CrModal`'s backdrop closes it.

  `CrModal`'s own comment says the native `<dialog>` gives "focus-trap,
  Escape-to-close, and the backdrop … for free". Two of those three are true: the
  top layer, the focus trap and Escape all come from the platform, and Escape
  reaches `onClose` because `cancel` is followed by `close`. **Backdrop-to-dismiss
  is not native** — `::backdrop` was styled but had no click handler, so clicking
  outside the modal did nothing.

  The dialog now closes when a click's target is the dialog element itself, which
  is the standard test for a backdrop hit: children sit inside the padding box, so
  a click on any of them has a descendant as its target.

  Found by the control-room port, whose own dialog routed Escape, the backdrop and
  the close button to one handler precisely so parent state could not drift from
  the element.

- 38fdfd3: `CrSelect` can report a selection and carry value/label pairs.

  It previously took `options: string[]` with no `value` and no `onChange`, which
  made it presentational only: there was no way to read what the user picked, and
  no way to model a stored key with readable copy (`{ value: "wip", label: "In
progress" }`). Any real form had to drop back to a bare `<select>`.

  Adds:

  - `value?: string` — the selected value, for a controlled select.
  - `onChange?: (value: string) => void` — fires with the new value.
  - `options` now accepts `{ value, label }` objects as well as bare strings. A
    bare string stays both the value and the label, so existing call sites are
    unaffected.

  Found by the control-room port, whose `SelectField` could not be swapped onto
  this component at all.

- 38cdb6f: Form validity is now consistent across every control. Eight controls
  (`input-group`, `checkbox`, `radio-group`, `switch`, `number-field`, `pin-input`,
  `tags-input`, `combobox`) previously had **no error styling at all**; they now
  respond to a wrapping `CrField`'s error state like `CrInput` always did.

  Every leaf control gains `invalid?: boolean` — an accessibility hook that sets
  `aria-invalid`, nothing more. Visual error styling remains derived from the
  wrapping field, so authors never set `invalid` for appearance. Leaf controls
  deliberately do **not** take an `error` string: message rendering stays with
  `CrField`/`CrFormRow`, and validation stays with `CrForm`.

- ba62f37: Chrome and decoration pass: bezel texture now sits above its content (and is
  click-through); the alert frame is stronger and its close button matches the
  toast's; the data grid and table gain chrome and system-styled selection
  checkboxes; accordion headers, breach padding, the resizable grip and data-list
  key/value alignment are fixed; `CrDrip`'s bleed is irregular rather than evenly
  spaced; `CrSkeleton` gains a reduced-motion-aware scanning sweep; and
  `CrChrome`'s hardware motifs are retuned from fasteners to instrument
  graduations.
- 3b607c3: `CrKeyHints` gains a real key-declaration API. It previously had no way to
  declare keys at all — only `revealKey`, which controls the hold-to-peek gesture.

  Pass `hints: { keys, label }[]` to render a shortcut legend. The `keys` string
  uses the notation readers already know from editors and docs: `+` joins a
  **chord** (pressed together), a space joins a **sequence** (pressed in order),
  and the two combine.

  ```tsx
  <CrKeyHints
    hints={[
      { keys: "Ctrl+K", label: "Open the command palette" },
      { keys: "g p", label: "Go to the sprint board" },
      { keys: "Ctrl+K p", label: "Palette, then pin" },
    ]}
  />
  ```

  Chords and sequences are drawn **differently**, because that distinction is the
  whole point of the syntax: chord members sit tight around a `+` glyph, sequence
  steps are pushed apart by the italic word _then_. Parsing is forgiving — any
  whitespace run splits a sequence, a dangling joiner is dropped (`"Ctrl+"` →
  `Ctrl`), and a literal plus key is recovered at any position in a chord
  (`"Ctrl++K"` → `Ctrl` `+` `K`).

  Accessibility: every keycap and both separators are `aria-hidden`, so a screen
  reader never hears a run of unlabelled boxes. Each binding instead carries an
  `aria-label` of the spoken form and its description ("Control plus K, then P:
  Palette, then pin"). The label sits per binding rather than on the list, so
  bindings stay separately navigable.

  `aria-keyshortcuts` is emitted only for single-step bindings. WAI-ARIA defines
  that value as a space-separated list of **alternative** combinations pressed
  simultaneously, so putting a sequence in it would assert "g **or** p" — the
  opposite of this syntax's meaning. Sequences omit the attribute rather than
  state something false; the `aria-label` carries the meaning either way.

  This is additive: `revealKey` is unchanged, and with no `hints` the component
  still renders nothing visible and behaves exactly as before. The two features are
  independent — the legend does not fade with the peek gesture, since its keycaps
  are always-on rather than `.cr-kbd--hint`.

  New `.cr-keyhints--legend` styles ship with the `kbd` style part, and new parts
  `item` · `keys` · `chord` · `plus` · `then` · `label` join the styling contract.

- 8ad4bf8: `CrToastRegion` packs identical toasts and gains five new anchors.

  Consecutive toasts sharing the same `message` **and** `signal` now collapse into a
  single row carrying a `×N` counter, so a retry storm costs one row instead of ten.
  Only _consecutive_ runs pack — an unrelated toast in between keeps the occurrences
  separate and preserves arrival order.

  The new `CrToastGroup` type carries two ids on purpose: `id` is the **oldest**
  member's (stable identity, so the row is patched rather than remounted as the run
  grows) and `newestId` is the **dismiss target** passed to `onDismiss`, so
  dismissing removes the toast the user is actually looking at. Keying the row on
  `newestId` would remount it on every duplicate and refire its live region; a
  cross-framework gate now enforces that in all six compiled targets.

  The counter is `aria-hidden`. It is the only thing that changes when a duplicate
  arrives, so the live region's announced text stays byte-identical and a repeat
  updates the count instead of re-announcing — important because `err` toasts
  announce _assertively_.

  `position` grows from four corners to nine anchors: the two horizontal centers
  (`tc`, `bc`) and the three vertical middles (`ml`, `mr`, `mc`) join `tr`/`br`/`tl`/`bl`.
  Centred anchors use `50%` plus a `translate`, so the region keeps its shrink-to-fit
  width. `bc` stacks newest nearest the edge, like the other bottom anchors.

  New styling part: `count` (`.cr-toast__count`).

### Patch Changes

- 2583b74: The five canvas components survive an unavailable 2D context.

  `CrCat`, `CrSigil`, `CrAscii`, `CrChrome` and `CrDither` all called
  `canvas.getContext("2d")` and dereferenced the result immediately. Each guarded
  that the _method_ exists, but not that the call succeeds — `getContext` can throw
  as well as return null: a headless DOM, a canvas-blocking privacy mode, or an
  exhausted context pool all do it. The result was a thrown `NotYetImplemented`
  that took the whole render down, and in a loop it exhausted the heap.

  All five now `try`/`catch` the call and bail out when there is no context. The
  painting is decorative in every case, so a missing canvas should cost the
  drawing, not the page.

  Found by the control-room port: swapping its local pixel-cat — which wrapped
  `getContext` in a `try`/`catch` precisely because a test DOM has no 2D context —
  for `CrCat` crashed the app's whole test run with a heap exhaustion.

- 3bdcfaf: `CrInput` and `CrTextarea` fall back to `currentTarget` when reading the typed
  value.

  Both read `event.target.value` in their `onInput`. That is correct in a browser
  and is the convention across the library, but it assumes `target` is always
  populated — and a synthetic event dispatched without one makes the handler throw
  `Cannot read properties of null`, taking the whole component down rather than
  just missing a keystroke.

  `(event.target || event.currentTarget)` is strictly more robust: on a real input
  event the two are the same element, so browser behaviour is unchanged.

  Found by the control-room port. Note this does NOT make the handler testable
  under Qwik's `userEvent()`, which populates neither `target` nor `currentTarget`
  — only the element it passes as the handler's second argument — so a component
  reading the event cannot be exercised there at all. The fallback is kept because
  a null-target event should degrade to a missed keystroke, not a thrown
  TypeError that unmounts the component.

  Worth recording separately: the library has no test anywhere that asserts
  `onChange` actually fires. `test:forms` covers value coercion, not dispatch,
  which is why the fragility went unnoticed.

- 52a57cf: `CrRelativeTime` emits a valid `datetime` attribute on every target.

  The source spelled it `dateTime`. React and Vue map that camelCase form onto the
  DOM attribute, but **Qwik, Svelte and Solid emit it literally**, so those three
  rendered `<time dateTime="…">` — not a valid HTML attribute, which means the
  machine-readable instant was silently lost for assistive technology and for
  anything parsing the markup.

  Found by a consumer app rendering `CrRelativeTime` in Qwik: the served HTML
  carried `dateTime=` where `datetime=` was required. jsdom-style attribute lookups
  are case-insensitive, which is why component tests could not see it.

- 25da19d: Seeded canvas components (`CrAscii`, `CrSigil`, `CrCat`, `CrChrome`) now repaint
  when their props change. They previously painted once on mount and ignored every
  subsequent prop update, so `seed`, `state`, `size`, `variant`, `width` and
  `height` had no effect after first render.
- Updated dependencies [a3cae7f]
  - @alebianco/cr-icons@1.0.0
