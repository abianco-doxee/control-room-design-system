---
"@control-room/design-system": minor
---

Auto-generated prop tables in the Component Browser.

Each component card now shows a **props** table generated from the compiled TypeScript
interface (`dist/frameworks/react/…Props`): prop name, required flag, type, and the
JSDoc description — including `@deprecated` notes. 55 of 60 cards have one (the rest
are utility/decoration entries with no single Props interface). Because it's derived
from the real interface, it can't drift from the shipped API.
