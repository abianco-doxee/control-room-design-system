---
"@control-room/design-system": minor
---

`CrCronField` is now a proper, message-driven form field — the last field still
carrying the old hand-set `invalid` boolean. **Breaking (pre-1.0):** `invalid?:
boolean` is replaced by `error?: string`, and `id` is now required.

It now matches the `CrField` contract exactly: a real `<label for>` (with the
required marker), `error` as the single source of truth (drives `aria-invalid`,
renders the message as `role="alert"`, links it via `aria-describedby`), the live
human-readable `description` readout linked as a description, plus `required`,
`disabled`, `name`, and `onBlur`. Validity comes from the host's parser as a
message (pass `error` when cronstrue throws, `description` when it parses) — never a
guessed boolean.

Callers updated (component browser playground, console example); registry + spec
(components.md) updated; CSS gains the error border + disabled state. All gates
green (islands, a11y, responsive, visual, verify).
