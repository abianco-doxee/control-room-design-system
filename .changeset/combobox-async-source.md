---
"@control-room/design-system": minor
---

CrCombobox: async source. The standalone combobox now takes an async
`source(query) => Promise<{value,label}[]>` in addition to a static `options`
list. When `source` is set it supplies (and filters) results per keystroke and a
`searching…` row shows while it resolves — the same source model as `CrForm`'s
`autocomplete` field. `options` becomes optional (either mode). The component
browser's Combobox playground gains an `async` toggle. Docs updated; a11y,
responsive, islands, and type gates green.
