# Forms — schema-driven validation

Control Room forms have **one source of truth: a schema**. You author it once — as
an [ArkType](https://arktype.io) type *or* a JSON Schema — and the headless core
turns it into everything the UI needs: a renderable **Form Model**, a **validate**
function (backed by ArkType), and a portable **JSON Schema** export. No more
hand-set `invalid` booleans that can drift from reality — validity comes from the
schema.

The split matters:

- **`lib/forms`** — a framework-agnostic core. It knows about ArkType and JSON
  Schema. Pure data in, pure data out.
- **`<CrForm>`** — a component that renders + orchestrates a form from *plain
  data* (the Form Model + a validate callback). It never imports ArkType, so it
  stays portable across all six framework targets and adds no validation weight to
  apps that wire their own.

## The bridge runs both ways

```
   ArkType type ──.toJsonSchema()──▶  JSON Schema  ──(our converter)──▶ ArkType type
        │                                  │                                 │
        └──────────── Form Model ◀─────────┘                          validate(values)
```

- **ArkType-first** — best TypeScript DX: one definition gives you static types
  *and* runtime validation. Export JSON Schema for a backend or another service.
- **JSON-Schema-first** — the schema lives in a DB / is shared across services;
  the core converts it to an ArkType type at runtime to validate.

Either way validation runs through **ArkType** (one engine), and the Form Model is
derived from the JSON Schema (the lingua franca), so the two sources produce the
*same* form.

## Authoring

```ts
import { type } from "arktype";
import { defineForm } from "@control-room/design-system/forms";

// (a) ArkType
const Session = type({
  name: "string >= 2",
  endpoint: "string.url",
  replicas: "1 <= number.integer <= 32",
  region: "'eu-west' | 'us-east' | 'ap-south'",
  "notes?": "string <= 140",
  autoscale: "boolean",
});
const form = defineForm(Session, {
  order: ["name", "endpoint", "replicas", "region", "notes", "autoscale"],
  overrides: { name: { hint: "lowercase, no spaces" }, notes: { kind: "textarea" } },
});

// (b) JSON Schema — same result
const form2 = defineForm({
  type: "object",
  properties: {
    name: { type: "string", minLength: 2 },
    replicas: { type: "integer", minimum: 1, maximum: 32 },
    region: { enum: ["eu-west", "us-east", "ap-south"] },
  },
  required: ["name", "replicas", "region"],
});
```

`defineForm(schema, options?)` returns:

| key | what |
| --- | --- |
| `model` | `{ fields: CrFormField[] }` — the renderable Form Model |
| `validate` | `(values) => { valid, errors: { [name]: message }, data }` |
| `jsonSchema` | the exported JSON Schema (portable) |
| `arkType` | the ArkType type (for reuse / static inference) |

`options.overrides[name]` sets `{ label, kind, hint, placeholder, options, required, step }`;
`options.order` reorders / filters fields.

## Rendering

Feed the Model + a validator to `<CrForm>` and it does the rest — value / touched
/ error state, **validate on blur and on submit**, and **re-check a field on
change once it has been touched** (so an error clears as you fix it):

```tsx
<CrForm
  fields={form.model.fields}
  validate={(values) => form.validate(values).errors}
  onSubmit={(values) => create(form.validate(values).data)}
  title="New session"
  submitLabel="Create session"
/>
```

### Submit lifecycle, async validation & error summary

`validate` and `onSubmit` may be **async** (return a Promise) — a server-side
uniqueness check, a remote submit. While either is in flight the submit button
enters a **pending** state (disabled, `aria-busy`, showing `pendingLabel`), so a
slow submit can't be double-fired. After a failed submit, `CrForm` also renders a
form-level **error summary** (`role="alert"`) listing every problem with an
in-page link to the offending field; it clears when the form validates. Turn it
off with `errorSummary={false}`.

```tsx
<CrForm
  fields={form.model.fields}
  validate={async (v) => ({ ...form.validate(v).errors, ...(await nameTaken(v.name) ? { name: "Already in use" } : {}) })}
  onSubmit={async (v) => { await api.createSession(form.validate(v).data); }}
  pendingLabel="Creating…"
/>
```

### Controlled errors (server-side & Qwik)

Besides the synchronous `validate` prop, `CrForm` accepts a controlled **`errors`**
map (dotted path → message) that is always shown, merged over the internal
validator's. Use it to surface **server-side** errors after a submit, or to drive
validation entirely from the parent.

The parent-driven path is what makes `CrForm` work under **Qwik**, whose function
props are async QRLs that can't return a value across the resumability boundary
(so a synchronous `validate` prop can't be called there). Instead, validate inside
the async `onChange` / `onSubmit` handler and feed the result back through
`errors` — the Form Model is plain serializable data, so it crosses the boundary
fine:

```tsx
<CrForm
  fields={form.model.fields}
  errors={state.errors}
  onSubmit$={(v) => { const r = form.validate(v); state.errors = r.errors; if (r.valid) create(r.data); }}
/>
```

See `examples/console` for a live "provision a session" form wired this way.

### Validation modes

By default a field **first validates on blur**, then **re-checks on every change**
once it has validated (so an error clears as you fix it). Two props tune that:

| prop | when | values |
| --- | --- | --- |
| `mode` | when a field validates the **first** time | `"blur"` (default) · `"change"` · `"submit"` |
| `revalidateMode` | when an already-validated field **re-checks** | `"change"` (default) · `"blur"` |

`mode="submit"` holds all field-level errors until the first submit — quiet while
typing, strict at the end. `revalidateMode="blur"` stops mid-edit revalidation but
still clears a showing error on change (RHF's behaviour). Whatever the modes, a
submit always validates every (visible) field.

### Dirty & reset

`CrForm` tracks whether its values differ from the seed `values` it was given.
While the form is **dirty** it shows a **Reset** button that restores those seed
values and clears all errors / touched / pending state (fire `onReset` to hear
about it). Turn the button off with `resettable={false}`, relabel it with
`resetLabel`.

```tsx
<CrForm
  fields={form.model.fields}
  values={existing}          /* seed → "dirty" and Reset are measured against this */
  mode="submit"              /* stay quiet until the first submit */
  revalidateMode="change"
  resetLabel="Discard changes"
  onReset={() => trackDiscard()}
/>
```

### Conditional fields

Give a field a `when(values) => boolean` (via `overrides`) and it renders **and
validates only when the predicate holds** for the current values. A hidden field
is pruned from the validated payload, so a hidden required field never errors and
its stale value isn't submitted:

```ts
defineForm(schema, {
  overrides: {
    notify: { label: "Notify on change" },
    contact: { label: "Contact email", when: (v) => v.notify === true },
  },
});
```

`when` reads the whole form's values, so visibility can depend on any other field.

### Field kinds

Inferred from the schema (overridable): `text` · `email` · `url` · `number` ·
`select` (from an `enum`) · `autocomplete` (searchable / async — see below) ·
`textarea` (long strings, or forced) · `checkbox` (boolean) · `group` (nested
object) · `array` (repeatable).

### Nesting — groups & arrays

Object and array properties nest automatically. An object property becomes a
**`group`** (a labelled section with its sub-fields); an array property becomes an
**`array`** (a repeatable item with add / remove) whose `item` is either a scalar
field or a group. Values nest to match, and validation error paths are dotted with
array indices — `limits.cpu`, `members.1.email` — so each nested control shows its
own error. Depth is unbounded (the recursion lives in the core / render-list, not
in component self-recursion).

```ts
const Session = type({
  name: "string >= 2",
  limits: { cpu: "1 <= number <= 64", memGB: "number > 0" },   // → group
  "tags?": "string[]",                                          // → array of scalars
  "hooks?": type({ event: "'deploy'|'error'", url: "string.url" }).array(), // → array of groups
});
```

Nested overrides use the dotted path (no array index): `overrides["limits.cpu"] =
{ label: "vCPU" }`, `overrides["hooks.url"] = { placeholder: "https://…" }`. An
array override may set `itemLabel` for the per-item header.

### Composition — `$ref`, `allOf`, `oneOf`/`anyOf`

Real-world JSON Schemas rarely inline everything. The core resolves the three
composition keywords when converting a JSON Schema (either the one you author or
the one ArkType exports, which itself uses `$ref`/`$defs` for reused types):

- **`$ref`** — local pointers (`#/$defs/Address`, `#/definitions/…`) are resolved
  against the root schema, so a shared definition renders + validates wherever it's
  referenced. (Remote `$ref` URLs are not fetched — resolve them before authoring.)
- **`allOf`** — every branch is merged into one schema: `properties` combine and
  `required` unions. This is the "extend a base" pattern (a `Timestamped` mixin plus
  the entity's own fields become one flat field set).
- **`oneOf` / `anyOf`** — become a validating ArkType **union**: a value is accepted
  if it satisfies any branch. For rendering, the field takes the widget of its first
  non-null branch (so `[Address, null]` renders the Address group) while validation
  still honours the whole union.

```ts
defineForm({
  $defs: { Address: { type: "object", properties: { city: { type: "string" } }, required: ["city"] } },
  allOf: [
    { type: "object", properties: { name: { type: "string", minLength: 2 } }, required: ["name"] },
    { type: "object", properties: { billing: { $ref: "#/$defs/Address" } }, required: ["billing"] },
  ],
});
```

Cyclic `$ref` (a definition that references itself) is not expanded — the walker
builds a finite Form Model, so model a recursive shape as a bounded nesting instead.

### Autocomplete — searchable / async select {#autocomplete}

A select can draw its options from a **source** instead of a fixed list — give a
field `kind: "autocomplete"` and it renders a searchable combobox. The source is:

- a **static array** `{ value, label }[]`,
- the field's own **enum** (`kind: "autocomplete"` on an enum property makes it a
  searchable version of that select — no `source` needed), or
- an **async function** `(query) => Promise<{ value, label }[]>` for a remote lookup.

```ts
defineForm(schema, {
  overrides: {
    region: { kind: "autocomplete" },                 // searchable enum
    owner: { kind: "autocomplete", source: searchPeople }, // async: (q) => Promise<opts>
  },
});
```

Setting a `source` on a field implies `kind: "autocomplete"`. Type to filter (or
call the async source), `↑`/`↓` move the active option, `Enter` selects, `Esc`
closes; the picked option's **value** is stored (validated by the schema) while
its **label** is shown. The control is `role="combobox"` with `aria-expanded` /
`aria-controls` and a `role="listbox"` of `role="option"`s. A real async source
should debounce and order its own responses — the field renders whatever resolves.

### Coercion

Inputs are strings; the core coerces per field before validating — `number` →
`Number`, `checkbox` → `boolean` — **recursively through groups and array items**.
An **unchecked required checkbox is a valid `false`**, never "missing". Empty
optional fields drop out so `required` speaks for itself.

## Accessibility

Every field gets a real `<label for>`; `required` sets `aria-required` and a
visible `*`; an error sets `aria-invalid` and is linked with `aria-describedby` and
announced (`role="alert"`); hint text is linked the same way. The submit path uses
`noValidate` so the schema's messages show instead of the browser's.

## Per-field re-render isolation

`CrForm` stays a **controlled** form (the value store is the source of truth, so
Reset, autocomplete, coercion and `when` all just work) *and* re-renders only the
field you're editing — not the whole form — on every keystroke. React-Hook-Form
gets there by going *uncontrolled* with React-specific refs/context; `CrForm`
compiles to **six** frameworks from one source, so it uses a portable shape
instead:

- **Each row is its own component** (`CrFormRow`) that takes **only plain data
  props** — no function props. On React the compiled `CrFormRow` is wrapped in
  `React.memo` (by `build/build-fix-react.mjs`), so when the form re-renders, every
  row whose data didn't change bails out on a shallow compare. Only the edited
  row re-renders.
- **Input is delegated.** Instead of per-input handlers (which would be new
  closures each render and defeat the memo), `CrForm` attaches one set of listeners
  to the `<form>`; each control carries `data-path` / `data-kind` / `data-action`.
  The handlers live in the component body, recreated each render, so they always
  read the latest state — no stale closures.
- **The fine-grained targets get it for free.** Solid/Vue/Svelte/Qwik already
  update per-binding; the delegation is inert there. (blur/focus don't bubble on
  those five, so the `<form>` also carries `onFocusOut`/`onFocusIn` alongside
  `onBlur`/`onFocus` — React uses the bubbling `onBlur`/`onFocus`, the rest use
  `focusout`/`focusin`.)

The isolation is enforced by a test: `tests/showcase-islands.spec.mjs` types into
one field and asserts only that field's render counter ticked; `tests/pkg-react.test.mjs`
guards that `CrFormRow` still ships `memo`-wrapped. Even so, for an unusually large
form (hundreds of live fields) prefer splitting it into steps/sections.

## Limitations (honest notes)

- **ArkType alphabetises enum export.** `Type.toJsonSchema()` sorts enum members,
  so an ArkType-sourced `select` lists options alphabetically. Pass
  `overrides[name].options` (or author via JSON Schema, which preserves order) to
  control it.
- **A React dev-only warning for `onFocusOut`.** React doesn't know the
  `onFocusOut`/`onFocusIn` props `CrForm` attaches for the other five targets, so a
  React consumer's **dev** build logs one "Unknown event handler property" warning
  per form. It's stripped from production builds and is harmless (React uses the
  bubbling `onBlur`/`onFocus` we also attach). A React-only build could drop the two
  props, but Mitosis's `useTarget` mis-compiles target-split event handlers today,
  so both are emitted for every target.
- **Predicate constraints degrade on export.** Some ArkType constraints are
  predicates (e.g. `string.url` validates via `new URL()`) with no exact JSON
  Schema form. Export keeps a known `format` where ArkType has one (`url` →
  `format: "uri"`, which converts back to `string.url`) and otherwise falls back to
  the base type. Runtime validation always uses the full ArkType type — only the
  *exported* JSON Schema is approximate.
