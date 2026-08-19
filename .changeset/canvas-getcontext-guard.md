---
"@alebianco/cr-components": patch
---

The five canvas components survive an unavailable 2D context.

`CrCat`, `CrSigil`, `CrAscii`, `CrChrome` and `CrDither` all called
`canvas.getContext("2d")` and dereferenced the result immediately. Each guarded
that the *method* exists, but not that the call succeeds — `getContext` can throw
as well as return null: a headless DOM, a canvas-blocking privacy mode, or an
exhausted context pool all do it. The result was a thrown `NotYetImplemented`
that took the whole render down, and in a loop it exhausted the heap.

All five now `try`/`catch` the call and bail out when there is no context. The
painting is decorative in every case, so a missing canvas should cost the
drawing, not the page.

Found by the control-room port: swapping its local pixel-cat — which wrapped
`getContext` in a `try`/`catch` precisely because a test DOM has no 2D context —
for `CrCat` crashed the app's whole test run with a heap exhaustion.
