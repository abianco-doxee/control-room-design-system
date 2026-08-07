---
"@control-room/design-system": minor
---

Forms: nested objects & arrays. The schema-driven form now handles structure, not
just flat records.

- **Core (`lib/forms`)** — `toFormModel` recurses: an object property becomes a
  `group` field (with `fields`), an array becomes an `array` field (with an `item`
  descriptor — a scalar field or a group). `jsonSchemaToArkDef` and coercion
  recurse to match, and validation error keys are the full dotted instance path
  with array indices (`limits.cpu`, `members.1.email`). Nested overrides use the
  dotted path (`overrides["hooks.url"]`), and an array override may set
  `itemLabel`.
- **`CrForm`** — renders nesting from a FLAT render-list built by walking the
  model + current values; the recursion is in JS, the DOM stays flat and indented
  by depth. Groups render a labelled section; arrays render add / remove controls
  and repeat their item (scalar rows carry an inline remove, object items get a
  header). State is keyed by dotted path, so one array item's field validates
  independently. Depth is unbounded — no component self-recursion. Still never
  imports ArkType.

The component browser's Form playground gains a nested `limits` group, a scalar
`tags` array, and an object `hooks` array (with an ArkType ⇄ JSON Schema toggle).
Docs updated (removed the old "flat records only" limitation). New forms-core unit
tests for nesting + a nested-form path in the islands e2e. a11y (4 themes),
responsive, islands, type, and forms gates all green.
