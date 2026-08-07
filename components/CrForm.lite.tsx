import { useStore, Show, For } from "@builder.io/mitosis";

export interface CrFormField {
  name: string;
  /** Which control renders: text · email · url · number · select · textarea · checkbox · json. */
  kind: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  /** For `select`: the choices. */
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number | string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface CrFormProps {
  /** The Form Model — plain field descriptors (from the headless forms core). */
  fields: CrFormField[];
  /** Seed values (uncontrolled thereafter; the form manages its own state). */
  values?: Record<string, any>;
  /** Validator: `(values) => { [name]: message }` — an empty object means valid.
   *  Wire the ArkType/JSON-Schema validator from `lib/forms` here. */
  validate?: (values: Record<string, any>) => Record<string, string>;
  submitLabel?: string;
  title?: string;
  disabled?: boolean;
  /** id prefix for field/label/description ids (default "cr-form"). */
  id?: string;
  onChange?: (values: Record<string, any>) => void;
  onSubmit?: (values: Record<string, any>) => void;
}

/* CrForm — a schema-driven form. Feed it a Form Model (field descriptors) and a
 * validate() function and it renders + validates the whole form: it owns
 * value/touched/error state, validates on blur and on submit, and re-checks a
 * field on change once it has been touched (so an error clears as you fix it).
 *
 * It is deliberately schema-AGNOSTIC — it never imports ArkType. The headless
 * `lib/forms` core turns an ArkType type OR a JSON Schema into the `fields` model
 * and the `validate` callback; this component just renders and orchestrates, so
 * it stays portable across all six framework targets. State + helpers are METHODS
 * (a getter would run before the store initialises on Qwik). See references/forms.md. */
export default function CrForm(props: CrFormProps) {
  const state = useStore({
    vals: props.values || {},
    errs: {},
    touched: {},
    submitted: false,
    cid(name: string): string {
      return (props.id || "cr-form") + "-" + name;
    },
    v(name: string): any {
      const x = state.vals[name];
      return x == null ? "" : x;
    },
    showErr(name: string): string {
      return state.submitted || state.touched[name] ? state.errs[name] || "" : "";
    },
    descId(field: CrFormField): string | undefined {
      if (state.showErr(field.name)) return state.cid(field.name) + "-err";
      if (field.hint) return state.cid(field.name) + "-hint";
      return undefined;
    },
    isText(kind: string): boolean {
      return kind === "text" || kind === "email" || kind === "url";
    },
    inputType(kind: string): string {
      return kind === "email" ? "email" : kind === "url" ? "url" : "text";
    },
    opts(field: CrFormField): { value: string; label: string }[] {
      return field.options || [];
    },
    // Always validate the value we're about to commit, never a fresh read of
    // state — a store read right after assignment returns the PRE-update value
    // (React batches the setter), which would lag validation a field behind.
    setField(name: string, value: any) {
      const next = { ...state.vals, [name]: value };
      state.vals = next;
      if (props.onChange) props.onChange(next);
      if ((state.submitted || state.touched[name]) && props.validate) state.errs = props.validate(next) || {};
    },
    blur(name: string) {
      state.touched = { ...state.touched, [name]: true };
      if (props.validate) state.errs = props.validate(state.vals) || {};
    },
    submit(event: any) {
      event.preventDefault();
      const values = state.vals;
      state.submitted = true;
      const t: Record<string, boolean> = {};
      for (const f of props.fields) t[f.name] = true;
      state.touched = t;
      const e = props.validate ? props.validate(values) || {} : {};
      state.errs = e;
      if (Object.keys(e).length === 0 && props.onSubmit) props.onSubmit(values);
    },
  });

  return (
    <form class="cr-form" noValidate onSubmit={(event) => state.submit(event)}>
      <Show when={props.title}>
        <h3 class="cr-form__title">{props.title}</h3>
      </Show>
      <For each={props.fields}>
        {(f: CrFormField) => (
          <div class={"cr-field" + (state.showErr(f.name) ? " cr-field--error" : "")}>
            <Show when={f.kind === "checkbox"}>
              <label class="cr-check">
                <input
                  type="checkbox"
                  name={f.name}
                  checked={state.v(f.name) === true}
                  disabled={props.disabled}
                  aria-describedby={state.descId(f)}
                  onChange={(event) => state.setField(f.name, (event.target as HTMLInputElement).checked)}
                  onBlur={() => state.blur(f.name)}
                />
                {f.label}
              </label>
            </Show>

            <Show when={f.kind !== "checkbox"}>
              <label class="cr-field__label" for={state.cid(f.name)}>
                {f.label}
                <Show when={f.required}>
                  <span class="cr-field__req" aria-hidden="true"> *</span>
                </Show>
              </label>

              <Show when={state.isText(f.kind)}>
                <input
                  id={state.cid(f.name)}
                  name={f.name}
                  class="cr-input"
                  type={state.inputType(f.kind)}
                  value={state.v(f.name)}
                  placeholder={f.placeholder}
                  disabled={props.disabled}
                  required={f.required}
                  aria-required={f.required ? "true" : undefined}
                  aria-invalid={state.showErr(f.name) ? "true" : "false"}
                  aria-describedby={state.descId(f)}
                  onInput={(event) => state.setField(f.name, (event.target as HTMLInputElement).value)}
                  onBlur={() => state.blur(f.name)}
                />
              </Show>

              <Show when={f.kind === "number"}>
                <input
                  id={state.cid(f.name)}
                  name={f.name}
                  class="cr-input"
                  type="number"
                  value={state.v(f.name)}
                  placeholder={f.placeholder}
                  disabled={props.disabled}
                  required={f.required}
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  aria-required={f.required ? "true" : undefined}
                  aria-invalid={state.showErr(f.name) ? "true" : "false"}
                  aria-describedby={state.descId(f)}
                  onInput={(event) => state.setField(f.name, (event.target as HTMLInputElement).value)}
                  onBlur={() => state.blur(f.name)}
                />
              </Show>

              <Show when={f.kind === "select"}>
                <select
                  id={state.cid(f.name)}
                  name={f.name}
                  class="cr-select"
                  value={state.v(f.name)}
                  disabled={props.disabled}
                  required={f.required}
                  aria-required={f.required ? "true" : undefined}
                  aria-invalid={state.showErr(f.name) ? "true" : "false"}
                  aria-describedby={state.descId(f)}
                  onChange={(event) => state.setField(f.name, (event.target as HTMLSelectElement).value)}
                  onBlur={() => state.blur(f.name)}
                >
                  <option value="">{f.placeholder || "Select…"}</option>
                  <For each={state.opts(f)}>
                    {(o: { value: string; label: string }) => <option value={o.value}>{o.label}</option>}
                  </For>
                </select>
              </Show>

              <Show when={f.kind === "textarea" || f.kind === "json"}>
                <textarea
                  id={state.cid(f.name)}
                  name={f.name}
                  class="cr-textarea"
                  value={state.v(f.name)}
                  placeholder={f.placeholder}
                  disabled={props.disabled}
                  required={f.required}
                  aria-required={f.required ? "true" : undefined}
                  aria-invalid={state.showErr(f.name) ? "true" : "false"}
                  aria-describedby={state.descId(f)}
                  onInput={(event) => state.setField(f.name, (event.target as HTMLTextAreaElement).value)}
                  onBlur={() => state.blur(f.name)}
                ></textarea>
              </Show>
            </Show>

            <Show when={f.hint && !state.showErr(f.name)}>
              <span class="cr-field__hint" id={state.cid(f.name) + "-hint"}>{f.hint}</span>
            </Show>
            <Show when={state.showErr(f.name)}>
              <span class="cr-field__error" id={state.cid(f.name) + "-err"} role="alert">{state.showErr(f.name)}</span>
            </Show>
          </div>
        )}
      </For>
      <div class="cr-form__actions">
        <button type="submit" class="cr-btn" disabled={props.disabled}>
          {props.submitLabel || "Submit"}
        </button>
      </div>
    </form>
  );
}
