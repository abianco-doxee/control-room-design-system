import { Show, useStore } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrMeterProps {
  value: number;
  max?: number;
  label?: string;
  /** Signal for the fill (canonical vocabulary). */
  signal?: "work" | "wait" | "done" | "err" | "idle";
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "label" · "track" · "fill". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
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
    <div {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-meter cr-meter--" + (props.signal || "work"), "root")} data-part="root" data-state={props.signal || "work"} style={ptStyle(props.pt, props.dt, "root")}>
      <Show when={props.label}>
        <span {...ptAttrs(props.pt, "label")} class={ptClass(props.pt, props.unstyled, "cr-meter__label", "label")} data-part="label">{props.label}</span>
      </Show>
      <span
        {...ptAttrs(props.pt, "track")}
        class={ptClass(props.pt, props.unstyled, "cr-meter__track", "track")}
        data-part="track"
        role="meter"
        aria-valuenow={props.value}
        aria-valuemin={0}
        aria-valuemax={state.max}
        aria-label={props.label || "meter"}
      >
        <span {...ptAttrs(props.pt, "fill")} class={ptClass(props.pt, props.unstyled, "cr-meter__fill", "fill")} data-part="fill" style={{ width: state.pct + "%" }}></span>
      </span>
    </div>
  );
}
