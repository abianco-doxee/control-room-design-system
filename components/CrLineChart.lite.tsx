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
  /** Force the y-scale; otherwise a "nice" scale is derived from the data. */
  min?: number;
  max?: number;
  /** viewBox height (aspect); the plot scales to its container width. */
  height?: number;
  /** Fill under each line with a faint tint. */
  area?: boolean;
  /** Show the numbered y-axis (nice ticks + gridlines). Default true. */
  axis?: boolean;
  /** Suffix appended to each y-tick label (e.g. "ms", "%"). */
  unit?: string;
  /** Accessible name for the whole figure. */
  label?: string;
}

/* A time-series line chart: recessive gridlines, crisp non-scaling 2px lines,
 * a data-end dot per series, HTML tick labels and a legend (identity is never
 * colour-alone — a legend is present for ≥2 series). One y-axis only, ever.
 * Pointer over the plot snaps a crosshair to the nearest sample and reads every
 * series' value into a top-docked tooltip (progressive enhancement — the spoken
 * summary still carries the data for AT).
 *
 * Static geometry lives in the `geo` getter (reads props only); anything that
 * reads the hovered index is a METHOD (a getter would run before the store is
 * initialised on Qwik). Series take a signal tone, or the next hue in a FIXED
 * categorical order (never cycled) — colour follows the entity, not its rank. */
export default function CrLineChart(props: CrLineChartProps) {
  const state = useStore({
    hovering: false,
    at: 0,
    hue(sig: string | undefined, i: number): string {
      const order = ["work", "accent-2", "accent", "wait", "done"];
      const key = sig ? (sig === "accent2" ? "accent-2" : sig) : order[i % order.length];
      return "var(--sig-" + key + ")";
    },
    /* A "nice" magnitude (1/2/5 x 10^k) for axis steps and extents. */
    niceNum(range: number, round: boolean): number {
      const exp = Math.floor(Math.log10(range));
      const f = range / Math.pow(10, exp);
      let nf: number;
      if (round) {
        if (f < 1.5) nf = 1; else if (f < 3) nf = 2; else if (f < 7) nf = 5; else nf = 10;
      } else {
        if (f <= 1) nf = 1; else if (f <= 2) nf = 2; else if (f <= 5) nf = 5; else nf = 10;
      }
      return nf * Math.pow(10, exp);
    },
    /* Round a data domain out to whole tick steps and list the ticks. */
    niceScale(lo: number, hi: number, maxTicks: number) {
      let a = lo;
      let b = hi;
      if (b <= a) b = a + 1;
      const range = state.niceNum(b - a, false);
      const step = state.niceNum(range / (maxTicks - 1), true);
      const niceLo = Math.floor(a / step) * step;
      const niceHi = Math.ceil(b / step) * step;
      const ticks: number[] = [];
      for (let v = niceLo; v <= niceHi + step * 0.5; v += step) ticks.push(Math.round(v / step) * step);
      return { min: niceLo, max: niceHi, ticks };
    },
    /* Compact, human tick labels: 1500 -> "1.5k", 2000000 -> "2M". */
    fmtTick(v: number): string {
      const a = Math.abs(v);
      if (a >= 1000000) return (Math.round(v / 100000) / 10) + "M";
      if (a >= 1000) return (Math.round(v / 100) / 10) + "k";
      return String(Math.round(v * 100) / 100);
    },
    metrics() {
      const series = props.series || [];
      const axis = props.axis !== false;
      const W = 320;
      const H = props.height || 140;
      const L = axis ? 30 : 8;
      const R = 8;
      const T = 10;
      const B = 18;
      const plotW = W - L - R;
      const plotH = H - T - B;
      let n = 0;
      for (const s of series) if ((s.data || []).length > n) n = (s.data || []).length;
      let lo = props.min;
      let hi = props.max;
      if (lo === undefined || hi === undefined) {
        let dlo = Infinity;
        let dhi = -Infinity;
        for (const s of series) for (const v of s.data || []) {
          if (v < dlo) dlo = v;
          if (v > dhi) dhi = v;
        }
        if (!isFinite(dlo)) { dlo = 0; dhi = 1; }
        if (lo === undefined) lo = dlo;
        if (hi === undefined) hi = dhi;
      }
      const forced = props.min !== undefined && props.max !== undefined;
      const sc = state.niceScale(lo, hi, 5);
      const min = forced ? lo : sc.min;
      const max = forced ? hi : sc.max;
      const range = max - min || 1;
      const ticks: number[] = [];
      for (const t of sc.ticks) if (t >= min - range * 1e-6 && t <= max + range * 1e-6) ticks.push(t);
      return { W, H, L, R, T, B, plotW, plotH, n, min, max, range, axis, ticks };
    },
    geo() {
      const m = state.metrics();
      const series = props.series || [];
      const xAt = (i: number, n: number) => m.L + (n <= 1 ? m.plotW / 2 : (i / (n - 1)) * m.plotW);
      const yAt = (v: number) => m.T + (1 - (v - m.min) / m.range) * m.plotH;
      const lines = series.map((s: CrLineSeries, si: number) => {
        const d = s.data || [];
        const n = d.length;
        const pts = d.map((v: number, i: number) => ({ x: xAt(i, n), y: yAt(v) }));
        const line = pts.map((p: { x: number; y: number }) => p.x.toFixed(2) + "," + p.y.toFixed(2)).join(" ");
        let area = "";
        if (pts.length) {
          area = "M " + pts[0].x.toFixed(2) + "," + (m.T + m.plotH).toFixed(2);
          for (const p of pts) area += " L " + p.x.toFixed(2) + "," + p.y.toFixed(2);
          area += " L " + pts[n - 1].x.toFixed(2) + "," + (m.T + m.plotH).toFixed(2) + " Z";
        }
        const end = pts.length ? pts[pts.length - 1] : { x: m.L, y: m.T };
        return { name: s.name, color: state.hue(s.signal, si), line, area, ex: end.x, ey: end.y };
      });
      const yticks = m.ticks.map((v: number) => ({ y: yAt(v), label: state.fmtTick(v) + (props.unit || "") }));
      const ticks = (props.labels || []).map((t: string, i: number, a: string[]) => ({ t, x: xAt(i, a.length) }));
      return { W: m.W, H: m.H, L: m.L, R: m.R, axis: m.axis, plotTop: m.T, plotBot: m.T + m.plotH, lines, yticks, ticks };
    },
    summary(): string {
      const series = props.series || [];
      const parts = series.map((s: CrLineSeries) => {
        const d = s.data || [];
        return s.name + " latest " + (d.length ? d[d.length - 1] : "n/a");
      });
      return (props.label || "line chart") + " — " + parts.join(", ");
    },
    move(event: any) {
      const m = state.metrics();
      if (m.n < 1) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (!rect.width) return;
      const vbX = ((event.clientX - rect.left) / rect.width) * m.W;
      let frac = (vbX - m.L) / m.plotW;
      if (frac < 0) frac = 0;
      if (frac > 1) frac = 1;
      state.hovering = true;
      state.at = m.n <= 1 ? 0 : Math.round(frac * (m.n - 1));
    },
    leave() {
      state.hovering = false;
    },
    cursor() {
      const m = state.metrics();
      const idx = state.at;
      const series = props.series || [];
      const cx = m.L + (m.n <= 1 ? m.plotW / 2 : (idx / (m.n - 1)) * m.plotW);
      const rows = series
        .map((s: CrLineSeries, si: number) => {
          const d = s.data || [];
          if (idx >= d.length) return null;
          const v = d[idx];
          return { name: s.name, color: state.hue(s.signal, si), value: v, cy: m.T + (1 - (v - m.min) / m.range) * m.plotH };
        })
        .filter((r: any) => r);
      let leftPct = (cx / m.W) * 100;
      if (leftPct < 12) leftPct = 12;
      if (leftPct > 88) leftPct = 88;
      const labels = props.labels || [];
      return { cx, top: m.T, bot: m.T + m.plotH, leftPct, label: labels[idx] || "", rows };
    },
  });

  return (
    <figure class="cr-chart cr-linechart" role="img" aria-label={state.summary()}>
      <svg
        class="cr-linechart__plot"
        viewBox={"0 0 " + state.geo().W + " " + state.geo().H}
        aria-hidden="true"
        focusable="false"
        onMouseMove={(event) => state.move(event)}
        onMouseLeave={() => state.leave()}
      >
        <For each={state.geo().yticks}>
          {(g: { y: number; label: string }) => (
            <g>
              <line class="cr-chart__grid" x1={state.geo().L} y1={g.y} x2={state.geo().W - state.geo().R} y2={g.y} vector-effect="non-scaling-stroke" />
              <Show when={state.geo().axis}>
                <text class="cr-chart__ytick" x={state.geo().L - 5} y={g.y + 3} text-anchor="end">{g.label}</text>
              </Show>
            </g>
          )}
        </For>
        <For each={state.geo().lines}>
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
        <For each={state.geo().ticks}>
          {(tk: { t: string; x: number }) => <text class="cr-chart__tick" x={tk.x} y={state.geo().H - 5} text-anchor="middle">{tk.t}</text>}
        </For>
        <Show when={state.hovering}>
          <line class="cr-chart__cross" x1={state.cursor().cx} y1={state.cursor().top} x2={state.cursor().cx} y2={state.cursor().bot} vector-effect="non-scaling-stroke" />
          <For each={state.cursor().rows}>
            {(r: { color: string; cy: number }) => <circle class="cr-chart__cursor" cx={state.cursor().cx} cy={r.cy} r="3.4" style={{ fill: r.color }} vector-effect="non-scaling-stroke" />}
          </For>
        </Show>
      </svg>
      <Show when={state.hovering}>
        <div class="cr-chart__tip" style={{ left: state.cursor().leftPct + "%" }} aria-hidden="true">
          <Show when={state.cursor().label}>
            <span class="cr-chart__tip-x">{state.cursor().label}</span>
          </Show>
          <For each={state.cursor().rows}>
            {(r: { name: string; color: string; value: number }) => (
              <span class="cr-chart__tip-row">
                <span class="cr-chart__tip-sw" style={{ background: r.color }}></span>
                <span class="cr-chart__tip-n">{r.name}</span>
                <span class="cr-chart__tip-v">{r.value}</span>
              </span>
            )}
          </For>
        </div>
      </Show>
      <Show when={(props.series || []).length > 1}>
        <figcaption class="cr-chart__legend">
          <For each={state.geo().lines}>
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
