import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";
export interface CrInstrumentProps {
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}
/** The dashboard chassis. Place <CrNav/> and a <div class="cr-instrument__board"> inside. */
export default function CrInstrument(props: CrInstrumentProps) {
  return <div {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-instrument", "root")} data-part="root" style={ptStyle(props.pt, props.dt, "root")}>{props.children}</div>;
}
