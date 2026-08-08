import { useStore, Show, For } from "@builder.io/mitosis";

export interface CrBarDatum {
  label: string;
  value: number;
  /** Signal tone; omit to take the next categorical hue in fixed order. */
  signal?: "work" | "wait" | "done" | "err" | "idle" | "accent" | "accent2";
}

export interface CrBarChartProps {
  data: CrBarDatum[];
  /** Force the top of the scale; otherwise a "nice" max is derived from the data (and target). */
  max?: number;
  /** viewBox height (aspect); the plot scales to its container width. */
  height?: number;
  /** Draw a dashed reference line at this value (a budget / SLO). */
  target?: number;
  /** Print each bar's value above it. */
  showValues?: boolean;
  /** Show the numbered y-axis (nice ticks + gridlines). Default true. */
  axis?: boolean;
  /** Suffix appended to each y-tick label (e.g. "ms", "%"). */
  unit?: string;
  /** Accessible name for the whole figure. */
  label?: string;
}

/* A categorical bar chart: baseline-anchored bars with rounded data-ends, a 2px
 * surface gap between them, optional dashed target line, and monospace value +
 * category labels. Pointer over the plot highlights the nearest bar (the rest
 * dim) and reads it into a top-docked tooltip. Bars take a signal tone or the
 * next hue in a FIXED categorical order (never cycled). One measure, one axis.
 *
 * Static layout is the `geo` getter (reads props only); the hover-reading helpers
 * are METHODS (a getter would run before the store initialises on Qwik). */
export default function CrBarChart(props: CrBarChartProps) {
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
      const data = props.data || [];
      const axis = props.axis !== false;
      const W = 320;
      const H = props.height || 140;
      const L = axis ? 30 : 6;
      const R = 6;
      const T = 14;
      const B = 18;
      const plotW = W - L - R;
      const plotH = H - T - B;
      const base = T + plotH;
      let hi = props.max;
      if (hi === undefined) {
        let dh = props.target || 0;
        for (const d of data) if (d.value > dh) dh = d.value;
        hi = dh || 1;
      }
      const forced = props.max !== undefined;
      const sc = state.niceScale(0, hi, 5);
      const max = forced ? hi : sc.max;
      const ticks: number[] = [];
      for (const t of sc.ticks) if (t >= -max * 1e-6 && t <= max + max * 1e-6) ticks.push(t);
      const n = data.length || 1;
      const gap = 2;
      const bw = (plotW - gap * (n - 1)) / n;
      return { W, H, L, R, T, B, plotW, plotH, base, max, n, gap, bw, axis, ticks };
    },
    geo() {
      const m = state.metrics();
      const data = props.data || [];
      const bars = data.map((d: CrBarDatum, i: number) => {
        const h = Math.max(0, Math.min(1, d.value / m.max)) * m.plotH;
        const x = m.L + i * (m.bw + m.gap);
        return { label: d.label, value: d.value, color: state.hue(d.signal, i), x, y: m.base - h, w: m.bw, h, cx: x + m.bw / 2 };
      });
      const yAt = (v: number) => m.base - Math.max(0, Math.min(1, v / m.max)) * m.plotH;
      const yticks = m.ticks.map((v: number) => ({ y: yAt(v), label: state.fmtTick(v) + (props.unit || "") }));
      const targetY = props.target !== undefined ? yAt(props.target) : null;
      return { W: m.W, H: m.H, L: m.L, R: m.R, base: m.base, axis: m.axis, bars, yticks, targetY };
    },
    summary(): string {
      const data = props.data || [];
      const parts = data.map((d: CrBarDatum) => d.label + " " + d.value);
      return (props.label || "bar chart") + " — " + parts.join(", ");
    },
    move(event: any) {
      const m = state.metrics();
      const rect = event.currentTarget.getBoundingClientRect();
      if (!rect.width) return;
      const vbX = ((event.clientX - rect.left) / rect.width) * m.W;
      let i = Math.floor((vbX - m.L) / (m.bw + m.gap));
      if (i < 0) i = 0;
      if (i > m.n - 1) i = m.n - 1;
      state.hovering = true;
      state.at = i;
    },
    leave() {
      state.hovering = false;
    },
    cursor() {
      const m = state.metrics();
      const data = props.data || [];
      const idx = state.at;
      const d = data[idx];
      const cx = m.L + idx * (m.bw + m.gap) + m.bw / 2;
      let leftPct = (cx / m.W) * 100;
      if (leftPct < 14) leftPct = 14;
      if (leftPct > 86) leftPct = 86;
      return { leftPct, label: d ? d.label : "", value: d ? d.value : 0, color: state.hue(d ? d.signal : undefined, idx) };
    },
  });

  return (
    <figure class="cr-chart cr-barchart" role="img" aria-label={state.summary()}>
      <svg
        class="cr-barchart__plot"
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
        <For each={state.geo().bars}>
          {(b: { label: string; value: number; color: string; x: number; y: number; w: number; h: number; cx: number }, i: number) => (
            <g>
              <rect
                class="cr-barchart__bar"
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx="1.5"
                style={{ fill: b.color, opacity: state.hovering && state.at !== i ? 0.45 : 1 }}
              />
              <Show when={props.showValues}>
                <text class="cr-chart__val" x={b.cx} y={b.y - 3} text-anchor="middle">{b.value}</text>
              </Show>
              <text class="cr-chart__tick" x={b.cx} y={state.geo().H - 5} text-anchor="middle">{b.label}</text>
            </g>
          )}
        </For>
        <Show when={state.geo().targetY !== null}>
          <line class="cr-chart__target" x1={state.geo().L} y1={state.geo().targetY} x2={state.geo().W - state.geo().R} y2={state.geo().targetY} vector-effect="non-scaling-stroke" />
        </Show>
      </svg>
      <Show when={state.hovering}>
        <div class="cr-chart__tip" style={{ left: state.cursor().leftPct + "%" }} aria-hidden="true">
          <span class="cr-chart__tip-row">
            <span class="cr-chart__tip-sw" style={{ background: state.cursor().color }}></span>
            <span class="cr-chart__tip-n">{state.cursor().label}</span>
            <span class="cr-chart__tip-v">{state.cursor().value}</span>
          </span>
        </div>
      </Show>
    </figure>
  );
}
