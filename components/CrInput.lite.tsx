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
}
export default function CrInput(props: CrInputProps) {
  return (
    <input
      id={props.id}
      name={props.name}
      class="cr-input"
      type={props.type || "text"}
      value={props.value}
      placeholder={props.placeholder}
      aria-label={props.label}
      required={props.required}
      aria-required={props.required ? "true" : undefined}
      disabled={props.disabled}
      aria-invalid={props.invalid ? "true" : "false"}
      onInput={(event) => props.onChange && props.onChange((event.target as HTMLInputElement).value)}
      onBlur={() => props.onBlur && props.onBlur()}
    />
  );
}
