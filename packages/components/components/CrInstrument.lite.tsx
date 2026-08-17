import { useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";
export interface CrInstrumentProps {
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root". */
  unstyled?: boolean;
  pt?: CrPassThrough<"root">;
  dt?: CrDesignTokens;
}
/** The dashboard chassis. Place <CrNav/> and a <div class="cr-instrument__board"> inside. */
export default function CrInstrument(props: CrInstrumentProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrInstrument"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrInstrument"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrInstrument"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  return <div {...ptAttrs(ptResolve(cr, props.pt, "CrInstrument"), "root")} class={ptClass(ptResolve(cr, props.pt, "CrInstrument"), props.unstyled, "cr-instrument", "root")} data-part="root" style={ptStyle(ptResolve(cr, props.pt, "CrInstrument"), props.dt, "root")}>{props.children}</div>;
}
