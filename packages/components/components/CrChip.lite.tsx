import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrChipProps {
  tone?: "done" | "alt";
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}
export default function CrChip(props: CrChipProps) {
  return <span {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-chip" + (props.tone === "alt" ? " cr-chip--alt" : ""), "root")} data-part="root" style={ptStyle(props.pt, props.dt, "root")}>{props.children}</span>;
}
