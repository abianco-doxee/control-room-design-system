import { Show, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

/** Control Room error surface — the one place besides the masthead where Law 3's
 *  house glitch is allowed. The surface floods with `--sig-err` (Law 2 makes hue
 *  the state channel, so an error region reads as error because the region *is*
 *  the colour) and carries the vertical `--drip` glitch, which is what marks the
 *  state as *degraded* rather than merely coloured.
 *
 *  The drip is a `::before` overlay, so the title and sub sit in their own
 *  stacking context to stay above it.
 *
 *  Styling: @alebianco/cr-styles (components.css) (.cr-drip); `unstyled` drops the
 *  classes, `pt`/`dt` retarget it, every part exposes data-part. */
export interface CrDripProps {
  title: string;
  /** The operational line — endpoint, retry count — that makes an error
   *  actionable. Stays in the mono data register per Law 5. */
  sub?: string;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "title" · "sub". */
  unstyled?: boolean;
  pt?: CrPassThrough<"root" | "sub" | "title">;
  dt?: CrDesignTokens;
}
export default function CrDrip(props: CrDripProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrDrip"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrDrip"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrDrip"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  return (
    <div {...ptAttrs(ptResolve(cr, props.pt, "CrDrip"), "root")} class={ptClass(ptResolve(cr, props.pt, "CrDrip"), props.unstyled, "cr-drip", "root")} data-part="root" style={ptStyle(ptResolve(cr, props.pt, "CrDrip"), props.dt, "root")}>
      <div {...ptAttrs(ptResolve(cr, props.pt, "CrDrip"), "title")} class={ptClass(ptResolve(cr, props.pt, "CrDrip"), props.unstyled, "cr-drip__title", "title")} data-part="title">{props.title}</div>
      <Show when={props.sub}><div {...ptAttrs(ptResolve(cr, props.pt, "CrDrip"), "sub")} class={ptClass(ptResolve(cr, props.pt, "CrDrip"), props.unstyled, "cr-drip__sub", "sub")} data-part="sub">{props.sub}</div></Show>
    </div>
  );
}
