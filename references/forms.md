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

### Autocomplete — searchable / async select

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

## Limitations (honest notes)

- **ArkType alphabetises enum export.** `Type.toJsonSchema()` sorts enum members,
  so an ArkType-sourced `select` lists options alphabetically. Pass
  `overrides[name].options` (or author via JSON Schema, which preserves order) to
  control it.
- **Predicate constraints degrade on export.** Some ArkType constraints are
  predicates (e.g. `string.url` validates via `new URL()`) with no exact JSON
  Schema form. Export keeps a known `format` where ArkType has one (`url` →
  `format: "uri"`, which converts back to `string.url`) and otherwise falls back to
  the base type. Runtime validation always uses the full ArkType type — only the
  *exported* JSON Schema is approximate.
