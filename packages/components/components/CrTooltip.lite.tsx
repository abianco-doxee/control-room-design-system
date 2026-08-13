import { useStore, useRef } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";
import { placeEl } from "../lib/position.ts";

export interface CrTooltipProps {
  /** Unique id wiring the trigger's aria-describedby to the bubble. */
  id: string;
  label?: string;
  /** Preferred placement, `${side}` or `${side}-${align}` — e.g. "top" (default),
   *  "bottom-start", "right". Sides: top · bottom · left · right; aligns:
   *  start · end. Flips to the opposite side and shifts along the cross axis as
   *  needed to stay within the viewport. */
  placement?: string;
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "trigger" · "bubble". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/** A hint bubble revealed on hover/focus. The bubble carries role=tooltip and
 * the trigger points at it via aria-describedby, so it is announced without
 * stealing focus. Reveal is CSS (:hover/:focus-within); the only JS beyond
 * placement is a dismiss latch so Escape hides the bubble without moving focus
 * — WCAG 1.4.13 (Content on Hover or Focus: dismissable). Leaving the trigger
 * (blur) or moving the pointer away clears the latch, so the next hover/focus
 * shows it again.
 * Like CrHoverCard, there is no open/close JS state to gate a hide-then-show
 * cycle — place() is called from the two paths that precede the CSS reveal
 * (pointer entering root, and focus landing anywhere in the subtree; onFocus
 * lives on the ROOT since focus bubbles, covering the trigger with one
 * handler). mouseenter/focus dispatch synchronously and place()'s writes land
 * in the same task, before the next style-recalc/paint — that same-frame
 * guarantee is the ONLY thing preventing a flicker here: unlike
 * .cr-hovercard__panel, .cr-tooltip__bubble has no transition-delay to buy any
 * extra headroom. Absence of window/trigger/bubble just leaves the bubble at
 * its CSS fallback position — never blocks the CSS reveal.
 * See references/components.md#tooltip. */
export default function CrTooltip(props: CrTooltipProps) {
  const rootRef = useRef(null);

  const state = useStore({
    dismissed: false,
    onKey(event: any) {
      if (event.key === "Escape") state.dismissed = true;
    },
    reset() {
      state.dismissed = false;
    },
    place() {
      const root: any = rootRef;
      const bubble = root ? root.querySelector(".cr-tooltip__bubble") : null;
      if (!bubble) return;
      if (root && typeof window !== "undefined") {
        const trigger = root.querySelector(".cr-tooltip__trigger");
        if (trigger) placeEl(trigger, bubble, { placement: props.placement || "top" });
      }
    },
  });

  return (
    <span {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-tooltip", "root")} data-part="root" data-state={state.dismissed ? "dismissed" : undefined} style={ptStyle(props.pt, props.dt, "root")} data-dismissed={state.dismissed ? "true" : undefined} ref={rootRef} onMouseEnter={() => state.place()} onMouseLeave={() => state.reset()} onFocus={() => state.place()}>
      <span
        {...ptAttrs(props.pt, "trigger")}
        class={ptClass(props.pt, props.unstyled, "cr-tooltip__trigger", "trigger")}
        data-part="trigger"
        tabIndex={0}
        aria-describedby={props.id}
        onKeyDown={(event) => state.onKey(event)}
        onBlur={() => state.reset()}
      >
        {props.children}
      </span>
      <span {...ptAttrs(props.pt, "bubble")} class={ptClass(props.pt, props.unstyled, "cr-tooltip__bubble", "bubble")} data-part="bubble" role="tooltip" id={props.id}>
        {props.label}
      </span>
    </span>
  );
}
