import { Show, For } from "@builder.io/mitosis";

export interface CrCronPreset {
  label: string;
  cron: string;
}

export interface CrCronFieldProps {
  /** Ties the label, input and messages together — required for a real field. */
  id: string;
  /** Visible label. Omit and the input still gets an accessible name. */
  label?: string;
  /** Submitted field name. */
  name?: string;
  value: string;
  /** Quick-fill presets. */
  presets?: CrCronPreset[];
  /** Human-readable translation of a VALID `value` — the host computes this (e.g.
   *  with cronstrue) and passes it in, so the design system stays parser-free. */
  description?: string;
  /** Static help text (shown when there's no description and no error). */
  hint?: string;
  /** Validation message for an unparseable / rejected expression. Its presence is
   *  the single source of truth: it sets aria-invalid, shows the error, and links
   *  it via aria-describedby. There is no hand-set `invalid` boolean — validity is
   *  a message from the host's parser/validator, not a guess. */
  error?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onBlur?: () => void;
}

/* Control Room cron Field — a proper form field: label + input + presets + a live
 * human-readable readout, wired for validation the same way as CrField. The host
 * translates the expression (cronstrue or any parser) and passes `description` when
 * it parses or `error` when it doesn't; the component only displays. `error` drives
 * aria-invalid + the error style; `description`/`hint` are linked via
 * aria-describedby. Controlled via value + onChange; onBlur lets a form validate on
 * leave. Styling via .cr-cron (+ the shared .cr-field__* label/hint/error). */
export default function CrCronField(props: CrCronFieldProps) {
  return (
    <div class={"cr-cron" + (props.error ? " cr-cron--error" : "")}>
      <Show when={props.label}>
        <label class="cr-field__label" for={props.id}>
          {props.label}
          <Show when={props.required}>
            <span class="cr-field__req" aria-hidden="true"> *</span>
          </Show>
        </label>
      </Show>
      <input
        id={props.id}
        name={props.name}
        class="cr-cron__input"
        type="text"
        spellcheck={false}
        value={props.value}
        aria-label={props.label ? undefined : "Cron expression"}
        placeholder="* * * * *"
        disabled={props.disabled}
        required={props.required}
        aria-required={props.required ? "true" : undefined}
        aria-invalid={props.error ? "true" : "false"}
        aria-describedby={props.error ? props.id + "-err" : props.description ? props.id + "-desc" : props.hint ? props.id + "-hint" : undefined}
        onInput={(event) => props.onChange && props.onChange((event.target as HTMLInputElement).value)}
        onBlur={() => props.onBlur && props.onBlur()}
      />
      <Show when={props.presets}>
        <div class="cr-cron__presets">
          <For each={props.presets}>
            {(pre: CrCronPreset) => (
              <button type="button" class="cr-cron__preset" disabled={props.disabled} onClick={() => props.onChange && props.onChange(pre.cron)}>
                {pre.label}
              </button>
            )}
          </For>
        </div>
      </Show>
      <Show when={props.error}>
        <span class="cr-field__error" id={props.id + "-err"} role="alert">{props.error}</span>
      </Show>
      <Show when={props.description && !props.error}>
        <p class="cr-cron__out" id={props.id + "-desc"} aria-live="polite">{props.description}</p>
      </Show>
      <Show when={props.hint && !props.description && !props.error}>
        <span class="cr-field__hint" id={props.id + "-hint"}>{props.hint}</span>
      </Show>
    </div>
  );
}
