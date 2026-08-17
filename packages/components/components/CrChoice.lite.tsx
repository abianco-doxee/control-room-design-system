import { useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrChoiceProps {
  type?: "checkbox" | "radio";
  name?: string;
  label: string;
  checked?: boolean;
  disabled?: boolean;
  /** Marks the control invalid for assistive tech (sets aria-invalid). Visual
   *  error styling comes from a wrapping CrField — this is the a11y half only. */
  invalid?: boolean;
  onChange?: (checked: boolean) => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "input" · "label". */
  unstyled?: boolean;
  pt?: CrPassThrough<"input" | "label" | "root">;
  dt?: CrDesignTokens;
}
export default function CrChoice(props: CrChoiceProps) {
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
    <label {...ptAttrs(ptResolve(cr, props.pt, "CrChoice"), "root")} data-part="root" class={ptClass(ptResolve(cr, props.pt, "CrChoice"), props.unstyled, "cr-check", "root")} style={ptStyle(ptResolve(cr, props.pt, "CrChoice"), props.dt, "root")}>
      <input
        {...ptAttrs(ptResolve(cr, props.pt, "CrChoice"), "input")}
        data-part="input"
        data-state={props.checked ? "checked" : "unchecked"}
        type={props.type || "checkbox"}
        name={props.name}
        checked={props.checked}
        disabled={props.disabled}
        aria-invalid={props.invalid ? "true" : "false"}
        onChange={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrChoice'), 'input', 'onChange', event); props.onChange && props.onChange(event.target.checked); }}
      />
      <span {...ptAttrs(ptResolve(cr, props.pt, "CrChoice"), "label")} data-part="label">{props.label}</span>
    </label>
  );
}
