import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrStatusDotProps {
  signal?: "work" | "wait" | "done" | "err" | "idle";
  label: string;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}
export default function CrStatusDot(props: CrStatusDotProps) {
  return <span {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-dot", "root")} data-part="root" role="img" aria-label={props.label} style={{ background: "var(--sig-" + (props.signal || "idle") + ")" }} />;
}
