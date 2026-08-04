import { useStore, useRef, Show } from "@builder.io/mitosis";

export interface CrPopoverProps {
  /** Trigger button text. */
  label: string;
  /** Accessible name for the panel. */
  title?: string;
  align?: "left" | "right";
  children?: any;
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
      state.open = !state.open;
      if (state.open) state.focusPanel(0);
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
        panel.focus();
        return;
      }
      if ((tries || 0) < 6) setTimeout(() => state.focusPanel((tries || 0) + 1), 16);
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
    <div class="cr-popover" ref={rootRef}>
      <button
        type="button"
        class="cr-btn cr-btn--controls cr-btn--sm"
        aria-haspopup="dialog"
        aria-expanded={state.open ? "true" : "false"}
        onClick={() => state.toggle()}
      >
        {props.label}
      </button>
      <Show when={state.open}>
        <button type="button" class="cr-popover__scrim" aria-hidden="true" tabIndex={-1} onClick={() => state.close()}></button>
        <div
          class={"cr-popover__panel" + (props.align === "right" ? " cr-popover__panel--right" : "")}
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
