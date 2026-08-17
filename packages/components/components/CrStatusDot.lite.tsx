import { useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve } from "../lib/pt.ts";
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
    if (props.pt && props.pt.hooks && props.pt.hooks.onMounted) props.pt.hooks.onMounted();
  });
  onUpdate(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onUpdated) props.pt.hooks.onUpdated();
  }, []);
  onUnMount(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onUnmounted) props.pt.hooks.onUnmounted();
  });


  return <span {...ptAttrs(ptResolve(cr, props.pt, "CrStatusDot"), "root")} class={ptClass(ptResolve(cr, props.pt, "CrStatusDot"), props.unstyled, "cr-dot", "root")} data-part="root" role="img" aria-label={props.label} style={{ background: "var(--sig-" + (props.signal || "idle") + ")", ...ptStyle(ptResolve(cr, props.pt, "CrStatusDot"), props.dt, "root") }} />;
}
