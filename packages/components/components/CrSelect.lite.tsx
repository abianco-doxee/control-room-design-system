import { For } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";
// A bare native select. Pair with CrField for a *visible* label; standalone, pass
// `label` for an accessible name (maps to aria-label) so it is never unnamed.
export interface CrSelectProps {
  id?: string;
  options: string[];
  label?: string;
  disabled?: boolean;
  /** Marks the control invalid for assistive tech (sets aria-invalid). Visual
   *  error styling comes from a wrapping CrField — this is the a11y half only. */
  invalid?: boolean;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "option". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}
export default function CrSelect(props: CrSelectProps) {
  return (
    <select
      {...ptAttrs(props.pt, "root")}
      id={props.id}
      class={ptClass(props.pt, props.unstyled, "cr-select", "root")}
      data-part="root"
      style={ptStyle(props.pt, props.dt, "root")}
      aria-label={props.label}
      disabled={props.disabled}
      aria-invalid={props.invalid ? "true" : "false"}
      data-state={props.invalid ? "invalid" : "valid"}
    >
      <For each={props.options}>{(opt: string) => <option {...ptAttrs(props.pt, "option")} data-part="option" value={opt}>{opt}</option>}</For>
    </select>
  );
}
