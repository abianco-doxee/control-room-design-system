import { Show } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrToggleChipProps {
  label: string;
  /** On/off state (multi-select filter semantics — use several independently). */
  pressed?: boolean;
  /** Optional trailing count badge (e.g. matches for this facet). */
  count?: number;
  onToggle?: () => void;
  disabled?: boolean;
  /* ── styling contract (portable pt/dt subset). Parts: "root" · "count".
   * Law 2: the ON state reads via the accent (a state), NOT a per-option identity
   * hue — retarget it with dt={{ "--cr-togglechip-on-bg": … }} if needed. */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* An interactive multi-select filter pill (role=checkbox). Distinct from the
 * static CrChip (display) and the single-select CrSegmented (radiogroup): several
 * ToggleChips toggle independently. On/off is announced via aria-checked and
 * exposed as data-state. Styling: .cr-togglechip; data-part on root + count. */
export default function CrToggleChip(props: CrToggleChipProps) {
  return (
    <button
      {...ptAttrs(props.pt, "root")}
      type="button"
      role="checkbox"
      aria-checked={props.pressed ? "true" : "false"}
      disabled={props.disabled}
      data-part="root"
      data-state={props.pressed ? "on" : "off"}
      class={ptClass(props.pt, props.unstyled, "cr-togglechip" + (props.pressed ? " cr-togglechip--on" : ""), "root")}
      style={ptStyle(props.pt, props.dt, "root")}
      onClick={() => props.onToggle && props.onToggle()}
    >
      {props.label}
      <Show when={props.count !== undefined && props.count !== null}>
        <span {...ptAttrs(props.pt, "count")} class={ptClass(props.pt, props.unstyled, "cr-togglechip__count", "count")} data-part="count">
          {props.count}
        </span>
      </Show>
    </button>
  );
}
