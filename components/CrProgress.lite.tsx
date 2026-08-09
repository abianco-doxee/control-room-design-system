import { useStore } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrProgressProps {
  /** 0..max. Ignored when indeterminate. */
  value?: number;
  max?: number;
  /** Unknown-duration work — an animated hazard sweep, no numeric value. */
  indeterminate?: boolean;
  /** Signal for the fill (canonical vocabulary): work · wait · done · err. */
  signal?: "work" | "wait" | "done" | "err";
  label?: string;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "fill". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* Task progress (role=progressbar). Determinate fills to value/max; indeterminate
 * runs an animated hazard sweep and drops the numeric aria values. Distinct from
 * Meter (which is a static capacity reading). Styling via .cr-progress.
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
      role="progressbar"
      aria-label={props.label || "progress"}
      aria-valuemin={props.indeterminate ? undefined : 0}
      aria-valuemax={props.indeterminate ? undefined : props.max || 100}
      aria-valuenow={props.indeterminate ? undefined : props.value}
    >
      <span {...ptAttrs(props.pt, "fill")} class={ptClass(props.pt, props.unstyled, "cr-progress__fill", "fill")} data-part="fill" style={state.fillStyle()}></span>
    </div>
  );
}
