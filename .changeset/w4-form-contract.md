---
"@alebianco/cr-components": minor
"@alebianco/cr-styles": minor
---

Form validity is now consistent across every control. Eight controls
(`input-group`, `checkbox`, `radio-group`, `switch`, `number-field`, `pin-input`,
`tags-input`, `combobox`) previously had **no error styling at all**; they now
respond to a wrapping `CrField`'s error state like `CrInput` always did.

Every leaf control gains `invalid?: boolean` — an accessibility hook that sets
`aria-invalid`, nothing more. Visual error styling remains derived from the
wrapping field, so authors never set `invalid` for appearance. Leaf controls
deliberately do **not** take an `error` string: message rendering stays with
`CrField`/`CrFormRow`, and validation stays with `CrForm`.
