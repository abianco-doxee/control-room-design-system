import { useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrSwitchProps {
  checked?: boolean;
  label?: string;
  disabled?: boolean;
  /** Marks the control invalid for assistive tech (sets aria-invalid). Visual
   *  error styling comes from a wrapping CrField — this is the a11y half only. */
  invalid?: boolean;
  onChange?: (next: boolean) => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "track". */
  unstyled?: boolean;
  pt?: CrPassThrough<"root" | "track">;
  dt?: CrDesignTokens;
}

/** Control Room Switch — button[role=switch]; styling from .cr-switch. */
export default function CrSwitch(props: CrSwitchProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrSwitch"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrSwitch"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrSwitch"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  return (
    <button
      {...ptAttrs(ptResolve(cr, props.pt, "CrSwitch"), "root")}
      data-part="root"
      data-state={props.checked ? "checked" : "unchecked"}
      type="button"
      role="switch"
      aria-checked={props.checked ? "true" : "false"}
      aria-invalid={props.invalid ? "true" : "false"}
      disabled={props.disabled}
      class={ptClass(ptResolve(cr, props.pt, "CrSwitch"), props.unstyled, "cr-switch", "root")}
      style={ptStyle(ptResolve(cr, props.pt, "CrSwitch"), props.dt, "root")}
      onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrSwitch'), 'root', 'onClick', event); props.onChange && props.onChange(!props.checked); }}
    >
      <span {...ptAttrs(ptResolve(cr, props.pt, "CrSwitch"), "track")} data-part="track" class={ptClass(ptResolve(cr, props.pt, "CrSwitch"), props.unstyled, "cr-switch__track", "track")} aria-hidden="true" />
      {props.label}
    </button>
  );
}
