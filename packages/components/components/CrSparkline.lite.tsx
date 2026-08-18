import { useStore, Show, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrSparklineProps {
  /** The series to draw. Sampled left→right; the last point gets the end dot. */
  data: number[];
  /** Signal tone for the line/area/dot (canonical vocabulary). */
  signal?: "work" | "wait" | "done" | "err" | "idle" | "accent" | "accent2";
  /** Fill the area under the line (a faint tint). */
  area?: boolean;
  /** viewBox height; the sparkline stretches to fill its box width. */
  height?: number;
  /** Accessible name — the reading it stands in for (e.g. "p95 latency"). */
  label?: string;
  /* ── styling contract (portable pt/dt subset). Part: "root" (SVG internals are
   * aria-hidden decoration and stay on the cr-spark classes). */
  unstyled?: boolean;
  pt?: CrPassThrough<"root">;
  dt?: CrDesignTokens;
}

/* An inline micro line/area chart for a KPI or table cell — no axes, no grid,
 * just the shape of a trend. Stretches to its container width (preserveAspectRatio
 * none) with a crisp non-scaling 2px stroke; the last sample carries a data-end dot.
 *
 * Geometry lives in one self-contained useStore getter (reads props only) — Mitosis
 * strips free consts and cross-referenced getters can init out of order on some
 * targets. role=img + an aria-label summary; the SVG itself is aria-hidden. */
export default function CrSparkline(props: CrSparklineProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrSparkline"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrSparkline"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrSparkline"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  const state = useStore({
    get geo() {
      const d = props.data || [];
      const H = props.height || 32;
      const W = 120;
      const pad = 3;
      const n = d.length;
      if (!n) return { line: "", area: "", dx: 0, dy: H / 2, H, W };
      let min = d[0];
      let max = d[0];
      for (const v of d) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const range = max - min || 1;
      const innerH = H - pad * 2;
      const pts = d.map((v: number, i: number) => ({
        x: n === 1 ? W / 2 : (i / (n - 1)) * W,
        y: pad + (1 - (v - min) / range) * innerH,
      }));
      const line = pts.map((p: { x: number; y: number }) => p.x.toFixed(2) + "," + p.y.toFixed(2)).join(" ");
      let areaPath = "M " + pts[0].x.toFixed(2) + "," + H.toFixed(2);
      for (const p of pts) areaPath += " L " + p.x.toFixed(2) + "," + p.y.toFixed(2);
      areaPath += " L " + pts[n - 1].x.toFixed(2) + "," + H.toFixed(2) + " Z";
      return { line, area: areaPath, dx: pts[n - 1].x, dy: pts[n - 1].y, H, W };
    },
    get summary(): string {
      const d = props.data || [];
      const name = props.label || "trend";
      if (!d.length) return name + ": no data";
      return name + ": " + d.length + " points, latest " + d[d.length - 1];
    },
  });

  return (
    <span {...ptAttrs(ptResolve(cr, props.pt, "CrSparkline"), "root")} class={ptClass(ptResolve(cr, props.pt, "CrSparkline"), props.unstyled, "cr-spark cr-spark--" + (props.signal || "work"), "root")} data-part="root" style={ptStyle(ptResolve(cr, props.pt, "CrSparkline"), props.dt, "root")} role="img" aria-label={state.summary}>
      <svg class="cr-spark__svg" viewBox={"0 0 " + state.geo.W + " " + state.geo.H} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <Show when={props.area}>
          <path class="cr-spark__area" d={state.geo.area} />
        </Show>
        <polyline class="cr-spark__line" points={state.geo.line} vector-effect="non-scaling-stroke" />
        <circle class="cr-spark__dot" cx={state.geo.dx} cy={state.geo.dy} r="2.4" vector-effect="non-scaling-stroke" />
      </svg>
    </span>
  );
}
