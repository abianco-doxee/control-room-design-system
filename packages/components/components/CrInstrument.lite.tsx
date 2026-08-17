import { useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve } from "../lib/pt.ts";
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
    if (props.pt && props.pt.hooks && props.pt.hooks.onMounted) props.pt.hooks.onMounted();
  });
  onUpdate(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onUpdated) props.pt.hooks.onUpdated();
  }, []);
  onUnMount(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onUnmounted) props.pt.hooks.onUnmounted();
  });

  return <div {...ptAttrs(ptResolve(cr, props.pt, "CrInstrument"), "root")} class={ptClass(ptResolve(cr, props.pt, "CrInstrument"), props.unstyled, "cr-instrument", "root")} data-part="root" style={ptStyle(ptResolve(cr, props.pt, "CrInstrument"), props.dt, "root")}>{props.children}</div>;
}
