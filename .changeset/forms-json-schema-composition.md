---
"@control-room/design-system": minor
---

Forms core: JSON-Schema **composition**. `defineForm` (and the underlying
converter) now resolve the three composition keywords when normalising a JSON
Schema — including the `$ref`/`$defs` ArkType itself emits for reused types:

- **`$ref`** — local pointers (`#/$defs/…`, `#/definitions/…`) resolve against the
  root schema, so shared definitions render + validate wherever referenced (remote
  URLs are not fetched).
- **`allOf`** — branches merge into one schema (`properties` combine, `required`
  unions): the extend-a-base pattern.
- **`oneOf`/`anyOf`** — compile to a validating ArkType union; the field renders as
  its first non-null branch's widget while validation honours the whole union.

Detection (`isJsonSchema`) now recognises a schema expressed purely through
composition. Cyclic `$ref` is intentionally not expanded (the Form Model stays
finite) — documented in forms.md "Composition". Three new forms-core node tests
($ref group + nested error path, allOf merge of properties/required, anyOf union).
All gates green.
