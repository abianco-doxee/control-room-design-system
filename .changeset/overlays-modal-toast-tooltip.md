---
"@control-room/design-system": minor
---

Add the overlay family — Modal, Toast, and Tooltip — as `cr-` classes and Mitosis
components (all five framework targets). Modal is built on the native `<dialog>`
element so the browser owns the focus-trap, Escape, and backdrop; Toast is keyed to
a machine signal (work/wait/done/err) with the correct `role`/`aria-live`; Tooltip
reveals on hover **and** focus via pure CSS and is wired with `aria-describedby`.
All three pass the a11y gate in every theme. Catalog +3 (new `overlay` category).
