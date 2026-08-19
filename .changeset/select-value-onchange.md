---
"@alebianco/cr-components": minor
---

`CrSelect` can report a selection and carry value/label pairs.

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
