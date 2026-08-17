import { useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrDateTimeProps {
  value?: string;
  /** input type — datetime-local (default), date, or time. */
  kind?: "datetime-local" | "date" | "time";
  label?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root". */
  unstyled?: boolean;
  pt?: CrPassThrough<"root">;
  dt?: CrDesignTokens;
}

/* A styled native date/time input — the browser owns the picker, keyboard, and
 * locale. Styling via .cr-datetime. */
export default function CrDateTime(props: CrDateTimeProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrDateTime"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrDateTime"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrDateTime"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  return (
    <input
      {...ptAttrs(ptResolve(cr, props.pt, "CrDateTime"), "root")}
      type={props.kind || "datetime-local"}
      class={ptClass(ptResolve(cr, props.pt, "CrDateTime"), props.unstyled, "cr-datetime", "root")}
      data-part="root"
      style={ptStyle(ptResolve(cr, props.pt, "CrDateTime"), props.dt, "root")}
      value={props.value}
      min={props.min}
      max={props.max}
      disabled={props.disabled}
      aria-label={props.label || "date and time"}
      onInput={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrDateTime'), 'root', 'onInput', event); props.onChange && props.onChange((event.target as HTMLInputElement).value); }}
    />
  );
}
