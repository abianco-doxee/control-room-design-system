import { useStore, useRef, Show } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrPopoverProps {
  /** Trigger button text. */
  label: string;
  /** Accessible name for the panel. */
  title?: string;
  align?: "left" | "right";
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
        state.place();
        panel.focus();
        return;
      }
      if ((tries || 0) < 6) setTimeout(() => state.focusPanel((tries || 0) + 1), 16);
    },
    /* Collision-aware placement: anchor the panel to the trigger, flip above when
     * there's no room below, and shift horizontally to stay in the viewport (so the
     * panel never clips off-screen). Same algorithm as @control-room/utils/position (exported
     * for consumers); inlined here so the component carries no cross-target import.
     * Static on open — for scroll-pinned placement use autoPlace() from ./position. */
    place() {
      const root: any = rootRef;
      if (!root || typeof window === "undefined") return;
      const trigger = root.querySelector("[aria-haspopup]");
      const panel = root.querySelector(".cr-popover__panel");
      if (!trigger || !panel) return;
      const a = trigger.getBoundingClientRect();
      const f = panel.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const offset = 6;
      const pad = 8;
      const below = vh - (a.top + a.height);
      const onTop = below < f.height + offset && a.top > below;
      const y = onTop ? a.top - f.height - offset : a.top + a.height + offset;
      let x = props.align === "right" ? a.left + a.width - f.width : a.left;
      x = Math.max(pad, Math.min(x, vw - f.width - pad));
      panel.style.position = "fixed";
      panel.style.margin = "0";
      panel.style.left = x + "px";
      panel.style.top = y + "px";
      panel.setAttribute("data-placement", (onTop ? "top" : "bottom") + (props.align === "right" ? "-end" : "-start"));
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
          class={ptClass(props.pt, props.unstyled, "cr-popover__panel" + (props.align === "right" ? " cr-popover__panel--right" : ""), "panel")}
          data-part="panel"
          data-state={state.open ? "open" : "closed"}
          role="dialog"
          aria-label={props.title || props.label}
          tabIndex={-1}
          onKeyDown={(event) => state.onKey(event)}
        >
          {props.children}
        </div>
      </Show>
    </div>
  );
}
