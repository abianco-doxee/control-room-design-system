---
"@control-room/design-system": minor
---

Forms: configurable validation modes + dirty tracking & reset. `<CrForm>` gains
`mode` (`"blur"` default · `"change"` · `"submit"`) for when a field **first**
validates and `revalidateMode` (`"change"` default · `"blur"`) for when an
already-validated field re-checks — matching React-Hook-Form's model. A showing
error always clears on change so a fix registers immediately; a submit always
validates every visible field regardless of mode.

The form now tracks **dirty** state against the seed `values` and, while dirty,
renders a **Reset** button that restores those seed values and clears all
error / touched / pending state. Toggle it with `resettable={false}`, relabel via
`resetLabel`, and hook `onReset`. Docs: forms.md "Validation modes" and
"Dirty & reset". New islands e2e asserts the default blur-first mode (a pristine
field doesn't error until blur) and the dirty→Reset→pristine cycle. All gates green.
