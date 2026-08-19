---
"@alebianco/cr-components": patch
---

`CrInput` and `CrTextarea` fall back to `currentTarget` when reading the typed
value.

Both read `event.target.value` in their `onInput`. That is correct in a browser
and is the convention across the library, but it assumes `target` is always
populated — and a synthetic event dispatched without one makes the handler throw
`Cannot read properties of null`, taking the whole component down rather than
just missing a keystroke.

`(event.target || event.currentTarget)` is strictly more robust: on a real input
event the two are the same element, so browser behaviour is unchanged.

Found by the control-room port. Note this does NOT make the handler testable
under Qwik's `userEvent()`, which populates neither `target` nor `currentTarget`
— only the element it passes as the handler's second argument — so a component
reading the event cannot be exercised there at all. The fallback is kept because
a null-target event should degrade to a missed keystroke, not a thrown
TypeError that unmounts the component.

Worth recording separately: the library has no test anywhere that asserts
`onChange` actually fires. `test:forms` covers value coercion, not dispatch,
which is why the fragility went unnoticed.
