---
"@control-room/design-system": minor
---

Forms: async validation, submit lifecycle, and a form-level error summary.

- **Async `validate` / `onSubmit`** — both may now return a Promise (server-side
  uniqueness checks, remote submit). `CrForm` normalises sync and async the same
  way.
- **Pending submit state** — while validation or submit is in flight the submit
  button is disabled, `aria-busy`, and shows `pendingLabel` (default "Submitting…"),
  so a slow submit can't be double-fired.
- **Error summary** — after a failed submit `CrForm` renders a form-level
  `role="alert"` region listing every problem with an in-page link to the field;
  it clears once the form validates. Opt out with `errorSummary={false}`.

Docs: forms.md "Submit lifecycle, async validation & error summary". Islands e2e
asserts the summary appears on a failed submit (with per-error links) and clears
on a valid one. a11y (4 themes), responsive, visual, islands, forms, and type
gates all green.
