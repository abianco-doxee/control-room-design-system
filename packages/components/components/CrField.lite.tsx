import { Show, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

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
  /** Supply your own control instead of the built-in <input> — a CrSelect,
   *  CrTextarea, CrCombobox, or any custom widget. The label/hint/error chrome
   *  and its wiring stay; only the control is replaced. You own the control's
   *  `id` (match `props.id` so the label points at it) and its aria-invalid /
   *  aria-describedby, since the component can no longer set them for you. */
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "label" · "req" · "input" · "hint" · "error". */
  unstyled?: boolean;
  pt?: CrPassThrough<"error" | "hint" | "input" | "label" | "req" | "root">;
  dt?: CrDesignTokens;
}

/* Control Room text Field — label + input + hint/error, wired for validation.
 * The `error` string is the single source of truth: it sets aria-invalid, swaps
 * the hint for the error, and links the message via aria-describedby. `required`
 * sets aria-required and a visible marker. Controlled via value + onChange (live,
 * on input); onBlur lets a form validate on leave. There is no hand-set `invalid`
 * boolean — validity comes from a validator, not a guess. Styling from .cr-field. */
export default function CrField(props: CrFieldProps) {
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

  return (
    <div
      {...ptAttrs(ptResolve(cr, props.pt, "CrField"), "root")}
      data-part="root"
      class={ptClass(ptResolve(cr, props.pt, "CrField"), props.unstyled, "cr-field" + (props.error ? " cr-field--error" : ""), "root")}
      data-state={props.error ? "error" : "valid"}
      style={ptStyle(ptResolve(cr, props.pt, "CrField"), props.dt, "root")}
    >
      <label {...ptAttrs(ptResolve(cr, props.pt, "CrField"), "label")} data-part="label" class={ptClass(ptResolve(cr, props.pt, "CrField"), props.unstyled, "cr-field__label", "label")} for={props.id}>
        {props.label}
        <Show when={props.required}>
          <span {...ptAttrs(ptResolve(cr, props.pt, "CrField"), "req")} data-part="req" class={ptClass(ptResolve(cr, props.pt, "CrField"), props.unstyled, "cr-field__req", "req")} aria-hidden="true"> *</span>
        </Show>
      </label>
      <Show
        when={props.children}
        else={
          <input
            {...ptAttrs(ptResolve(cr, props.pt, "CrField"), "input")}
            data-part="input"
            id={props.id}
            name={props.name}
            class={ptClass(ptResolve(cr, props.pt, "CrField"), props.unstyled, "cr-input", "input")}
            type={props.type || "text"}
            value={props.value}
            placeholder={props.placeholder}
            disabled={props.disabled}
            required={props.required}
            aria-required={props.required ? "true" : undefined}
            aria-invalid={props.error ? "true" : "false"}
            data-state={props.error ? "invalid" : "valid"}
            aria-describedby={props.error ? props.id + "-err" : props.hint ? props.id + "-hint" : undefined}
            onInput={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrField'), 'input', 'onInput', event); props.onChange && props.onChange((event.target as HTMLInputElement).value); }}
            onBlur={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrField'), 'input', 'onBlur', event); props.onBlur && props.onBlur(); }}
          />
        }
      >
        {props.children}
      </Show>
      <Show when={props.hint && !props.error}>
        <span {...ptAttrs(ptResolve(cr, props.pt, "CrField"), "hint")} data-part="hint" class={ptClass(ptResolve(cr, props.pt, "CrField"), props.unstyled, "cr-field__hint", "hint")} id={props.id + "-hint"}>{props.hint}</span>
      </Show>
      <Show when={props.error}>
        <span {...ptAttrs(ptResolve(cr, props.pt, "CrField"), "error")} data-part="error" class={ptClass(ptResolve(cr, props.pt, "CrField"), props.unstyled, "cr-field__error", "error")} id={props.id + "-err"} role="alert">{props.error}</span>
      </Show>
    </div>
  );
}
