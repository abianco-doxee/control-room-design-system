import { Show, useStore, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import CrIcon from "./CrIcon.lite.tsx";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler, resolveMessage } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

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
  /** Override this component's built-in English strings. Any key you omit falls
   *  back to the app-level `messages` from context, then to the built-in default.
   *  See lib/messages.ts for the keys. */
  labels?: Record<string, any>;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "icon" · "clear". */
  unstyled?: boolean;
  pt?: CrPassThrough<"clear" | "icon" | "root" | "wrap">;
  dt?: CrDesignTokens;
}
export default function CrInput(props: CrInputProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onMounted) props.pt.hooks.onMounted();
  });
  onUpdate(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onUpdated) props.pt.hooks.onUpdated();
  }, []);
  onUnMount(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onUnmounted) props.pt.hooks.onUnmounted();
  });

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
          class={ptClass(ptResolve(cr, props.pt, "CrInput"), props.unstyled, "cr-input-wrap", "wrap")}
          data-part="wrap"
        >
          <Show when={props.icon}>
            <span
              {...ptAttrs(ptResolve(cr, props.pt, "CrInput"), "icon")}
              data-part="icon"
              class={ptClass(ptResolve(cr, props.pt, "CrInput"), props.unstyled, "cr-input__icon", "icon")}
              style={ptStyle(ptResolve(cr, props.pt, "CrInput"), props.dt, "icon")}
              aria-hidden="true"
            >
              <CrIcon name={props.icon} size={16} />
            </span>
          </Show>
          <input
            {...ptAttrs(ptResolve(cr, props.pt, "CrInput"), "root")}
            data-part="root"
            id={props.id}
            name={props.name}
            class={ptClass(ptResolve(cr, props.pt, "CrInput"), props.unstyled, "cr-input", "root")}
            style={ptStyle(ptResolve(cr, props.pt, "CrInput"), props.dt, "root")}
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
            onInput={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrInput'), 'root', 'onInput', event); props.onChange && props.onChange((event.target as HTMLInputElement).value); }}
            onBlur={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrInput'), 'root', 'onBlur', event); props.onBlur && props.onBlur(); }}
          />
          <Show when={state.showClear}>
            <button
              {...ptAttrs(ptResolve(cr, props.pt, "CrInput"), "clear")}
              data-part="clear"
              type="button"
              class={ptClass(ptResolve(cr, props.pt, "CrInput"), props.unstyled, "cr-input__clear", "clear")}
              style={ptStyle(ptResolve(cr, props.pt, "CrInput"), props.dt, "clear")}
              aria-label={resolveMessage(cr, props.labels, "CrInput", "clear")}
              disabled={props.disabled}
              onClick={(event) => {
                ptHandler(ptResolve(cr, props.pt, 'CrInput'), 'clear', 'onClick', event);
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
          {...ptAttrs(ptResolve(cr, props.pt, "CrInput"), "root")}
          data-part="root"
          id={props.id}
          name={props.name}
          class={ptClass(ptResolve(cr, props.pt, "CrInput"), props.unstyled, "cr-input", "root")}
          style={ptStyle(ptResolve(cr, props.pt, "CrInput"), props.dt, "root")}
          type={props.type || "text"}
          value={props.value}
          placeholder={props.placeholder}
          aria-label={props.label}
          required={props.required}
          aria-required={props.required ? "true" : undefined}
          disabled={props.disabled}
          aria-invalid={props.invalid ? "true" : "false"}
          data-state={props.invalid ? "invalid" : "valid"}
          onInput={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrInput'), 'root', 'onInput', event); props.onChange && props.onChange((event.target as HTMLInputElement).value); }}
          onBlur={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrInput'), 'root', 'onBlur', event); props.onBlur && props.onBlur(); }}
        />
      </Show>
    </>
  );
}
