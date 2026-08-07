---
"@control-room/design-system": minor
---

Forms: conditional fields. A field may carry a `when(values) => boolean`
predicate (via `overrides`) — it renders **and validates only when the predicate
holds** for the current values. Hidden fields are pruned from the validated
payload, so a hidden required field never errors and its stale value isn't
submitted. `when` reads the whole form's values, so visibility can depend on any
other field (including across groups and array items).

Component browser Form playground gains a conditional `contact email` shown only
when `notify` is checked. Docs: forms.md "Conditional fields". New forms-core
passthrough test + an islands e2e that toggles the field, validates it while
shown, and confirms it's pruned when hidden. All gates green.
