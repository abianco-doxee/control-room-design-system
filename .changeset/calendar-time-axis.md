---
"@control-room/design-system": minor
---

CrLineChart's time axis is now **timezone-aware and calendar-based**. With `xTime`,
tick granularity auto-scales to the span — clock intervals for sub-day ranges, then
day → week (Mondays) → month → year — and each calendar tick lands on a real
boundary in `xZone` (a new prop; IANA zone, default `"UTC"`), DST included. A
five-month chart ticks on the 1st of each month in local time; a multi-week chart on
local Mondays; a multi-year chart on Jan 1. Labels format per unit (`09:30`,
`3 Mar`, `Mar`, `Jan '25`, `2025`) and the hover tooltip shows a fuller stamp.

The scale logic ships as a new pure, dependency-free export
`@control-room/design-system/time-scale` (`timeTicks(lo, hi, { zone, target })`),
unit-tested (`test:timescale`, incl. non-UTC zones and a DST transition) and shared
with the static gallery so hand-rendered and live charts agree. The line-chart
showcase gains an `xScale` selector (categorical / clock / calendar); the gallery
gains a five-month calendar demo. No date library — it uses the built-in `Intl`
zone database.
