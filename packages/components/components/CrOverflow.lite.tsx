import { Show, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptAttrs, ptClass, ptHandler, ptResolve, ptStyle, resolveMessage, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrOverflowProps {
  /** How many items are hidden. */
  count: number;
  /** Whether the hidden items are currently revealed. */
  expanded?: boolean;
  /** Noun for the accessible name, e.g. "sessions" → "show 3 more sessions". */
  noun: string;
  /** When omitted, the control is inert (a plain "+N" count, not a button). */
  onToggle?: () => void;
  /** Override this component's built-in English strings. See lib/messages.ts. */
  labels?: Record<string, any>;
  /* ── styling contract (portable pt/dt subset). Single part: "root". */
  unstyled?: boolean;
  pt?: CrPassThrough<"root">;
  dt?: CrDesignTokens;
}

/* An a11y-correct "+N more" disclosure for truncated lists. With onToggle it's a
 * <button aria-expanded> that reveals/hides the overflow; without it, an inert
 * count. The accessible name always includes the noun (screen readers never hear
 * a bare "+3"). Styling: .cr-overflow; data-part="root". */
export default function CrOverflow(props: CrOverflowProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrOverflow"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrOverflow"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrOverflow"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  return (
    <Show
      when={props.onToggle}
      else={
        <span
          {...ptAttrs(ptResolve(cr, props.pt, "CrOverflow"), "root")}
          data-part="root"
          class={ptClass(ptResolve(cr, props.pt, "CrOverflow"), props.unstyled, "cr-overflow cr-overflow--static", "root")}
          style={ptStyle(ptResolve(cr, props.pt, "CrOverflow"), props.dt, "root")}
        >
          {"+" + props.count + " " + props.noun}
        </span>
      }
    >
      <button
        {...ptAttrs(ptResolve(cr, props.pt, "CrOverflow"), "root")}
        type="button"
        data-part="root"
        aria-expanded={props.expanded ? "true" : "false"}
        aria-label={props.expanded
          ? resolveMessage(cr, props.labels, "CrOverflow", "showFewer", { noun: props.noun })
          : resolveMessage(cr, props.labels, "CrOverflow", "showMore", { count: props.count, noun: props.noun })}
        class={ptClass(ptResolve(cr, props.pt, "CrOverflow"), props.unstyled, "cr-overflow", "root")}
        style={ptStyle(ptResolve(cr, props.pt, "CrOverflow"), props.dt, "root")}
        onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrOverflow'), 'root', 'onClick', event); props.onToggle && props.onToggle(); }}
      >
        {props.expanded
          ? resolveMessage(cr, props.labels, "CrOverflow", "less")
          : resolveMessage(cr, props.labels, "CrOverflow", "more", props.count)}
      </button>
    </Show>
  );
}
