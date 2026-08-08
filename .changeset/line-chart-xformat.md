---
"@control-room/design-system": minor
---

CrLineChart gains an **`xFormat` escape hatch** — `xFormat={(value) => string}`
relabels the chosen tick positions and the hover stamp when no preset fits (ISO
variants, relative stamps, retail-calendar labels, other locales). It sits at the top
of label precedence, overriding `xLocale` / `xWeek` / `xFiscalStart` / clock format;
positions still come from the active scale. The same hook is on the util:
`timeTicks(lo, hi, { format })`.

Also hardens option interactions so a flat bag of axis props can't produce garbled
output: options outside their mode are inert, `xBreak` on non-time numeric `x` now
labels ticks by value (no bogus calendar interpretation), and the resolution order is
documented (which x-axis → tick-text precedence → granularity picks the sub-option;
`yScale` orthogonal). Adds `format` unit-test coverage, a `customLabels` showcase
toggle, and an islands test for the override.
