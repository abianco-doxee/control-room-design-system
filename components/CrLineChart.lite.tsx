import { useStore, Show, For } from "@builder.io/mitosis";

export interface CrLineSeries {
  name: string;
  data: number[];
  /** Signal tone; omit to take the next categorical hue in fixed order. */
  signal?: "work" | "wait" | "done" | "err" | "idle" | "accent" | "accent2";
}

export interface CrLineChartProps {
  series: CrLineSeries[];
  /** X-axis tick labels, drawn left→right under the plot. */
  labels?: string[];
  /** Force the y-scale; otherwise auto from the data. */
  min?: number;
  max?: number;
  /** viewBox height (aspect); the plot scales to its container width. */
  height?: number;
  /** Fill under each line with a faint tint. */
  area?: boolean;
  /** Accessible name for the whole figure. */
  label?: string;
}

/* A time-series line chart: recessive gridlines, crisp non-scaling 2px lines,
 * a data-end dot per series, HTML tick labels and a legend (identity is never
 * colour-alone — a legend is present for ≥2 series). One y-axis only, ever.
 *
 * All geometry is computed in one self-contained useStore getter that reads props
 * only. Series take a signal tone, or the next hue in a FIXED categorical order
 * (never cycled) — colour follows the entity, not its rank. */
export default function CrLineChart(props: CrLineChartProps) {
  const state = useStore({
    hue(sig: string | undefined, i: number): string {
      const order = ["work", "accent-2", "accent", "wait", "done"];
      const key = sig ? (sig === "accent2" ? "accent-2" : sig) : order[i % order.length];
      return "var(--sig-" + key + ")";
    },
    get geo() {
      const series = props.series || [];
      const W = 320;
      const H = props.height || 140;
      const L = 8;
      const R = 8;
      const T = 10;
      const B = 18;
      const plotW = W - L - R;
      const plotH = H - T - B;
      let min = props.min;
      let max = props.max;
      if (min === undefined || max === undefined) {
        let lo = Infinity;
        let hi = -Infinity;
        for (const s of series) for (const v of s.data || []) {
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
        if (!isFinite(lo)) { lo = 0; hi = 1; }
        if (min === undefined) min = lo;
        if (max === undefined) max = hi;
      }
      const range = max - min || 1;
      const xAt = (i: number, n: number) => L + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
      const yAt = (v: number) => T + (1 - (v - min) / range) * plotH;
      const lines = series.map((s: CrLineSeries, si: number) => {
        const d = s.data || [];
        const n = d.length;
        const pts = d.map((v: number, i: number) => ({ x: xAt(i, n), y: yAt(v) }));
        const line = pts.map((p: { x: number; y: number }) => p.x.toFixed(2) + "," + p.y.toFixed(2)).join(" ");
        let area = "";
        if (pts.length) {
          area = "M " + pts[0].x.toFixed(2) + "," + (T + plotH).toFixed(2);
          for (const p of pts) area += " L " + p.x.toFixed(2) + "," + p.y.toFixed(2);
          area += " L " + pts[n - 1].x.toFixed(2) + "," + (T + plotH).toFixed(2) + " Z";
        }
        const end = pts.length ? pts[pts.length - 1] : { x: L, y: T };
        return { name: s.name, color: state.hue(s.signal, si), line, area, ex: end.x, ey: end.y };
      });
      const grid = [0, 0.5, 1].map((f: number) => T + f * plotH);
      const ticks = (props.labels || []).map((t: string, i: number, a: string[]) => ({ t, x: xAt(i, a.length) }));
      return { W, H, L, R, T, B, plotW, plotH, lines, grid, ticks };
    },
    get summary(): string {
      const series = props.series || [];
      const parts = series.map((s: CrLineSeries) => {
        const d = s.data || [];
        return s.name + " latest " + (d.length ? d[d.length - 1] : "n/a");
      });
      return (props.label || "line chart") + " — " + parts.join(", ");
    },
  });

  return (
    <figure class="cr-linechart" role="img" aria-label={state.summary}>
      <svg class="cr-linechart__plot" viewBox={"0 0 " + state.geo.W + " " + state.geo.H} aria-hidden="true" focusable="false">
        <For each={state.geo.grid}>
          {(gy: number) => <line class="cr-chart__grid" x1={state.geo.L} y1={gy} x2={state.geo.W - state.geo.R} y2={gy} vector-effect="non-scaling-stroke" />}
        </For>
        <For each={state.geo.lines}>
          {(s: { name: string; color: string; line: string; area: string; ex: number; ey: number }) => (
            <g>
              <Show when={props.area}>
                <path class="cr-linechart__area" d={s.area} style={{ fill: s.color }} />
              </Show>
              <polyline class="cr-linechart__line" points={s.line} style={{ stroke: s.color }} vector-effect="non-scaling-stroke" />
              <circle class="cr-linechart__end" cx={s.ex} cy={s.ey} r="2.6" style={{ fill: s.color }} vector-effect="non-scaling-stroke" />
            </g>
          )}
        </For>
        <For each={state.geo.ticks}>
          {(tk: { t: string; x: number }) => <text class="cr-chart__tick" x={tk.x} y={state.geo.H - 5} text-anchor="middle">{tk.t}</text>}
        </For>
      </svg>
      <Show when={(props.series || []).length > 1}>
        <figcaption class="cr-chart__legend">
          <For each={state.geo.lines}>
            {(s: { name: string; color: string }) => (
              <span class="cr-chart__key">
                <span class="cr-chart__sw" style={{ background: s.color }} aria-hidden="true"></span>
                {s.name}
              </span>
            )}
          </For>
        </figcaption>
      </Show>
    </figure>
  );
}
