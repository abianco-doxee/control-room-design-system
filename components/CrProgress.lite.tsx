import { useStore } from "@builder.io/mitosis";

export interface CrProgressProps {
  /** 0..max. Ignored when indeterminate. */
  value?: number;
  max?: number;
  /** Unknown-duration work — an animated hazard sweep, no numeric value. */
  indeterminate?: boolean;
  /** Signal tone: work (default) · wait · done · err. */
  tone?: string;
  label?: string;
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
      class={
        "cr-progress" +
        (props.indeterminate ? " cr-progress--indeterminate" : "") +
        (props.tone ? " cr-progress--" + props.tone : "")
      }
      role="progressbar"
      aria-label={props.label || "progress"}
      aria-valuemin={props.indeterminate ? undefined : 0}
      aria-valuemax={props.indeterminate ? undefined : props.max || 100}
      aria-valuenow={props.indeterminate ? undefined : props.value}
    >
      <span class="cr-progress__fill" style={state.fillStyle()}></span>
    </div>
  );
}
