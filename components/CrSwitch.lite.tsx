import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrSwitchProps {
  checked?: boolean;
  label?: string;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "track". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/** Control Room Switch — button[role=switch]; styling from .cr-switch. */
export default function CrSwitch(props: CrSwitchProps) {
  return (
    <button
      {...ptAttrs(props.pt, "root")}
      data-part="root"
      data-state={props.checked ? "checked" : "unchecked"}
      type="button"
      role="switch"
      aria-checked={props.checked ? "true" : "false"}
      disabled={props.disabled}
      class={ptClass(props.pt, props.unstyled, "cr-switch", "root")}
      style={ptStyle(props.pt, props.dt, "root")}
      onClick={() => props.onChange && props.onChange(!props.checked)}
    >
      <span {...ptAttrs(props.pt, "track")} data-part="track" class={ptClass(props.pt, props.unstyled, "cr-switch__track", "track")} aria-hidden="true" />
      {props.label}
    </button>
  );
}
