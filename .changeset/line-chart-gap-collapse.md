---
"@control-room/design-system": minor
---

CrLineChart gains a **gap-collapse ("market-hours") axis**: set `xBreak` on a
continuous `x` (sorted ascending) to compress idle gaps — nights, weekends,
holidays — so session data reads without empty stretches, the way a trading chart
does. Any gap larger than `xBreakGap` (default ~3× the typical sample gap) is
collapsed and marked with a dashed break line, and the axis shows one tick per
session day. It works from the data's own gaps — a series carrying only session
points drops its closed periods automatically, no exchange calendar required. The
compression is ordinal (within-session spacing stays proportional; collapsed gaps
are not to scale). Adds a `market` showcase option (session-only Thu/Fri/Mon demo)
and an islands test asserting break markers appear and ticks are per-day.
