---
"@control-room/design-system": minor
---

Six new components, closing standard-kit gaps found in the Ark UI / shadcn-vue
comparison. Each is authored once in Mitosis (compiles to all six targets), styled
in the Control Room language, cataloged, documented, and demoed as a live island.

- **Stepper** — numbered multi-step progress indicator (ordered list;
  done/active/upcoming; `aria-current="step"`; optional navigable step buttons).
  The shape the forms guidance points to for splitting long forms.
- **PinInput** — one-time-code / PIN entry: N single-digit cells that act as one
  field (typing advances, Backspace steps back, arrows move, paste distributes);
  `role="group"` with per-cell labels and `autocomplete="one-time-code"`.
- **TagsInput** — token entry (Enter/comma adds, Backspace removes the last, each
  tag has a "Remove <tag>" button); `role="group"`, duplicates ignored.
- **InputGroup** — input flanked by decorative prefix/suffix addons
  (protocol/currency/unit); addons `aria-hidden`, field gets an `aria-label`.
- **Avatar** — image with initials fallback + optional presence dot
  (`img[alt]` with a src, else `role="img"[aria-label]` over the initials).
- **Spinner** — indeterminate loading indicator (`role="status"` + label; ring is
  `aria-hidden` and honours reduced-motion).

Wiring: catalog/registry entries + `components.md` specs, `.cr-*` styles, live
playgrounds in the component browser, and islands e2e tests (stepper aria-current +
navigation, pin-input fill/advance, tags-input add/remove, avatar/spinner roles).
Deferred to a follow-up: Calendar / range-calendar, Resizable, ScrollArea,
Carousel. Gates green: six-target build, verify:types, islands, a11y (axe), visual,
catalog, package.
