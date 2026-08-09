import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

// A bare, controlled text input. Pair with CrField for a *visible* label +
// validation; when used standalone, pass `label` for an accessible name (maps to
// aria-label) so the control is never unnamed. A placeholder is not a name.
// `invalid` is a low-level aria hook — for real validation use CrField / CrForm,
// where validity is derived from a validator, not hand-set.
export interface CrInputProps {
  id?: string;
  name?: string;
  type?: string;
  value?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}
export default function CrInput(props: CrInputProps) {
  return (
    <input
      {...ptAttrs(props.pt, "root")}
      data-part="root"
      id={props.id}
      name={props.name}
      class={ptClass(props.pt, props.unstyled, "cr-input", "root")}
      style={ptStyle(props.pt, props.dt, "root")}
      type={props.type || "text"}
      value={props.value}
      placeholder={props.placeholder}
      aria-label={props.label}
      required={props.required}
      aria-required={props.required ? "true" : undefined}
      disabled={props.disabled}
      aria-invalid={props.invalid ? "true" : "false"}
      data-state={props.invalid ? "invalid" : "valid"}
      onInput={(event) => props.onChange && props.onChange((event.target as HTMLInputElement).value)}
      onBlur={() => props.onBlur && props.onBlur()}
    />
  );
}
