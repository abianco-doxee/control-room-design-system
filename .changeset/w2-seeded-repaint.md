---
"@alebianco/cr-components": patch
---

Seeded canvas components (`CrAscii`, `CrSigil`, `CrCat`, `CrChrome`) now repaint
when their props change. They previously painted once on mount and ignored every
subsequent prop update, so `seed`, `state`, `size`, `variant`, `width` and
`height` had no effect after first render.
