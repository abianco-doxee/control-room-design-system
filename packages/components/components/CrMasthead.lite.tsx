import { Show, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";
export interface CrMastheadProps {
  /** Short kicker above the title (the editorial "eyebrow") — a section,
   * phase or category label. Rendered only when set. */
  eyebrow?: string;
  title: string; children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "eyebrow" · "title". */
  unstyled?: boolean;
  pt?: CrPassThrough<"eyebrow" | "root" | "title">;
  dt?: CrDesignTokens;
}
export default function CrMasthead(props: CrMastheadProps) {
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
    <header {...ptAttrs(ptResolve(cr, props.pt, "CrMasthead"), "root")} class={ptClass(ptResolve(cr, props.pt, "CrMasthead"), props.unstyled, "cr-masthead", "root")} data-part="root" style={ptStyle(ptResolve(cr, props.pt, "CrMasthead"), props.dt, "root")}>
      <Show when={props.eyebrow}><p {...ptAttrs(ptResolve(cr, props.pt, "CrMasthead"), "eyebrow")} class={ptClass(ptResolve(cr, props.pt, "CrMasthead"), props.unstyled, "cr-masthead__eyebrow", "eyebrow")} data-part="eyebrow">{props.eyebrow}</p></Show>
      <h1 {...ptAttrs(ptResolve(cr, props.pt, "CrMasthead"), "title")} class={ptClass(ptResolve(cr, props.pt, "CrMasthead"), props.unstyled, "cr-masthead__title", "title")} data-part="title">{props.title}</h1>
      {props.children}
    </header>
  );
}
