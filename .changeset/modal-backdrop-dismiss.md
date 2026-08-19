---
"@alebianco/cr-components": minor
---

Clicking `CrModal`'s backdrop closes it.

`CrModal`'s own comment says the native `<dialog>` gives "focus-trap,
Escape-to-close, and the backdrop … for free". Two of those three are true: the
top layer, the focus trap and Escape all come from the platform, and Escape
reaches `onClose` because `cancel` is followed by `close`. **Backdrop-to-dismiss
is not native** — `::backdrop` was styled but had no click handler, so clicking
outside the modal did nothing.

The dialog now closes when a click's target is the dialog element itself, which
is the standard test for a backdrop hit: children sit inside the padding box, so
a click on any of them has a descendant as its target.

Found by the control-room port, whose own dialog routed Escape, the backdrop and
the close button to one handler precisely so parent state could not drift from
the element.
