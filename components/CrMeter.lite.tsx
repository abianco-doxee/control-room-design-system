import { Show, useStore } from "@builder.io/mitosis";

export interface CrMeterProps {
  value: number;
  max?: number;
  label?: string;
  /** Signal tone for the fill: work | wait | done | err | idle. */
  tone?: string;
}

/* A token-driven bar meter (capacity / utilisation). Square, hard-edged, keyed
 * to a signal tone. Styling via .cr-meter; the fill width is a legit dynamic
 * binding. role=meter with aria value attributes for assistive tech.
 *
 * Derived values live in useStore getters — Mitosis strips free consts in the
 * component body for some targets, so anything computed must be a getter/method. */
export default function CrMeter(props: CrMeterProps) {
  const state = useStore({
    get max() {
      return props.max || 100;
    },
    get pct() {
      return Math.max(0, Math.min(100, (props.value / (props.max || 100)) * 100));
    },
  });
  return (
    <div class={"cr-meter cr-meter--" + (props.tone || "work")}>
      <Show when={props.label}>
        <span class="cr-meter__label">{props.label}</span>
      </Show>
      <span
        class="cr-meter__track"
        role="meter"
        aria-valuenow={props.value}
        aria-valuemin={0}
        aria-valuemax={state.max}
        aria-label={props.label || "meter"}
      >
        <span class="cr-meter__fill" style={{ width: state.pct + "%" }}></span>
      </span>
    </div>
  );
}
