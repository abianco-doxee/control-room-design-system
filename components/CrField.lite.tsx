import { Show } from "@builder.io/mitosis";

export interface CrFieldProps {
  id: string;
  label: string;
  /** Submitted field name. */
  name?: string;
  value?: string;
  /** Input type — text · email · url · password · search · tel. */
  type?: string;
  placeholder?: string;
  hint?: string;
  /** Validation message. Its presence drives aria-invalid + the error style. */
  error?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onBlur?: () => void;
}

/* Control Room text Field — label + input + hint/error, wired for validation.
 * The `error` string is the single source of truth: it sets aria-invalid, swaps
 * the hint for the error, and links the message via aria-describedby. `required`
 * sets aria-required and a visible marker. Controlled via value + onChange (live,
 * on input); onBlur lets a form validate on leave. There is no hand-set `invalid`
 * boolean — validity comes from a validator, not a guess. Styling from .cr-field. */
export default function CrField(props: CrFieldProps) {
  return (
    <div class={"cr-field" + (props.error ? " cr-field--error" : "")}>
      <label class="cr-field__label" for={props.id}>
        {props.label}
        <Show when={props.required}>
          <span class="cr-field__req" aria-hidden="true"> *</span>
        </Show>
      </label>
      <input
        id={props.id}
        name={props.name}
        class="cr-input"
        type={props.type || "text"}
        value={props.value}
        placeholder={props.placeholder}
        disabled={props.disabled}
        required={props.required}
        aria-required={props.required ? "true" : undefined}
        aria-invalid={props.error ? "true" : "false"}
        aria-describedby={props.error ? props.id + "-err" : props.hint ? props.id + "-hint" : undefined}
        onInput={(event) => props.onChange && props.onChange((event.target as HTMLInputElement).value)}
        onBlur={() => props.onBlur && props.onBlur()}
      />
      <Show when={props.hint && !props.error}>
        <span class="cr-field__hint" id={props.id + "-hint"}>{props.hint}</span>
      </Show>
      <Show when={props.error}>
        <span class="cr-field__error" id={props.id + "-err"} role="alert">{props.error}</span>
      </Show>
    </div>
  );
}
