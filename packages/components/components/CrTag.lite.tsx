import { useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
/* `signal` is the canonical state vocabulary shared across the system
 * (work·wait·done·err·idle·accent). */
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";
export interface CrTagProps {
  signal?: "work" | "wait" | "done" | "err" | "idle" | "accent";
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root". */
  unstyled?: boolean;
  pt?: CrPassThrough<"root">;
  dt?: CrDesignTokens;
}
export default function CrTag(props: CrTagProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrTag"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrTag"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrTag"));
    if (h && h.onUnmounted) h.onUnmounted();
  });


  return <span {...ptAttrs(ptResolve(cr, props.pt, "CrTag"), "root")} class={ptClass(ptResolve(cr, props.pt, "CrTag"), props.unstyled, "cr-tag cr-tag--" + (props.signal || "done"), "root")} data-part="root" data-state={props.signal || "done"} style={ptStyle(ptResolve(cr, props.pt, "CrTag"), props.dt, "root")}>{props.children}</span>;
}
