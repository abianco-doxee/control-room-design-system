import { Show } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";
export interface CrHeroProps { big: string; sub?: string; state?: "accent" | "wait" | "err" | "calm"; children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "big" · "sub". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}
export default function CrHero(props: CrHeroProps) {
  return (
    <div {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-hero" + (props.state && props.state !== "accent" ? " cr-hero--" + props.state : ""), "root")} data-part="root" data-state={props.state || "accent"} style={ptStyle(props.pt, props.dt, "root")}>
      <div>
        <div {...ptAttrs(props.pt, "big")} class={ptClass(props.pt, props.unstyled, "cr-hero__big", "big")} data-part="big">{props.big}</div>
        <Show when={props.sub}><div {...ptAttrs(props.pt, "sub")} class={ptClass(props.pt, props.unstyled, "cr-hero__sub", "sub")} data-part="sub">{props.sub}</div></Show>
      </div>
      {props.children}
    </div>
  );
}
