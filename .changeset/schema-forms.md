---
"@control-room/design-system": minor
---

Schema-driven forms — standard validation from ArkType **or** JSON Schema, and a
`<CrForm>` that builds itself from a schema. Replaces the old story where fields
took a hand-set `invalid` boolean disconnected from any real validation.

- **`lib/forms` (headless core)** — a framework-agnostic bridge. Feed it an
  ArkType type OR a JSON Schema and it returns a **Form Model** (plain field
  descriptors), a **validate(values)** function (backed by ArkType), the exported
  **JSON Schema**, and the ArkType type. The bridge runs **both ways**: ArkType →
  `.toJsonSchema()` → JSON Schema, and JSON Schema → an ArkType definition →
  ArkType type; the Form Model is derived from the JSON Schema so either source
  yields the same form. Coerces input strings to the schema's types (number,
  boolean); an unchecked required checkbox is a valid `false`, not "missing".
  Predicate constraints (e.g. `string.url`) degrade gracefully on export and still
  validate at runtime. Exposed as `@control-room/design-system/forms`.
- **`CrForm`** — a schema-driven form. Give it a Form Model + a validate callback
  and it owns value/touched/error state, validates on **blur + submit**, and
  re-checks a field on change once touched. Renders text/email/url/number/select/
  textarea/checkbox by field `kind`. It never imports ArkType, so it stays portable
  across all six framework targets. (Fixed a stale-state read that made validation
  lag a field behind after the first submit.)
- **Field primitives hardened** — `CrField` is now fully validated (controlled
  value, live `onChange`, `required` + `aria-required`, error-driven `aria-invalid`
  + `aria-describedby` + `role="alert"`, no hand-set `invalid`). `CrInput` /
  `CrTextarea` are now properly controlled (value/onChange/name/required) instead of
  uncontrolled shells.

Component browser gains a live **Form** playground (real ArkType validation in the
browser, with an ArkType ⇄ JSON Schema source toggle and the exported JSON Schema
shown); gallery gets a static form snapshot. New `references/forms.md`. Catalog +1
(65). New `lib/forms` unit tests (`npm run test:forms`) wired into CI. Build note:
the React target runs Mitosis's formatter off + `build-fix-react.mjs` — extended
here for the new stateful components. a11y (4 themes), responsive, islands (incl. a
new form end-to-end test), visual, type, and forms gates all green.
