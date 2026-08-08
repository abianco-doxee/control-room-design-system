---
"@control-room/design-system": minor
---

CrLineChart gains a continuous/time x-axis and an interactive legend.

- **Continuous x-axis:** pass `x` (numbers parallel to each sample) to place points
  by value on a real linear x-scale with nice ticks and faint vertical gridlines;
  add `xTime` to treat `x` as epoch-ms and label ticks at round clock intervals
  (`HH:MM`, UTC). Without `x` the axis stays categorical (`labels`).
- **Interactive legend:** for ≥ 2 series the legend keys are keyboard-operable
  buttons — click to isolate/restore a series. Hidden series leave the plot, the
  tooltip, and the auto y-domain, so isolating one refits the y-scale. `role="img"`
  and the spoken summary moved to a graphic wrapper so the legend buttons are never
  nested inside an image subtree (axe `nested-interactive`-clean).

The static gallery generator mirrors both (a time-axis demo card; legend rendered
as buttons). Adds islands tests for legend isolate/restore and clock-time ticks.
