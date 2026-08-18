import { Show, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";
export interface CrHeroProps { big: string; sub?: string; state?: "accent" | "wait" | "err" | "calm"; children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "big" · "sub". */
  unstyled?: boolean;
  pt?: CrPassThrough<"big" | "root" | "sub">;
  dt?: CrDesignTokens;
}
export default function CrHero(props: CrHeroProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrHero"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrHero"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrHero"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  return (
    <div {...ptAttrs(ptResolve(cr, props.pt, "CrHero"), "root")} class={ptClass(ptResolve(cr, props.pt, "CrHero"), props.unstyled, "cr-hero" + (props.state && props.state !== "accent" ? " cr-hero--" + props.state : ""), "root")} data-part="root" data-state={props.state || "accent"} style={ptStyle(ptResolve(cr, props.pt, "CrHero"), props.dt, "root")}>
      <div>
        <div {...ptAttrs(ptResolve(cr, props.pt, "CrHero"), "big")} class={ptClass(ptResolve(cr, props.pt, "CrHero"), props.unstyled, "cr-hero__big", "big")} data-part="big">{props.big}</div>
        <Show when={props.sub}><div {...ptAttrs(ptResolve(cr, props.pt, "CrHero"), "sub")} class={ptClass(ptResolve(cr, props.pt, "CrHero"), props.unstyled, "cr-hero__sub", "sub")} data-part="sub">{props.sub}</div></Show>
      </div>
      {props.children}
    </div>
  );
}
