import { useStore, useRef, Show, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";
import { placeEl } from "../lib/position.ts";

export interface CrPopoverProps {
  /** Trigger button text. */
  label: string;
  /** Accessible name for the panel. */
  title?: string;
  /** Preferred placement, `${side}` or `${side}-${align}` — e.g. "bottom-start"
   *  (default), "top-end", "right". Sides: top · bottom · left · right;
   *  aligns: start · end. Flips to the opposite side and shifts along the cross
   *  axis as needed to stay within the viewport. */
  placement?: string;
  children?: any;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "trigger" · "scrim" · "panel". */
  unstyled?: boolean;
  pt?: CrPassThrough<"panel" | "root" | "scrim" | "trigger">;
  dt?: CrDesignTokens;
}

/* Generic anchored overlay. A trigger toggles a floating panel; a transparent
 * full-viewport scrim closes it on outside click, Esc closes and returns focus to
 * the trigger (no global listeners — identical across targets). For arbitrary
 * content; use CrMenu for a list of actions. Styling via .cr-popover. */
export default function CrPopover(props: CrPopoverProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrPopover"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrPopover"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrPopover"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  const rootRef = useRef(null);

  const state = useStore({
    open: false,
    toggle() {
      /* compute the next value once — reading state.open right after setting it is
       * a stale read once compiled to React (setState is async). */
      const next = !state.open;
      state.open = next;
      if (next) state.focusPanel(0);
    },
    close() {
      state.open = false;
    },
    focusTrigger() {
      const root: any = rootRef;
      if (root) {
        const t = root.querySelector("[aria-haspopup]");
        if (t) t.focus();
      }
    },
    focusPanel(tries: number) {
      const root: any = rootRef;
      const panel = root ? root.querySelector(".cr-popover__panel") : null;
      if (panel) {
        panel.style.visibility = "hidden";
        state.place();
        panel.focus();
        return;
      }
      if ((tries || 0) < 6) setTimeout(() => state.focusPanel((tries || 0) + 1), 16);
    },
    /* Whatever hid the panel (focusPanel, above) is matched here: place() ALWAYS
     * ends by revealing it, even when placement itself couldn't run (no window,
     * no trigger). A panel that gets hidden but never shown again is a dead click
     * behind a still-active scrim — worse than the pre-port fallback of showing
     * it unplaced at its CSS position, which is what an early return now does. */
    place() {
      const root: any = rootRef;
      const panel = root ? root.querySelector(".cr-popover__panel") : null;
      if (!panel) return;
      if (root && typeof window !== "undefined") {
        const trigger = root.querySelector("[aria-haspopup]");
        if (trigger) placeEl(trigger, panel, { placement: props.placement || "bottom-start" });
      }
      panel.style.visibility = "visible";
    },
    onKey(event: any) {
      if (event.key === "Escape") {
        event.preventDefault();
        state.open = false;
        state.focusTrigger();
      }
    },
  });

  return (
    <div {...ptAttrs(ptResolve(cr, props.pt, "CrPopover"), "root")} class={ptClass(ptResolve(cr, props.pt, "CrPopover"), props.unstyled, "cr-popover", "root")} data-part="root" style={ptStyle(ptResolve(cr, props.pt, "CrPopover"), props.dt, "root")} ref={rootRef}>
      <button
        {...ptAttrs(ptResolve(cr, props.pt, "CrPopover"), "trigger")}
        type="button"
        class={ptClass(ptResolve(cr, props.pt, "CrPopover"), props.unstyled, "cr-btn cr-btn--outline cr-btn--sm", "trigger")}
        data-part="trigger"
        data-state={state.open ? "open" : "closed"}
        aria-haspopup="dialog"
        aria-expanded={state.open ? "true" : "false"}
        onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrPopover'), 'trigger', 'onClick', event); state.toggle(); }}
      >
        {props.label}
      </button>
      <Show when={state.open}>
        <button {...ptAttrs(ptResolve(cr, props.pt, "CrPopover"), "scrim")} type="button" class={ptClass(ptResolve(cr, props.pt, "CrPopover"), props.unstyled, "cr-popover__scrim", "scrim")} data-part="scrim" aria-hidden="true" tabIndex={-1} onClick={() => state.close()}></button>
        <div
          {...ptAttrs(ptResolve(cr, props.pt, "CrPopover"), "panel")}
          class={ptClass(ptResolve(cr, props.pt, "CrPopover"), props.unstyled, "cr-popover__panel", "panel")}
          data-part="panel"
          data-state={state.open ? "open" : "closed"}
          role="dialog"
          aria-label={props.title || props.label}
          tabIndex={-1}
          /* Hidden at mount so it can never paint at its unplaced CSS position —
           * place() reveals it once placeEl() has run. Not ptStyle-backed: this
           * part carries no pt/dt style hook (see styling-contract.md). */
          style={{ visibility: "hidden" }}
          onKeyDown={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrPopover'), 'panel', 'onKeyDown', event); state.onKey(event); }}
        >
          {props.children}
        </div>
      </Show>
    </div>
  );
}
