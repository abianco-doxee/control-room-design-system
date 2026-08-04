// A bare text input. Pair with CrField for a *visible* label; when used standalone,
// pass `label` for an accessible name (maps to aria-label) so the control is never
// unnamed. A placeholder is not an accessible name.
export interface CrInputProps { id?: string; type?: string; placeholder?: string; label?: string; disabled?: boolean; invalid?: boolean; }
export default function CrInput(props: CrInputProps) {
  return (
    <input
      id={props.id}
      class="cr-input"
      type={props.type || "text"}
      placeholder={props.placeholder}
      aria-label={props.label}
      disabled={props.disabled}
      aria-invalid={props.invalid ? "true" : "false"}
    />
  );
}
