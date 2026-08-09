import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrChoiceProps {
  type?: "checkbox" | "radio";
  name?: string;
  label: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "input" · "label". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}
export default function CrChoice(props: CrChoiceProps) {
  return (
    <label {...ptAttrs(props.pt, "root")} data-part="root" class={ptClass(props.pt, props.unstyled, "cr-check", "root")} style={ptStyle(props.pt, props.dt, "root")}>
      <input
        {...ptAttrs(props.pt, "input")}
        data-part="input"
        data-state={props.checked ? "checked" : "unchecked"}
        type={props.type || "checkbox"}
        name={props.name}
        checked={props.checked}
        disabled={props.disabled}
        onChange={(event) => props.onChange && props.onChange(event.target.checked)}
      />
      <span {...ptAttrs(props.pt, "label")} data-part="label">{props.label}</span>
    </label>
  );
}
