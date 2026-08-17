import { useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrSessionRowProps {
  name: string;
  status: string;
  signal?: "work" | "wait" | "done" | "err" | "idle";
  event?: boolean;
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "dot" · "name" · "status". */
  unstyled?: boolean;
  pt?: CrPassThrough<"dot" | "name" | "root" | "status">;
  dt?: CrDesignTokens;
}
export default function CrSessionRow(props: CrSessionRowProps) {
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

  return (
    <div {...ptAttrs(ptResolve(cr, props.pt, "CrSessionRow"), "root")} class={ptClass(ptResolve(cr, props.pt, "CrSessionRow"), props.unstyled, "cr-row" + (props.event ? " cr-row--event" : ""), "root")} data-part="root" style={ptStyle(ptResolve(cr, props.pt, "CrSessionRow"), props.dt, "root")}>
      {props.children}
      <span {...ptAttrs(ptResolve(cr, props.pt, "CrSessionRow"), "dot")} class={ptClass(ptResolve(cr, props.pt, "CrSessionRow"), props.unstyled, "cr-dot", "dot")} data-part="dot" data-state={props.signal || "idle"} role="img" aria-label={props.status} style={{ background: "var(--sig-" + (props.signal || "idle") + ")" }} />
      <span {...ptAttrs(ptResolve(cr, props.pt, "CrSessionRow"), "name")} class={ptClass(ptResolve(cr, props.pt, "CrSessionRow"), props.unstyled, "cr-row__name", "name")} data-part="name">{props.name}</span>
      <span {...ptAttrs(ptResolve(cr, props.pt, "CrSessionRow"), "status")} class={ptClass(ptResolve(cr, props.pt, "CrSessionRow"), props.unstyled, "cr-row__status", "status")} data-part="status">{props.status}</span>
    </div>
  );
}
