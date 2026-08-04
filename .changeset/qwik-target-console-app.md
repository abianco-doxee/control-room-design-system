---
"@control-room/design-system": minor
---

Qwik is now a first-class framework target, and there's a real app built on it.

- **Added Qwik to the Mitosis targets** (`react/vue/svelte/angular/solid/qwik`) —
  all 32 components compile. New `./qwik` package export + barrel entry.
- **Fixed a Qwik codegen bug** in a post-build step (`build/build-fix-qwik.mjs`,
  wired into `build:components`): the Qwik generator emitted the root element's
  computed `class` as an IIFE with no `return`, so 5 components shipped without
  their classes. The fixup adds the `return`; a `--check` mode guards it.
- **`examples/console/`** — a real Qwik City dashboard consuming the tokens, the
  `cr-` classes, and the compiled Qwik components (`CrButton`, `CrSwitch`,
  `CrModal`, `CrShape`, `CrSigil`, `CrChip`). Live theme switching across all four
  themes, per-session toggles, the Law-9 Breach, seeded sigils + severity shapes,
  and a modal — verified building and resuming (events work) end to end.
