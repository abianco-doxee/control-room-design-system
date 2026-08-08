---
"@control-room/design-system": minor
---

CrLineChart and CrBarChart now draw a numbered y-axis. The scale is derived with
the "nice number" algorithm (domain rounded out to whole 1/2/5×10ᵏ tick steps),
so gridlines land on human values instead of raw data extremes. Each gridline is
labelled in the left gutter, formatted compactly (`1.5k`, `2M`), with an optional
`unit` suffix; `axis={false}` returns the bare plot. The static gallery SVG
generator shares the same nice-scale math, so hand-rendered and live charts agree.
