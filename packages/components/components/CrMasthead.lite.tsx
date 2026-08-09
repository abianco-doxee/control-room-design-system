import { Show } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";
export interface CrMastheadProps { eyebrow?: string; title: string; children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "eyebrow" · "title". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}
export default function CrMasthead(props: CrMastheadProps) {
  return (
    <header {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-masthead", "root")} data-part="root" style={ptStyle(props.pt, props.dt, "root")}>
      <Show when={props.eyebrow}><p {...ptAttrs(props.pt, "eyebrow")} class={ptClass(props.pt, props.unstyled, "cr-masthead__eyebrow", "eyebrow")} data-part="eyebrow">{props.eyebrow}</p></Show>
      <h1 {...ptAttrs(props.pt, "title")} class={ptClass(props.pt, props.unstyled, "cr-masthead__title", "title")} data-part="title">{props.title}</h1>
      {props.children}
    </header>
  );
}
