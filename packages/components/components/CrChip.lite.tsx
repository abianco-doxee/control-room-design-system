import { useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrChipProps {
  /** Signal the chip carries (Law 2). Defaults to done. */
  signal?: "work" | "wait" | "done" | "err" | "idle" | "accent";
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root". */
  unstyled?: boolean;
  pt?: CrPassThrough<"root">;
  dt?: CrDesignTokens;
}
export default function CrChip(props: CrChipProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrChip"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrChip"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrChip"));
    if (h && h.onUnmounted) h.onUnmounted();
  });


  return <span {...ptAttrs(ptResolve(cr, props.pt, "CrChip"), "root")} class={ptClass(ptResolve(cr, props.pt, "CrChip"), props.unstyled, "cr-chip" + (props.signal && props.signal !== "done" ? " cr-chip--" + props.signal : ""), "root")} data-part="root" data-state={props.signal || "done"} style={ptStyle(ptResolve(cr, props.pt, "CrChip"), props.dt, "root")}>{props.children}</span>;
}
