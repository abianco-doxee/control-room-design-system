import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrSessionRowProps {
  name: string;
  status: string;
  signal?: "work" | "wait" | "done" | "err" | "idle";
  event?: boolean;
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "dot" · "name" · "status". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}
export default function CrSessionRow(props: CrSessionRowProps) {
  return (
    <div {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-row" + (props.event ? " cr-row--event" : ""), "root")} data-part="root" style={ptStyle(props.pt, props.dt, "root")}>
      {props.children}
      <span {...ptAttrs(props.pt, "dot")} class={ptClass(props.pt, props.unstyled, "cr-dot", "dot")} data-part="dot" data-state={props.signal || "idle"} role="img" aria-label={props.status} style={{ background: "var(--sig-" + (props.signal || "idle") + ")" }} />
      <span {...ptAttrs(props.pt, "name")} class={ptClass(props.pt, props.unstyled, "cr-row__name", "name")} data-part="name">{props.name}</span>
      <span {...ptAttrs(props.pt, "status")} class={ptClass(props.pt, props.unstyled, "cr-row__status", "status")} data-part="status">{props.status}</span>
    </div>
  );
}
