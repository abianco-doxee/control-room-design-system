import { useStore, useRef, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";
import { placeEl } from "../lib/position.ts";

export interface CrHoverCardProps {
  /** Trigger text (focusable so keyboard users get the card too). */
  label: string;
  /** Accessible name for the card panel. */
  title?: string;
  /** Preferred placement, `${side}` or `${side}-${align}` — e.g. "bottom-start"
   *  (default), "top-end", "right". Sides: top · bottom · left · right;
   *  aligns: start · end. Flips to the opposite side and shifts along the cross
   *  axis as needed to stay within the viewport. */
  placement?: string;
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "trigger" · "panel". */
  unstyled?: boolean;
  pt?: CrPassThrough<"panel" | "root" | "trigger">;
  dt?: CrDesignTokens;
}

/* A rich hover/focus card — like Tooltip but for structured content. Reveal is
 * CSS-driven (hover + focus-within, with an open delay); the trigger is focusable
 * so keyboard users get it too. Escape latches the card hidden without moving
 * focus (WCAG 1.4.13, dismissable); blur or pointer-leave clears the latch so the
 * next hover/focus shows it again. For a plain text hint use Tooltip; for a list
 * of actions use Menu. Styling via .cr-hovercard. */
export default function CrHoverCard(props: CrHoverCardProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrHoverCard"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrHoverCard"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrHoverCard"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  const rootRef = useRef(null);

  const state = useStore({
    dismissed: false,
    onKey(event: any) {
      if (event.key === "Escape") state.dismissed = true;
    },
    reset() {
      state.dismissed = false;
    },
    /* Reveal here is CSS-driven (:hover/:focus-within on root), so there is no
     * open/close JS state to gate a hide-then-show cycle like popover/menu.
     * Both paths that precede the CSS reveal — pointer entering root, and
     * focus landing anywhere in the subtree (the trigger, or a focusable
     * child inside the panel once :focus-within has already made it
     * reachable) — call this so the panel is positioned before/as CSS flips
     * its opacity/visibility on. onFocus lives on the ROOT, not just the
     * trigger: focus bubbles, so one handler there covers both without a
     * second listener, and it re-places on every focus transition within the
     * card (harmless — placeEl is idempotent) rather than only the first one
     * that opened it. mouseenter/focus dispatch synchronously and this write
     * lands in the same task, before the next style-recalc/paint — that's
     * the same-frame guarantee, not the panel's transition-delay (which
     * disappears under prefers-reduced-motion). Absence of window/trigger/
     * panel just leaves the panel at its CSS fallback position — never
     * blocks the CSS reveal. */
    place() {
      const root: any = rootRef;
      const panel = root ? root.querySelector(".cr-hovercard__panel") : null;
      if (!panel) return;
      if (root && typeof window !== "undefined") {
        const trigger = root.querySelector(".cr-hovercard__trigger");
        if (trigger) placeEl(trigger, panel, { placement: props.placement || "bottom-start" });
      }
    },
  });

  return (
    <span {...ptAttrs(ptResolve(cr, props.pt, "CrHoverCard"), "root")} class={ptClass(ptResolve(cr, props.pt, "CrHoverCard"), props.unstyled, "cr-hovercard", "root")} data-part="root" data-state={state.dismissed ? "dismissed" : undefined} style={ptStyle(ptResolve(cr, props.pt, "CrHoverCard"), props.dt, "root")} data-dismissed={state.dismissed ? "true" : undefined} ref={rootRef} onMouseEnter={() => state.place()} onMouseLeave={() => state.reset()} onFocus={() => state.place()}>
      <span {...ptAttrs(ptResolve(cr, props.pt, "CrHoverCard"), "trigger")} class={ptClass(ptResolve(cr, props.pt, "CrHoverCard"), props.unstyled, "cr-hovercard__trigger", "trigger")} data-part="trigger" tabIndex={0} onKeyDown={(event) => state.onKey(event)} onBlur={() => state.reset()}>
        {props.label}
      </span>
      <span
        {...ptAttrs(ptResolve(cr, props.pt, "CrHoverCard"), "panel")}
        class={ptClass(ptResolve(cr, props.pt, "CrHoverCard"), props.unstyled, "cr-hovercard__panel", "panel")}
        data-part="panel"
        role="group"
        aria-label={props.title || props.label}
      >
        {props.children}
      </span>
    </span>
  );
}
