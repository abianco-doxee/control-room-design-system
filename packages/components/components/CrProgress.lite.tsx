import { Show, useStore } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrProgressProps {
  /** 0..max. Ignored when indeterminate. */
  value?: number;
  max?: number;
  /** Unknown-duration work — an animated hazard sweep, no numeric value. */
  indeterminate?: boolean;
  /** Signal for the fill (canonical vocabulary): work · wait · done · err · idle. */
  signal?: "work" | "wait" | "done" | "err" | "idle";
  /** Optional inline caption rendered before the bar. */
  label?: string;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "label" · "track" · "fill". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* Progress and capacity in one bar (role=progressbar). Determinate fills to
 * value/max; indeterminate runs an animated hazard sweep and drops the numeric
 * aria values. An optional label renders inline before the track, which makes it
 * serve the capacity / utilisation reading as well as task progress. Square,
 * hard-edged, keyed to a signal tone. Styling via .cr-progress.
 *
 * The fill style is a useStore METHOD, not a getter — a getter compiles to a Qwik
 * useComputed that can run before the store is initialized. */
export default function CrProgress(props: CrProgressProps) {
  const state = useStore({
    fillStyle() {
      if (props.indeterminate) return {};
      const pct = Math.max(0, Math.min(100, ((props.value || 0) / (props.max || 100)) * 100));
      return { width: pct + "%" };
    },
  });

  return (
    <div
      {...ptAttrs(props.pt, "root")}
      class={ptClass(
        props.pt,
        props.unstyled,
        "cr-progress" +
          (props.indeterminate ? " cr-progress--indeterminate" : "") +
          (props.signal ? " cr-progress--" + props.signal : ""),
        "root"
      )}
      data-part="root"
      data-state={props.indeterminate ? "indeterminate" : props.signal}
      style={ptStyle(props.pt, props.dt, "root")}
    >
      <Show when={props.label}>
        <span {...ptAttrs(props.pt, "label")} class={ptClass(props.pt, props.unstyled, "cr-progress__label", "label")} data-part="label">{props.label}</span>
      </Show>
      <span
        {...ptAttrs(props.pt, "track")}
        class={ptClass(props.pt, props.unstyled, "cr-progress__track", "track")}
        data-part="track"
        role="progressbar"
        aria-label={props.label || "progress"}
        aria-valuemin={props.indeterminate ? undefined : 0}
        aria-valuemax={props.indeterminate ? undefined : props.max || 100}
        aria-valuenow={props.indeterminate ? undefined : props.value}
      >
        <span {...ptAttrs(props.pt, "fill")} class={ptClass(props.pt, props.unstyled, "cr-progress__fill", "fill")} data-part="fill" style={state.fillStyle()}></span>
      </span>
    </div>
  );
}
