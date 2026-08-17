import { Show, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";
export interface CrEmptyStateProps { message: string; children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "message". */
  unstyled?: boolean;
  pt?: CrPassThrough<"message" | "root">;
  dt?: CrDesignTokens;
}
/** Calm zero-data fallback (distinct from an error surface — see CrDrip). */
export default function CrEmptyState(props: CrEmptyStateProps) {
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
    <div {...ptAttrs(ptResolve(cr, props.pt, "CrEmptyState"), "root")} class={ptClass(ptResolve(cr, props.pt, "CrEmptyState"), props.unstyled, "cr-panel cr-panel--inset cr-empty", "root")} data-part="root" style={{ textAlign: "center", ...ptStyle(ptResolve(cr, props.pt, "CrEmptyState"), props.dt, "root") }}>
      <p {...ptAttrs(ptResolve(cr, props.pt, "CrEmptyState"), "message")} data-part="message" class={ptClass(ptResolve(cr, props.pt, "CrEmptyState"), props.unstyled, "cr-empty__message", "message")}>{props.message}</p>
      <Show when={props.children}>{props.children}</Show>
    </div>
  );
}
