---
"@control-room/design-system": minor
---

Extend the Component Browser playgrounds to 39 components.

Added editable-props playgrounds for the presentational and form components, on top
of the 22 interactive ones:

- **Button** (kind/size/disabled + text), **Tag** (tone + text), **Chip** (tone +
  text), **StatusDot** (state/label), **Kbd** (keys/hint/on), **Checkbox/Radio**
  (type/label/checked/disabled), **Alert** (signal/title/message/dismissible),
  **Toast** (signal/message), **Meter** (value/max/tone/label), **Progress**
  (value/max/indeterminate/tone/label), **Text Input** (placeholder/disabled/invalid),
  **Textarea** (same), **Form Field** (label/value/placeholder/hint/error),
  **Breadcrumb** (label), **SessionRow** (name/status/state/event), **EmptyState**
  (message), **Panel** (title/weight/inset + body).

- The harness gained a `children` control type so components whose content is
  children (Button, Tag, Chip, Panel) get an editable text/body field, and the code
  snippet renders it as inner text (`<CrTag tone="done">shipped</CrTag>`).

- Bare inputs (`CrInput`, `CrTextarea`) are composed with an associated `<label>` for
  an accessible name, matching the `CrSelect` pattern; the showcase a11y gate stays
  green across all four themes with 39 live components on the page.

The drift guard (registry ↔ emitted mounts) and the control-edit gate cover the
expanded set. Full build, verify, and the e2e suite (a11y + islands + visual) pass.
