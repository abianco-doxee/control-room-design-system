import { Show } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";
export interface CrPanelProps { title?: string; weight?: "default" | "major"; inset?: boolean; children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "title". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}
export default function CrPanel(props: CrPanelProps) {
  return (
    <section {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-panel" + (props.weight === "major" ? " cr-panel--major" : "") + (props.inset ? " cr-panel--inset" : ""), "root")} data-part="root" data-state={props.weight || "default"} style={ptStyle(props.pt, props.dt, "root")}>
      <Show when={props.title}><h4 {...ptAttrs(props.pt, "title")} class={ptClass(props.pt, props.unstyled, "cr-panel__title", "title")} data-part="title">{props.title}</h4></Show>
      {props.children}
    </section>
  );
}
