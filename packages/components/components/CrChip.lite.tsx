import { useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve } from "../lib/pt.ts";
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
    if (props.pt && props.pt.hooks && props.pt.hooks.onMounted) props.pt.hooks.onMounted();
  });
  onUpdate(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onUpdated) props.pt.hooks.onUpdated();
  }, []);
  onUnMount(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onUnmounted) props.pt.hooks.onUnmounted();
  });


  return <span {...ptAttrs(ptResolve(cr, props.pt, "CrChip"), "root")} class={ptClass(ptResolve(cr, props.pt, "CrChip"), props.unstyled, "cr-chip" + (props.signal && props.signal !== "done" ? " cr-chip--" + props.signal : ""), "root")} data-part="root" data-state={props.signal || "done"} style={ptStyle(ptResolve(cr, props.pt, "CrChip"), props.dt, "root")}>{props.children}</span>;
}
