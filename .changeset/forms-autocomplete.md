---
"@control-room/design-system": minor
---

Forms: autocomplete sources for select fields. A `select` can now draw its options
from a **source** instead of a fixed list — a searchable combobox.

- New field `kind: "autocomplete"`. The source is a **static array**, the field's
  own **enum** (making a plain select searchable, no `source` needed), or an
  **async** `(query) => Promise<{value,label}[]>` for a remote lookup. Setting a
  `source` on a field implies `kind: "autocomplete"`.
- `CrForm` renders it as a `role="combobox"` (aria-expanded / aria-controls) over
  a `role="listbox"`: type to filter or trigger the async load, `↑`/`↓` move the
  active option, `Enter` selects, `Esc` closes. The picked option's **value** is
  stored (and schema-validated) while its **label** is shown. Per-field query /
  open / results / loading state is keyed by dotted path, so autocompletes inside
  groups and array items work too.

Component browser Form playground: `region` is now a searchable enum and a new
`owner` field uses an async source (a simulated remote person lookup). Docs updated
(new Autocomplete section). Islands e2e extended to drive both the static and async
autocompletes end to end (pick stores the value, not the label). a11y (4 themes),
responsive, islands, visual, type, and forms gates all green.

Build note: converted the CrForm source's inline `//` comments to block comments —
with Mitosis's React formatter off, a `//` comment can collapse onto one line and
comment out the code after it.
