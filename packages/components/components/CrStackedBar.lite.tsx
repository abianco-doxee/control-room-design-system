import { useStore, Show, For, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrStackSegment {
  label: string;
  value: number;
  /** Signal tone for the segment (this IS the status meaning — labelled, not colour-alone). */
  signal: "work" | "wait" | "done" | "err" | "idle" | "accent" | "accent2";
}

export interface CrStackedBarProps {
  segments: CrStackSegment[];
  label?: string;
  /** Show the legend row (swatch · label · value · %). Default true. */
  showLegend?: boolean;
  /* ── styling contract (portable pt/dt subset). Part: "root". Segment fills are
   * signal-driven (color IS the status) and stay on the cr-stack classes. */
  unstyled?: boolean;
  pt?: CrPassThrough<"root">;
  dt?: CrDesignTokens;
}

/* A single composition bar — "stacked progress". One track split into signal-toned
 * segments (sized by share of the total) with a 2px surface gap between them, plus
 * a legend that names each segment with its value and percentage. Use it for a
 * breakdown: fleet state, error budget, queue mix. Compose several in a column for
 * a per-row comparison.
 *
 * role=img + a spoken summary; the coloured segments carry identity, the legend
 * carries the words (never colour-alone). Percentages are computed in a getter. */
export default function CrStackedBar(props: CrStackedBarProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrStackedBar"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrStackedBar"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrStackedBar"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  const state = useStore({
    get rows() {
      const segs = props.segments || [];
      let total = 0;
      for (const s of segs) total += s.value;
      const t = total || 1;
      return segs.map((s: CrStackSegment) => ({
        label: s.label,
        value: s.value,
        signal: s.signal,
        pct: (s.value / t) * 100,
      }));
    },
    get summary(): string {
      const segs = props.segments || [];
      let total = 0;
      for (const s of segs) total += s.value;
      const t = total || 1;
      const parts = segs.map((s: CrStackSegment) => s.label + " " + s.value + " (" + Math.round((s.value / t) * 100) + "%)");
      return (props.label || "breakdown") + " — " + parts.join(", ");
    },
  });

  return (
    <div {...ptAttrs(ptResolve(cr, props.pt, "CrStackedBar"), "root")} class={ptClass(ptResolve(cr, props.pt, "CrStackedBar"), props.unstyled, "cr-stack", "root")} data-part="root" style={ptStyle(ptResolve(cr, props.pt, "CrStackedBar"), props.dt, "root")} role="img" aria-label={state.summary}>
      <Show when={props.label}>
        <span class="cr-stack__label">{props.label}</span>
      </Show>
      <div class="cr-stack__bar" aria-hidden="true">
        <For each={state.rows}>
          {(r: { label: string; value: number; signal: string; pct: number }) => (
            <span class={"cr-stack__seg cr-stack__seg--" + r.signal} style={{ flexGrow: r.pct }} title={r.label + " · " + r.value}></span>
          )}
        </For>
      </div>
      <Show when={props.showLegend !== false}>
        <div class="cr-stack__legend" aria-hidden="true">
          <For each={state.rows}>
            {(r: { label: string; value: number; signal: string; pct: number }) => (
              <span class="cr-stack__key">
                <span class={"cr-stack__sw cr-stack__seg--" + r.signal}></span>
                <span class="cr-stack__kl">{r.label}</span>
                <span class="cr-stack__kv">{r.value}</span>
                <span class="cr-stack__kp">{Math.round(r.pct) + "%"}</span>
              </span>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
