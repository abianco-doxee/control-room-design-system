export interface CrTextareaProps { id?: string; placeholder?: string; disabled?: boolean; invalid?: boolean; }
export default function CrTextarea(props: CrTextareaProps) {
  return (
    <textarea
      id={props.id}
      class="cr-textarea"
      placeholder={props.placeholder}
      disabled={props.disabled}
      aria-invalid={props.invalid ? "true" : "false"}
    />
  );
}
