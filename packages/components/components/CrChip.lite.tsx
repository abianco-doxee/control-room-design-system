import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrChipProps {
  /** Signal the chip carries (Law 2). Defaults to done. */
  signal?: "work" | "wait" | "done" | "err" | "idle" | "accent";
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}
export default function CrChip(props: CrChipProps) {
  return <span {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-chip" + (props.signal && props.signal !== "done" ? " cr-chip--" + props.signal : ""), "root")} data-part="root" data-state={props.signal || "done"} style={ptStyle(props.pt, props.dt, "root")}>{props.children}</span>;
}
