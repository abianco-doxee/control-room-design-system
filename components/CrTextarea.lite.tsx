// A bare textarea. Pair with CrField for a *visible* label; standalone, pass `label`
// for an accessible name (maps to aria-label). A placeholder is not a name.
export interface CrTextareaProps { id?: string; placeholder?: string; label?: string; disabled?: boolean; invalid?: boolean; }
export default function CrTextarea(props: CrTextareaProps) {
  return (
    <textarea
      id={props.id}
      class="cr-textarea"
      placeholder={props.placeholder}
      aria-label={props.label}
      disabled={props.disabled}
      aria-invalid={props.invalid ? "true" : "false"}
    />
  );
}
