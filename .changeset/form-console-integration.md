---
"@control-room/design-system": minor
---

Forms: controlled `errors` prop + prove the schema-driven form in the real app.

- **`CrForm` controlled `errors`** — besides the synchronous `validate` prop,
  `CrForm` now accepts an `errors` map (dotted path → message) that is always
  shown, merged over the internal validator's. Use it for server-side errors, or
  to drive validation from the parent. This is also what makes `CrForm` usable
  under **Qwik**, whose function props are async QRLs that can't return a value —
  so instead of a synchronous `validate`, you validate in the async
  `onChange`/`onSubmit` handler and feed the result back through `errors`.
- **`examples/console` integration** — the Qwik dashboard gains a "provision a
  session" form: one ArkType schema drives the render model and validation; the
  inline disclosure validates in its QRL handlers and feeds errors back via the
  controlled prop. The Form Model is plain serializable data, so it crosses Qwik's
  SSR boundary, and ArkType is code-split into a chunk Qwik lazy-loads only when
  the form validates.

Verified via the console's client + SSR vite builds (both green) and the
design-system gates (forms unit, React islands, a11y, type). Note: the full
`qwik build` type-check is slow because ArkType's type-level inference is heavy —
a known ArkType tradeoff — so the console is validated through the vite
client/server builds rather than that bundled tsc pass. Docs: forms.md gains a
"Controlled errors (server-side & Qwik)" section.
