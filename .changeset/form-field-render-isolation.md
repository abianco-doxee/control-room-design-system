---
"@control-room/design-system": minor
---

Forms: per-field re-render isolation. `CrForm` stays a controlled form (Reset,
autocomplete, coercion and `when` all unchanged) but now re-renders **only the
field you're editing** on each keystroke, not the whole form — closing most of the
gap with uncontrolled libraries like React-Hook-Form, from one source across all
six framework targets.

How: each row is a new presentational `CrFormRow` that takes **only data props**
(no function props); on React it ships wrapped in `React.memo`, so unchanged rows
bail out of a form re-render. Input is **delegated** to one set of listeners on the
`<form>` (each control carries `data-path` / `data-kind` / `data-action`), which
keeps the handlers fresh (no stale closures) without per-row callbacks that would
defeat the memo. The fine-grained targets (Solid/Vue/Svelte/Qwik) get it for free;
they also carry `onFocusOut`/`onFocusIn` on the form since blur/focus don't bubble
there (React uses the bubbling `onBlur`/`onFocus`).

Build: `build-fix-react.mjs` wraps `CrFormRow` in `memo`, adds the missing
semicolon Mitosis omits for a deps-less `onUpdate` effect, and normalises the
sibling-component import extension (the first cross-component import in the set);
`build-fix-qwik.mjs` does the same extension fix. A `react-jsx-augment.d.ts`
declares `onFocusOut`/`onFocusIn` for the compiled-output type-check.

Tests: an islands e2e types into one field and asserts only that field's render
counter ticked; a package test guards that `CrFormRow` still ships `memo`-wrapped.
Docs: forms.md "Per-field re-render isolation". All gates green.

Known caveat: a React consumer's **dev** build logs one "Unknown event handler
property onFocusOut" warning per form (stripped in production; React uses the
bubbling onBlur/onFocus). A React-only build could drop the two props, but
Mitosis's `useTarget` mis-compiles target-split event handlers today.
