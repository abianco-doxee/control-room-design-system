import { useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrStatusDotProps {
  signal?: "work" | "wait" | "done" | "err" | "idle";
  label: string;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root". */
  unstyled?: boolean;
  pt?: CrPassThrough<"root">;
  dt?: CrDesignTokens;
}
export default function CrStatusDot(props: CrStatusDotProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrStatusDot"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrStatusDot"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrStatusDot"));
    if (h && h.onUnmounted) h.onUnmounted();
  });


  return <span {...ptAttrs(ptResolve(cr, props.pt, "CrStatusDot"), "root")} class={ptClass(ptResolve(cr, props.pt, "CrStatusDot"), props.unstyled, "cr-dot", "root")} data-part="root" role="img" aria-label={props.label} style={{ background: "var(--sig-" + (props.signal || "idle") + ")", ...ptStyle(ptResolve(cr, props.pt, "CrStatusDot"), props.dt, "root") }} />;
}
