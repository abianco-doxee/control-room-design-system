---
"@alebianco/cr-components": minor
"@alebianco/cr-styles": minor
---

`CrKeyHints` gains a real key-declaration API. It previously had no way to
declare keys at all — only `revealKey`, which controls the hold-to-peek gesture.

Pass `hints: { keys, label }[]` to render a shortcut legend. The `keys` string
uses the notation readers already know from editors and docs: `+` joins a
**chord** (pressed together), a space joins a **sequence** (pressed in order),
and the two combine.

```tsx
<CrKeyHints
  hints={[
    { keys: "Ctrl+K",   label: "Open the command palette" },
    { keys: "g p",      label: "Go to the sprint board" },
    { keys: "Ctrl+K p", label: "Palette, then pin" },
  ]}
/>
```

Chords and sequences are drawn **differently**, because that distinction is the
whole point of the syntax: chord members sit tight around a `+` glyph, sequence
steps are pushed apart by the italic word *then*. Parsing is forgiving —
whitespace runs collapse, a dangling joiner is dropped (`"Ctrl+"` → `Ctrl`), and
a lone `+` is read as the plus key (`"Ctrl++"` → `Ctrl` and `+`).

Accessibility: every keycap and both separators are `aria-hidden`, so a screen
reader never hears a run of unlabelled boxes. Each binding instead carries
`aria-keyshortcuts` plus an `aria-label` of the spoken form and its description
("Control plus K, then P: Palette, then pin"). The label sits per binding rather
than on the list, so bindings stay separately navigable.

This is additive: `revealKey` is unchanged, and with no `hints` the component
still renders nothing visible and behaves exactly as before. The two features are
independent — the legend does not fade with the peek gesture, since its keycaps
are always-on rather than `.cr-kbd--hint`.

New `.cr-keyhints--legend` styles ship with the `kbd` style part, and new parts
`item` · `keys` · `chord` · `plus` · `then` · `label` join the styling contract.
