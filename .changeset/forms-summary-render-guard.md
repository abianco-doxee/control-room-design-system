---
"@control-room/design-system": patch
---

Forms: stop the error-summary machinery from walking the whole render-list on the
typing path. A new cheap `hasSummary()` gate scans only the (small) error maps —
no model walk — so the full `errorList()` (which walks the render-list to pair
each error with its field label) now runs *only when a summary is actually shown*,
not on every keystroke.

Docs gain an honest "Controlled re-render (by design)" note: `CrForm` is a
controlled form (per-render work is O(visible fields)); React-Hook-Form's
uncontrolled + per-field-subscription approach has no portable equivalent across
the six compile targets, so we accept the trade and give guidance for very large
forms (split into steps; hidden `when` fields already drop out of the render).
All gates green.
