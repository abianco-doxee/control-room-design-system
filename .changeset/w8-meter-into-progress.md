---
"@alebianco/cr-components": major
"@alebianco/cr-styles": major
---

**Breaking:** `CrMeter` is removed — use `CrProgress`, which absorbs its `idle`
signal and `track` part. The two components were near-duplicates with no
articulable difference.

`CrProgress` now renders an optional `label` inline before the bar, so it covers
the capacity / utilisation reading Meter used to serve. Its root is now a flex
wrapper and the bar itself is the new `.cr-progress__track` part — restyle any
rule that targeted `.cr-progress` as the bar. The `.cr-meter` class family is
gone.

Migration: `<CrMeter … />` → `<CrProgress … />`.
