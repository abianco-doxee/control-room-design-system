---
"@control-room/design-system": minor
---

Telemetry & charts — a four-form chart family, built on the signal palette and
the data-viz house rules (thin marks, crisp non-scaling 2px strokes, a recessive
grid, baseline-anchored bars, a 2px surface gap, one y-axis, labels/legends in
text ink — never the series colour).

- **CrSparkline** — inline micro line/area for a KPI or table cell; no axes, a
  data-end dot, stretches to fill its box.
- **CrLineChart** — time series: recessive grid, a 2px line + data-end dot per
  series, tick labels, and a legend for ≥2 series. One shared y-scale (no
  dual-axis).
- **CrBarChart** — categorical magnitude: rounded data-ends, a 2px gap, an
  optional dashed **target** line, monospace value + category labels.
- **CrStackedBar** — composition ("stacked progress"): signal-toned segments
  sized by share, with a legend (label · value · %). Compose several for a
  per-row comparison.

Series colour follows the entity — a `signal` tone or the next hue in a **fixed
categorical order** (`work · accent-2 · accent · wait · done`), chosen so adjacent
hues stay separable under colour-vision deficiency (validated with the palette
checker against each theme surface). Every figure is `role="img"` with a spoken
summary; the SVG is `aria-hidden`. Identity is never colour-alone (legend +
direct labels), which also supplies the required relief for the palette's few
CVD/contrast warnings; the max-neon lightness is an accepted, documented house
deviation.

Authored once in Mitosis → all six targets; live editable-prop playgrounds in the
component browser (new **chart** category) with generated prop tables; a
"Telemetry & charts" section in the gallery, rendered by the same geometry.
Catalog +4 (64 components). Docs: components.md charts section (+anchors). Type,
a11y (4 themes), responsive, islands gates green; visual baselines refreshed.
