import { Show, useStore } from "@builder.io/mitosis";
import CrIcon from "./CrIcon.lite.tsx";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

/* A bare, controlled text input. Pair with CrField for a *visible* label +
 * validation; when used standalone, pass `label` for an accessible name (maps to
 * aria-label) so the control is never unnamed. A placeholder is not a name.
 * `invalid` is a low-level aria hook — for real validation use CrField / CrForm,
 * where validity is derived from a validator, not hand-set.
 *
 * AFFORDANCES: `icon` paints a glyph inside the field on the leading edge;
 * `clearable` adds a real clear button on the trailing edge whenever `value` is
 * non-empty. Both are opt-in, and when neither is used the component renders a
 * *bare* input — identical to before — so the flat DOM that
 * CrField/CrInputGroup/CrFormRow rely on is preserved. With either affordance the
 * input is wrapped in a positioned span.cr-input-wrap and padded on that edge so
 * text never runs under the glyph. Both edges use logical properties
 * (inset-inline-*), so they swap correctly under RTL. */
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
  /** Icon name rendered inside the field, leading edge. */
  icon?: string;
  /** Show a clear button when the field has a value. */
  clearable?: boolean;
  /** Fires when the clear button is pressed. */
  onClear?: () => void;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "icon" · "clear". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}
export default function CrInput(props: CrInputProps) {
  const state = useStore({
    /** The wrapper only exists when an affordance needs it. */
    get wrapped(): boolean {
      return !!props.icon || !!props.clearable;
    },
    /** Clear is offered only when there is something to clear. */
    get showClear(): boolean {
      return !!props.clearable && !!props.value;
    },
  });

  return (
    <>
      <Show when={state.wrapped}>
        <span
          class={ptClass(props.pt, props.unstyled, "cr-input-wrap", "wrap")}
          data-part="wrap"
        >
          <Show when={props.icon}>
            <span
              {...ptAttrs(props.pt, "icon")}
              data-part="icon"
              class={ptClass(props.pt, props.unstyled, "cr-input__icon", "icon")}
              style={ptStyle(props.pt, props.dt, "icon")}
              aria-hidden="true"
            >
              <CrIcon name={props.icon} size={16} />
            </span>
          </Show>
          <input
            {...ptAttrs(props.pt, "root")}
            data-part="root"
            id={props.id}
            name={props.name}
            class={ptClass(props.pt, props.unstyled, "cr-input", "root")}
            style={ptStyle(props.pt, props.dt, "root")}
            type={props.type || "text"}
            value={props.value}
            placeholder={props.placeholder}
            aria-label={props.label}
            required={props.required}
            aria-required={props.required ? "true" : undefined}
            disabled={props.disabled}
            aria-invalid={props.invalid ? "true" : "false"}
            data-state={props.invalid ? "invalid" : "valid"}
            data-icon={props.icon ? "true" : undefined}
            data-clearable={state.showClear ? "true" : undefined}
            onInput={(event) => props.onChange && props.onChange((event.target as HTMLInputElement).value)}
            onBlur={() => props.onBlur && props.onBlur()}
          />
          <Show when={state.showClear}>
            <button
              {...ptAttrs(props.pt, "clear")}
              data-part="clear"
              type="button"
              class={ptClass(props.pt, props.unstyled, "cr-input__clear", "clear")}
              style={ptStyle(props.pt, props.dt, "clear")}
              aria-label="Clear"
              disabled={props.disabled}
              onClick={() => {
                if (props.onClear) props.onClear();
                if (props.onChange) props.onChange("");
              }}
            >
              <CrIcon name="close" size={14} />
            </button>
          </Show>
        </span>
      </Show>
      <Show when={!state.wrapped}>
        <input
          {...ptAttrs(props.pt, "root")}
          data-part="root"
          id={props.id}
          name={props.name}
          class={ptClass(props.pt, props.unstyled, "cr-input", "root")}
          style={ptStyle(props.pt, props.dt, "root")}
          type={props.type || "text"}
          value={props.value}
          placeholder={props.placeholder}
          aria-label={props.label}
          required={props.required}
          aria-required={props.required ? "true" : undefined}
          disabled={props.disabled}
          aria-invalid={props.invalid ? "true" : "false"}
          data-state={props.invalid ? "invalid" : "valid"}
          onInput={(event) => props.onChange && props.onChange((event.target as HTMLInputElement).value)}
          onBlur={() => props.onBlur && props.onBlur()}
        />
      </Show>
    </>
  );
}
