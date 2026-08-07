// A bare, controlled textarea. Pair with CrField for a *visible* label +
// validation; standalone, pass `label` for an accessible name (maps to
// aria-label). A placeholder is not a name. `invalid` is a low-level aria hook —
// for real validation use CrField / CrForm.
export interface CrTextareaProps {
  id?: string;
  name?: string;
  value?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  onChange?: (value: string) => void;
  onBlur?: () => void;
}
export default function CrTextarea(props: CrTextareaProps) {
  return (
    <textarea
      id={props.id}
      name={props.name}
      class="cr-textarea"
      value={props.value}
      placeholder={props.placeholder}
      aria-label={props.label}
      required={props.required}
      aria-required={props.required ? "true" : undefined}
      disabled={props.disabled}
      aria-invalid={props.invalid ? "true" : "false"}
      onInput={(event) => props.onChange && props.onChange((event.target as HTMLTextAreaElement).value)}
      onBlur={() => props.onBlur && props.onBlur()}
    ></textarea>
  );
}
