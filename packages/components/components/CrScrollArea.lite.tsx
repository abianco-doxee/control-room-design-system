import { useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrScrollAreaProps {
  /** Max size along the scroll axis (e.g. "16rem", "40vh"). */
  maxHeight?: string;
  /** Scroll axis: "y" (default) · "x" · "both". */
  axis?: string;
  /** Accessible name — set it when the region should be keyboard-scrollable and
   *  announced (a focusable scroll container needs a name). */
  label?: string;
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root". */
  unstyled?: boolean;
  pt?: CrPassThrough<"root">;
  dt?: CrDesignTokens;
}

/* ScrollArea — a container with cross-browser styled scrollbars (thin, inked,
 * neon thumb) that keep the Control Room look instead of the OS default. It's
 * keyboard-scrollable: `tabindex=0` so arrow/Page keys work, and when given a
 * `label` it becomes a named `role="group"` so assistive tech announces it. The
 * scrollbar styling is pure CSS (scrollbar-width + ::-webkit-scrollbar); the
 * content scrolls natively. Styling via .cr-scroll. */
export default function CrScrollArea(props: CrScrollAreaProps) {
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
    <div
      {...ptAttrs(ptResolve(cr, props.pt, "CrScrollArea"), "root")}
      class={ptClass(ptResolve(cr, props.pt, "CrScrollArea"), props.unstyled, "cr-scroll" + (props.axis === "x" ? " cr-scroll--x" : props.axis === "both" ? " cr-scroll--both" : ""), "root")}
      data-part="root"
      tabIndex={0}
      role={props.label ? "group" : undefined}
      aria-label={props.label}
      style={{ maxHeight: props.maxHeight, ...ptStyle(ptResolve(cr, props.pt, "CrScrollArea"), props.dt, "root") }}
    >
      {props.children}
    </div>
  );
}
