import { useStore, Show, For } from "@builder.io/mitosis";

export interface CrBarDatum {
  label: string;
  value: number;
  /** Signal tone; omit to take the next categorical hue in fixed order. */
  signal?: "work" | "wait" | "done" | "err" | "idle" | "accent" | "accent2";
}

export interface CrBarChartProps {
  data: CrBarDatum[];
  /** Force the top of the scale; otherwise auto from the data (and target). */
  max?: number;
  /** viewBox height (aspect); the plot scales to its container width. */
  height?: number;
  /** Draw a dashed reference line at this value (a budget / SLO). */
  target?: number;
  /** Print each bar's value above it. */
  showValues?: boolean;
  /** Accessible name for the whole figure. */
  label?: string;
}

/* A categorical bar chart: baseline-anchored bars with rounded data-ends, a 2px
 * surface gap between them, optional dashed target line, and monospace value +
 * category labels. Bars take a signal tone or the next hue in a FIXED categorical
 * order (never cycled). One measure, one axis.
 *
 * Geometry is one self-contained useStore getter (reads props only). */
export default function CrBarChart(props: CrBarChartProps) {
  const state = useStore({
    hue(sig: string | undefined, i: number): string {
      const order = ["work", "accent-2", "accent", "wait", "done"];
      const key = sig ? (sig === "accent2" ? "accent-2" : sig) : order[i % order.length];
      return "var(--sig-" + key + ")";
    },
    get geo() {
      const data = props.data || [];
      const W = 320;
      const H = props.height || 140;
      const L = 6;
      const R = 6;
      const T = 14;
      const B = 18;
      const plotW = W - L - R;
      const plotH = H - T - B;
      const base = T + plotH;
      let max = props.max;
      if (max === undefined) {
        let hi = props.target || 0;
        for (const d of data) if (d.value > hi) hi = d.value;
        max = hi || 1;
      }
      const n = data.length || 1;
      const gap = 2;
      const bw = (plotW - gap * (n - 1)) / n;
      const bars = data.map((d: CrBarDatum, i: number) => {
        const h = Math.max(0, Math.min(1, d.value / max)) * plotH;
        const x = L + i * (bw + gap);
        return { label: d.label, value: d.value, color: state.hue(d.signal, i), x, y: base - h, w: bw, h, cx: x + bw / 2 };
      });
      const targetY = props.target !== undefined ? base - Math.max(0, Math.min(1, props.target / max)) * plotH : null;
      return { W, H, L, R, base, bars, targetY };
    },
    get summary(): string {
      const data = props.data || [];
      const parts = data.map((d: CrBarDatum) => d.label + " " + d.value);
      return (props.label || "bar chart") + " — " + parts.join(", ");
    },
  });

  return (
    <figure class="cr-barchart" role="img" aria-label={state.summary}>
      <svg class="cr-barchart__plot" viewBox={"0 0 " + state.geo.W + " " + state.geo.H} aria-hidden="true" focusable="false">
        <line class="cr-chart__grid" x1={state.geo.L} y1={state.geo.base} x2={state.geo.W - state.geo.R} y2={state.geo.base} vector-effect="non-scaling-stroke" />
        <For each={state.geo.bars}>
          {(b: { label: string; value: number; color: string; x: number; y: number; w: number; h: number; cx: number }) => (
            <g>
              <rect class="cr-barchart__bar" x={b.x} y={b.y} width={b.w} height={b.h} rx="1.5" style={{ fill: b.color }} />
              <Show when={props.showValues}>
                <text class="cr-chart__val" x={b.cx} y={b.y - 3} text-anchor="middle">{b.value}</text>
              </Show>
              <text class="cr-chart__tick" x={b.cx} y={state.geo.H - 5} text-anchor="middle">{b.label}</text>
            </g>
          )}
        </For>
        <Show when={state.geo.targetY !== null}>
          <line class="cr-chart__target" x1={state.geo.L} y1={state.geo.targetY} x2={state.geo.W - state.geo.R} y2={state.geo.targetY} vector-effect="non-scaling-stroke" />
        </Show>
      </svg>
    </figure>
  );
}
