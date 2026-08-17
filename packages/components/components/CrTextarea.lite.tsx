import { useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

/* A bare, controlled textarea. Pair with CrField for a *visible* label +
 * validation; standalone, pass `label` for an accessible name (maps to
 * aria-label). A placeholder is not a name. `invalid` is a low-level aria hook —
 * for real validation use CrField / CrForm. */
export interface CrTextareaProps {
  id?: string;
  name?: string;
  value?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root". */
  unstyled?: boolean;
  pt?: CrPassThrough<"root">;
  dt?: CrDesignTokens;
}
export default function CrTextarea(props: CrTextareaProps) {
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
    <textarea
      {...ptAttrs(ptResolve(cr, props.pt, "CrTextarea"), "root")}
      data-part="root"
      id={props.id}
      name={props.name}
      class={ptClass(ptResolve(cr, props.pt, "CrTextarea"), props.unstyled, "cr-textarea", "root")}
      style={ptStyle(ptResolve(cr, props.pt, "CrTextarea"), props.dt, "root")}
      value={props.value}
      placeholder={props.placeholder}
      aria-label={props.label}
      required={props.required}
      aria-required={props.required ? "true" : undefined}
      disabled={props.disabled}
      aria-invalid={props.invalid ? "true" : "false"}
      data-state={props.invalid ? "invalid" : "valid"}
      onInput={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrTextarea'), 'root', 'onInput', event); props.onChange && props.onChange((event.target as HTMLTextAreaElement).value); }}
      onBlur={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrTextarea'), 'root', 'onBlur', event); props.onBlur && props.onBlur(); }}
    ></textarea>
  );
}
