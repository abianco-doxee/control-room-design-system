---
"@control-room/design-system": minor
---

CrLineChart gains a base-10 **log y-scale** (`yScale="log"`) for metrics that span
orders of magnitude (latency p50→p99, payload sizes). The domain snaps to powers of
ten; ticks are `1·2·5×10ᵏ` for a few decades or plain powers of ten for many, with
the usual compact labels (`10`, `1k`, `100k`). Non-positive values are clamped to
the axis floor, and a series with no positive data falls back to linear. Default
stays linear (backward-compatible). Bar charts remain linear (baseline-anchored at
zero, where log is undefined). Adds a `yScale` showcase control (with a wide-range
demo series) and an islands test asserting the axis spans decades on powers of ten.
