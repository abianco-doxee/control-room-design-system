import { useStore, useRef, Show } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";
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
  pt?: any;
  dt?: any;
}

/* Generic anchored overlay. A trigger toggles a floating panel; a transparent
 * full-viewport scrim closes it on outside click, Esc closes and returns focus to
 * the trigger (no global listeners — identical across targets). For arbitrary
 * content; use CrMenu for a list of actions. Styling via .cr-popover. */
export default function CrPopover(props: CrPopoverProps) {
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
    place() {
      const root: any = rootRef;
      if (!root || typeof window === "undefined") return;
      const trigger = root.querySelector("[aria-haspopup]");
      const panel = root.querySelector(".cr-popover__panel");
      if (!trigger || !panel) return;
      placeEl(trigger, panel, { placement: props.placement || "bottom-start" });
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
    <div {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-popover", "root")} data-part="root" style={ptStyle(props.pt, props.dt, "root")} ref={rootRef}>
      <button
        {...ptAttrs(props.pt, "trigger")}
        type="button"
        class={ptClass(props.pt, props.unstyled, "cr-btn cr-btn--outline cr-btn--sm", "trigger")}
        data-part="trigger"
        data-state={state.open ? "open" : "closed"}
        aria-haspopup="dialog"
        aria-expanded={state.open ? "true" : "false"}
        onClick={() => state.toggle()}
      >
        {props.label}
      </button>
      <Show when={state.open}>
        <button {...ptAttrs(props.pt, "scrim")} type="button" class={ptClass(props.pt, props.unstyled, "cr-popover__scrim", "scrim")} data-part="scrim" aria-hidden="true" tabIndex={-1} onClick={() => state.close()}></button>
        <div
          {...ptAttrs(props.pt, "panel")}
          class={ptClass(props.pt, props.unstyled, "cr-popover__panel", "panel")}
          data-part="panel"
          data-state={state.open ? "open" : "closed"}
          role="dialog"
          aria-label={props.title || props.label}
          tabIndex={-1}
          /* Hidden at mount so it can never paint at its unplaced CSS position —
           * place() reveals it once placeEl() has run. Not ptStyle-backed: this
           * part carries no pt/dt style hook (see styling-contract.md). */
          style={{ visibility: "hidden" }}
          onKeyDown={(event) => state.onKey(event)}
        >
          {props.children}
        </div>
      </Show>
    </div>
  );
}
