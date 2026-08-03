import { Show } from "@builder.io/mitosis";

export interface CrFieldProps {
  id: string;
  label: string;
  value?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
}

/** Control Room text Field (label + input + hint/error). Styling from .cr-field. */
export default function CrField(props: CrFieldProps) {
  return (
    <div class={"cr-field" + (props.error ? " cr-field--error" : "")}>
      <label class="cr-field__label" for={props.id}>
        {props.label}
      </label>
      <input
        id={props.id}
        class="cr-input"
        value={props.value}
        placeholder={props.placeholder}
        aria-invalid={props.error ? "true" : "false"}
      />
      <Show when={props.hint && !props.error}>
        <span class="cr-field__hint">{props.hint}</span>
      </Show>
      <Show when={props.error}>
        <span class="cr-field__error">{props.error}</span>
      </Show>
    </div>
  );
}
