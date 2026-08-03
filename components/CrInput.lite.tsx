export interface CrInputProps { id?: string; type?: string; placeholder?: string; disabled?: boolean; invalid?: boolean; }
export default function CrInput(props: CrInputProps) {
  return (
    <input
      id={props.id}
      class="cr-input"
      type={props.type || "text"}
      placeholder={props.placeholder}
      disabled={props.disabled}
      aria-invalid={props.invalid ? "true" : "false"}
    />
  );
}
