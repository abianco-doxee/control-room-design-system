/* `signal` is the canonical state vocabulary shared across the system
 * (work·wait·done·err·idle·accent). */
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";
export interface CrTagProps {
  signal?: "work" | "wait" | "done" | "err" | "idle" | "accent";
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}
export default function CrTag(props: CrTagProps) {
  return <span {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-tag cr-tag--" + (props.signal || "done"), "root")} data-part="root" data-state={props.signal || "done"} style={ptStyle(props.pt, props.dt, "root")}>{props.children}</span>;
}
