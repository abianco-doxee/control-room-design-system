# Scope — cascading `pt`/`dt`/`locale` + localisation

Status: **scope for review, not yet implemented.**
Date: 2026-08-16.

Two requests that turn out to share one missing primitive:

1. `pt`/`dt` should resolve **global → parent → component**, like PrimeVue.
2. Components should be **localisable** (29 hardcoded English strings, English-only
   `CrCalendar`).

Both need a context tier the library does not have. Scoping them together is what
makes them cheap; scoping them apart pays for the same primitive twice.

## The finding that makes this feasible

Mitosis `createContext`/`useContext` **compiles to idiomatic native code on all six
targets** — verified by building a probe component and reading the output:

| target | compiles to |
| --- | --- |
| React · Solid · Qwik | `useContext(CrContext)` |
| Vue | `inject(CrContext.key)` |
| Svelte | `getContext(CrContext.key)` |
| Angular | constructor DI (`public cr: CrContext`) |

This is a **portable, single-source** tier — unlike named node slots, which
Vue/Svelte/Angular stringify and which therefore need per-target overrides. The
per-target-override cost (three codebases per component) does **not** apply here.

Known gotcha: `mitosis.config.js` sets `files: "components/**"`, so a context module
outside `components/` builds silently but is never emitted to `dist`. The glob must be
widened, and a build guard should assert the context file exists in every target.

## Current state

**`pt`/`dt`: one tier only.** `lib/pt.ts` is three pure functions reading `props.pt`
alone — no global lookup, no provider, nothing to merge with. The only global `pt` in
the repo is the hand-written Vue `CrTabs` override (`inject('crGlobalPT')` +
`mergeProps`): one component, one target.

Two consequences: no app-level defaults (every call site repeats its `pt`), and
consumer handlers in `pt` **overwrite** rather than chain, because `ptAttrs` spreads
the bag.

**Theming already cascades** — `data-theme` on any subtree, `dt` custom properties
inheriting down. CSS provides that for free; it is not part of this work.

**Localisation: absent.** No `locale`, `messages`, or `labels` prop anywhere.

## Part 1 — the cascade

### Design

One context, one shape, consumed by the existing helpers:

```ts
// packages/components/context/cr.context.lite.ts
export default createContext({
  pt: {} as Record<string, any>,   // per-component-type default pt
  locale: "en",
  messages: {} as Record<string, string>,
});
```

Resolution order, matching PrimeVue: **global (context) → component (`props.pt`)**,
with the component winning. A true *parent* tier (a Panel styling its descendant
Rows) is deliberately **out of scope** — it needs per-component nested context and
buys much less than the global tier.

`lib/pt.ts` grows a resolved-global argument rather than reading context itself (the
helpers must stay pure functions — that purity is what lets Mitosis state-process
them inside a JSX spread, per `references/styling-contract.md`):

```ts
ptClass(pt, unstyled, base, part, globalPt?)
ptAttrs(pt, part, globalPt?)
ptStyle(pt, dt, part, globalPt?, globalDt?)
```

Each component calls `useContext` once and threads `cr.pt?.[componentName]` in.

### Cost and risk

- **~70 components** each gain one `useContext` line and a threaded argument. Mechanical
  but wide — every component file changes.
- **Listener chaining stays unsolved.** Merging class/style/attrs is portable;
  *chaining* two handlers is not (`ptAttrs` spreads, last write wins). Vue's
  `mergeProps` does it natively, which is exactly why the `CrTabs` override exists.
  Portable chaining would need a hand-rolled compose in `pt.ts`, and per-framework
  event-name casing (`onClick` vs `onclick`) makes that unreliable. **Recommend
  documenting this as a known limit rather than faking it.**
- **SSR:** context must have a default value so a component rendered outside any
  provider still works. The shape above defaults to empty, so it does.

## Part 2 — localisation

### The 29 strings

Hardcoded accessible names, by component — these are what a screen-reader user hears,
with no override today:

| component | strings |
| --- | --- |
| CrPagination | "Previous page" · "Next page" · "Page N" (4) |
| CrCalendar | "Previous month" · "Next month" · "Month" · "Year" (4) |
| CrPalette | "Command palette" · "Search commands" (3) |
| CrCarousel | "Previous slide" · "Next slide" · "Go to slide N" (3) |
| CrTable · CrDataGrid | "select row" · "Select all rows" · "Select row" (4) |
| CrNumberField | "Decrease" · "Increase" (2) |
| CrModal · CrDrawer · CrToast · CrToastRegion | "Close" · "Dismiss" (4) |
| CrInput · CrTagsInput · CrPinInput · CrNav · CrAlert | "Clear" · "Digit N" · … (5) |

### Dates — the inconsistency

`CrCalendar` hardcodes module-level `WD` / `MON` / `MON_FULL`, so an Italian user sees
"January". It *does* have `weekStart`, so it already concedes locale varies in layout
— just not in language.

Meanwhile `CrLineChart` has a real `xLocale` prop and ships Italian month names
(`gen`, `feb`, …). Same library, opposite answers, and the calendar is the component
where dates matter most.

**Recommend `Intl.DateTimeFormat`** for `CrCalendar` rather than more hand-kept
arrays — it is in every supported runtime, needs no table, and covers every locale.
`CrLineChart`'s hand-rolled `monNames` should fold into it too, so there is one
mechanism. Caveat: `Intl` output must be computed inside a `useStore` getter, since
Mitosis strips free consts from compiled output (documented in `CrTelemetry`).

### API

Per-component `labels` prop (portable — plain strings compile everywhere), defaulting
to English, with the context supplying app-level defaults:

```tsx
<CrPagination labels={{ prev: "Precedente", next: "Successiva", page: "Pagina" }} />
// or globally, once, via the same context as pt:
{ locale: "it", messages: { "pagination.prev": "Precedente", … } }
```

Resolution: `props.labels` → context `messages` → built-in English.

## Sequencing

The cascade lands first — localisation's global tier is the same context, so building
it second is nearly free.

1. **Context primitive** — module, config glob fix, build guard, SSR default. Carries
   `pt`, `locale` and `messages` from the start, so nothing needs revisiting later.
   Small, and de-risks everything after it.
2. **Cascade in `pt.ts`** + thread through ~70 components. Wide, mechanical.
3. **Message + locale resolution, with built-in English defaults** — a `messages.ts`
   holding the ~29 default keys, plus `resolveMessage(props.labels, ctx.messages, key)`
   and `resolveLocale(props.locale, ctx.locale)`. Then `labels` props on the 16
   components that hold the strings, and `locale` props on the ones that format.
4. **`Intl` dates** — `CrCalendar` off its hardcoded arrays, `CrLineChart`'s
   `monNames` folded in, keeping the timezone-calculator path pinned to `en-US`.
5. **`CrRelativeTime` hybrid** — `Intl.RelativeTimeFormat` with the per-locale
   style table, applied in lockstep to `@alebianco/cr-utils`' `relativeTime`.
   Ships last because it is the only step that can change rendered output
   (non-English only; English is byte-identical, which is the regression check).
6. **PT hooks** — `pt.hooks.onMounted` / `onUpdated` / `onUnmounted` from the single
   source, plus the two Solid/Qwik unmount overrides. Independent of steps 1–5; can
   run in parallel.
7. **Composition + parent tier** — extract `CrCheckbox`, replace the three hand-rolled
   copies, teach the helpers nested sections, forward at every nesting site, and add
   the contract test. Largest step, and the only one that changes component structure,
   so it wants its own review and fresh visual baselines.

Steps 3–4 are additive and non-breaking. Step 2 changes every component file but not
their rendered output — visual baselines should not move, which is the check that it
was done right.

## DECIDED — the localisation model

> `Intl` where possible; built-in messages for the rest, customisable through the
> same cascading system.

So there are exactly **two** sources of localised text, and no third:

**A. Anything `Intl` can derive — use `Intl`, never a table.** Month names, weekday
names, date/number/relative-time formatting. Driven by the resolved `locale`
(`props.locale` → context → `"en"`, see above). No shipped translation table, nothing
to maintain, every locale works on day one.

- `CrCalendar`: replace the module-level `WD` / `MON` / `MON_FULL` with
  `Intl.DateTimeFormat(locale, { month: "long" | "short" })` and
  `{ weekday: "short" }`.
- `CrLineChart`: delete the hand-rolled `monNames` (`gen`, `feb`, …) and take month
  names from the same helper.
- `CrRelativeTime`: **DECIDED — the hybrid.** See the dedicated section below; the
  same change applies to `@alebianco/cr-utils`' `relativeTime`, which holds identical
  phrasing and must move with it or the library contradicts itself.

### `CrRelativeTime` — the hybrid, and why `narrow` is the right style

Investigated whether Moment or date-fns supply localised *short* relative times.
**Neither does.** date-fns' `formatDistanceStrict` returns
`locale.formatDistance("xMinutes", …)` on every branch, and its locale tables hold only
prose (`"{{count}} minutes"`) — the `narrow`/`short`/`abbreviated` widths it ships are
for day/month **names**, not distances. Moment's `fromNow()` is prose too; you *can*
get short forms via `updateLocale({ relativeTime: { mm: "%dm" } })`, but that is
**you hand-authoring the compact strings per locale** — the translation table this
model explicitly rejects — plus global mutation and 67kB from a project in maintenance
mode. So a dependency buys nothing here.

`Intl.RelativeTimeFormat` does, and its **`style: "narrow"`** output is byte-identical
to the current hand-rolled English:

| locale | −5 min | +2 h | 0 |
| --- | --- | --- | --- |
| en | `5m ago` | `in 2h` | `now` |
| it | `5 min fa` | `tra 2 h` | `ora` |
| de | `vor 5 m` | `in 2 Std.` | `jetzt` |

So for English this is a **zero-change refactor** — same output, now localised — and
`numeric: "auto"` supplies the `"just now"` case via `format(0, "second")` for free,
retiring the hand-written 45s threshold.

**The one real defect: French `narrow` collapses to bare signs** — `-5 min` / `+2 h`,
which reads as a delta, not a time. `style: "short"` fixes it (`il y a 5 min` /
`dans 2 h`) but costs the English register (`5 min. ago`, not `5m ago`).

**Resolution — pick the style per locale, defaulting to `narrow`:**

```ts
// narrow keeps the house voice; a few CLDR locales render it as a bare +/- sign,
// which reads as a delta rather than an elapsed time. Those take `short`.
const SIGN_ONLY_NARROW = new Set(["fr"]);   // verify per locale before adding
const style = SIGN_ONLY_NARROW.has(lang) ? "short" : "narrow";
```

That is a **behaviour** table (which style reads correctly), not a translation table —
a handful of entries, no per-locale copy to maintain, and it degrades safely: an
unlisted locale gets `narrow`, which is correct for every one measured except French.

**Consequence for the message keys:** the `"ago"` / `"in"` wrapper needs **no**
`messages` entries — `RelativeTimeFormat` supplies it per locale. That removes the two
keys previously scoped here. The `messages` cascade still covers the other ~29 strings,
which `Intl` genuinely cannot derive.

**Unit selection stays ours.** `Intl` formats a (value, unit) pair; choosing *which*
unit (the existing d → h → m → s ladder, largest non-zero) remains
`humanDuration`-style logic. Keep it, and keep the SSR discipline: `now` stays a
required argument, never read internally.

**B. Everything else — built-in English messages, overridable through the cascade.**
The 29 accessible names ("Close", "Previous page", "Select row") are UI copy that
`Intl` cannot derive. Ship English defaults so the library is correct out of the box,
and let `messages` override any key at global or component level.

Resolution for a message key: `props.labels` → context `messages` → built-in English.
Same precedence as `pt`, one mental model for the whole library.

### `locale` cascades on the same rule

`locale` is configurable and cascading exactly like `pt` and `messages` — it is not a
global-only setting. Every component that formats anything takes an optional
`locale?: string` prop, and resolution is:

```
props.locale  →  context locale  →  "en"
```

```tsx
// app-wide default, set once
<CrProvider locale="it"> … </CrProvider>

// one component overriding it — a UTC/en audit log inside an Italian app
<CrCalendar locale="en-GB" month="2026-08" />
```

Three reasons the per-component tier is required, not decorative:

- **Mixed-locale screens are real.** An operator console may run Italian chrome while
  a compliance table stays `en-GB`, or one panel renders a customer's locale rather
  than the operator's.
- **It matches the other two axes.** `pt` and `messages` both resolve
  component-over-global; a `locale` that only worked globally would be the one
  inconsistent knob in the system.
- **It keeps `Intl` and `messages` in step.** Both are locale-driven; if `messages`
  can be overridden per component but `locale` cannot, a component can end up with
  Italian labels and English month names.

Implementation is one shared helper next to the message resolver, so no component
hand-rolls the fallback:

```ts
resolveLocale(props.locale, ctx.locale)   // → props.locale || ctx.locale || "en"
```

**Not affected:** the `en-US` pin inside `CrLineChart`'s timezone math. That is not a
display locale and must never read either tier (see the two-`Intl`-uses constraint
below).

### Verified: `Intl` is safe on all six targets

Not a guess — `CrLineChart` already calls `Intl.DateTimeFormat` today and the call
survives compilation intact on React, Vue, Svelte and Angular (`grep` of the built
output finds it in each). So the `Intl` half carries no codegen risk.

Two constraints it must respect, both already established in this codebase:

1. **Compute inside a `useStore` getter.** Mitosis strips free consts from compiled
   output — documented in `CrTelemetry`, and the reason `CrLineChart`'s date helpers
   live in `useStore`.
2. **Do not confuse the two `Intl` uses.** `CrLineChart` pins `"en-US"` *on purpose*:
   it uses `Intl` as a timezone calculator, reading numeric parts via
   `formatToParts`, where the language is irrelevant and a locale-dependent string
   would be a bug. Only the **display** helpers (month/weekday names) take the user's
   `locale`. Keep those two paths separate when folding `monNames` in.

### SSR

`Intl` output can differ between a server and a browser with different ICU data,
which shows up as a hydration mismatch. The existing components dodge this by
injecting `month` / `today` as props rather than reading a clock. Keep that: `Intl`
formats **injected** values, so server and client format the same input, and the
`locale` must come from the cascade (explicit) rather than from
`navigator.language` (environment-dependent).

## DECIDED — parent tier: keep it, and nest more

> "Keep the parent tier and push for more nesting in components. Complex components
> like tables — it's weird that they don't nest already."

The observation is correct and the current state is worse than "little nesting": it is
**duplication**. `CrTable`, `CrFormRow` and `CrChoice` each hand-roll
`<input type="checkbox" class="cr-check">` inline, and **no `CrCheckbox` component
exists** to nest — the catalog has no `check` or `radio` entry. The same is true of
`CrTable`'s sort button, which reimplements button behaviour inline rather than using
`CrButton`.

So the parent tier is not being added for its own sake; it is the API half of a
composition fix. Today there are only **8 nesting sites** in the whole library and
**none forwards `pt`**, so an inner `CrIcon` (inside `CrInput`) or `CrKbd` (inside
`CrKeyHints`) is unreachable through the styling contract.

### Work

1. **Extract the missing primitives** — `CrCheckbox` first (three hand-rolled copies),
   then audit `CrTable` / `CrDataGrid` for sort-button and cell-level reuse.
2. **Nested `pt` sections**, PrimeVue's `pc`-prefix convention adapted:
   `pt={{ check: { root: { … } } }}`. This is a real change to the helpers —
   `ptAttrs` currently spreads every non-`class`/`style` key onto the DOM element, so a
   nested object would be emitted as a garbage attribute. The helpers must learn which
   sections are components, not attribute bags.
3. **Forward at every nesting site**, and add a contract test asserting it, so a new
   nested component cannot silently become unreachable.
4. **Decide `unstyled` propagation** — PrimeVue propagates to children. Recommend
   matching that, and asserting it in the same test.

Precedence becomes **global (context) → parent (forwarded `pt`) → component
(`props.pt`)**, matching PrimeVue exactly.

## DECIDED — PT hooks: portable on all six targets

> "I do like the hook feature of PrimeVue pt. Find a way to make it work in all
> targets. A focused language-specific override for this is fine."

**A probe shows no override is needed for the common case.** A component calling
Mitosis' `onMount` / `onUpdate` / `onUnMount` and invoking `props.pt.hooks.*` compiles
to **native lifecycle on every target**:

| target | mount | update | unmount |
| --- | --- | --- | --- |
| React | `useEffect` | `useEffect` | `useEffect` cleanup ✅ |
| Vue | `onMounted` | `watch` | `onUnmounted` ✅ |
| Svelte | `onMount` | reactive block | `onDestroy` ✅ |
| Angular | `ngOnInit` | `ngAfterViewInit` | `ngOnDestroy` ✅ |
| Solid | `onMount` | `createEffect` | **not emitted** ⚠️ |
| Qwik | `useVisibleTask$` | `useVisibleTask$` | **not emitted** ⚠️ |

So `pt.hooks.onMounted` / `onUpdated` are fully portable from one source. The **only**
gap is unmount on Solid and Qwik, where Mitosis' `onUnMount` produced no output — both
frameworks have a native primitive for it (`onCleanup`, and a `useVisibleTask$`
cleanup return), so this is the focused per-target override the decision allows: two
small files, not six.

PrimeVue's full hook set is `onBeforeCreate` / `onCreated` / `onBeforeUpdate` /
`onUpdated` / `onBeforeMount` / `onMounted` / `onBeforeUnmount` / `onUnmounted`. Not
all map cleanly across six frameworks (React has no "before update"); recommend
shipping the three that do — **`onMounted`, `onUpdated`, `onUnmounted`** — and
documenting the omission rather than faking the rest.

## Still open — listener chaining

Distinct from hooks, and **not** solved by the above. A consumer handler passed as
`pt={{ tab: { onClick } }}` is spread onto the element, where the component's own
`onClick` overwrites it (or vice versa, depending on spread order) — one handler is
silently lost. Composing is easy; *detecting* which keys are handlers is not, because
Mitosis emits five different syntaxes for one event — verified in the built output:
React/Solid `onClick=`, Vue `@click`, Svelte `on:click`, Qwik `onClick$`, Angular
`(click)`. On the template targets an event binding is not a runtime-spreadable
property at all, so there is nothing to merge into.

Vue's `CrTabs` override chains correctly via the framework-native `mergeProps`. Options
remain: (a) document the limit and direct consumers to the component's own event props;
(b) per-target overrides using each framework's native merge primitive — the same shape
as the Solid/Qwik unmount overrides, but needed on all six.

Now that hooks are landing, (b) is more attractive than it was: several targets will
already carry a small override file.
