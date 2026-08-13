import { useStore, useRef, Show, For } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";
import { placeEl } from "../lib/position.ts";

export interface CrMenuItem {
  label: string;
  /** Render in the error hue (destructive action). */
  danger?: boolean;
}

export interface CrMenuProps {
  label: string;
  items: CrMenuItem[];
  /** Preferred placement, `${side}` or `${side}-${align}` — e.g. "bottom-start"
   *  (default), "top-end", "right". Sides: top · bottom · left · right;
   *  aligns: start · end. Flips to the opposite side and shifts along the cross
   *  axis as needed to stay within the viewport. */
  placement?: string;
  /** Fires with the selected item index. */
  onSelect?: (index: number) => void;
  /* ── styling contract (portable pt/dt subset) ──
   * Parts: "root" · "trigger" · "panel" · "item". Each carries data-part. */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* Dropdown menu with full keyboard support: the trigger opens on click or ↓;
 * once open, ↑/↓ move between items, Home/End jump, Esc closes and returns focus
 * to the trigger. A transparent full-viewport scrim closes it on outside click
 * (no global listeners — identical across targets). Styling via .cr-menu. */
export default function CrMenu(props: CrMenuProps) {
  const rootRef = useRef(null);

  const state = useStore({
    open: false,
    /* typeahead buffer: printable keys accumulate for a short window, then reset */
    buffer: "",
    bufferAt: 0,
    toggle() {
      /* compute the next value once — reading state.open right after setting it is
       * a stale read once compiled to React (setState is async). */
      const next = !state.open;
      state.open = next;
      if (next) state.focusFirst(0);
    },
    close() {
      state.open = false;
    },
    focusTrigger() {
      const root: any = rootRef;
      if (root) {
        const t = root.querySelector('[aria-haspopup="menu"]');
        if (t) t.focus();
      }
    },
    focusFirst(tries: number) {
      /* the panel renders a tick after open flips; retry briefly until it exists */
      const root: any = rootRef;
      const panel = root ? root.querySelector(".cr-menu__panel") : null;
      const first = panel ? panel.querySelector('[role="menuitem"]') : null;
      if (panel && first) {
        panel.style.visibility = "hidden";
        state.place();
        first.focus();
        return;
      }
      if ((tries || 0) < 6) setTimeout(() => state.focusFirst((tries || 0) + 1), 16);
    },
    /* Whatever hid the panel (focusFirst, above) is matched here: place() ALWAYS
     * ends by revealing it, even when placement itself couldn't run (no window,
     * no trigger). A panel that gets hidden but never shown again is a dead click
     * behind a still-active scrim — worse than showing it unplaced at its CSS
     * position, which is what an early return now does. */
    place() {
      const root: any = rootRef;
      const panel = root ? root.querySelector(".cr-menu__panel") : null;
      if (!panel) return;
      if (root && typeof window !== "undefined") {
        const trigger = root.querySelector('[aria-haspopup="menu"]');
        if (trigger) placeEl(trigger, panel, { placement: props.placement || "bottom-start" });
      }
      panel.style.visibility = "visible";
    },
    pick(i: number) {
      state.open = false;
      state.focusTrigger();
      if (props.onSelect) props.onSelect(i);
    },
    onTriggerKey(e: any) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        state.open = true;
        state.focusFirst(0);
      }
    },
    onPanelKey(e: any) {
      const root: any = rootRef;
      if (!root) return;
      const items = Array.from(root.querySelectorAll('[role="menuitem"]'));
      const i = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        ((items[i + 1] || items[0]) as HTMLElement).focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        ((items[i - 1] || items[items.length - 1]) as HTMLElement).focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        (items[0] as HTMLElement).focus();
      } else if (e.key === "End") {
        e.preventDefault();
        (items[items.length - 1] as HTMLElement).focus();
      } else if (e.key === "Escape") {
        e.preventDefault();
        state.open = false;
        state.focusTrigger();
      } else if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        /* typeahead: focus the next item whose label starts with what was typed.
           Keys within ~600ms accumulate ("de" → "Delete"); a repeated single key
           cycles matches. */
        const now = Date.now();
        state.buffer = (now - state.bufferAt < 600 ? state.buffer : "") + e.key.toLowerCase();
        state.bufferAt = now;
        const labels = props.items.map((it: CrMenuItem) => (it.label || "").toLowerCase());
        for (let k = 1; k <= items.length; k++) {
          const idx = (i + k) % items.length; // start after the focused item (i = -1 → from 0)
          if (labels[idx].indexOf(state.buffer) === 0) {
            (items[idx] as HTMLElement).focus();
            break;
          }
        }
      }
    },
  });

  return (
    <div {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-menu", "root")} data-part="root" data-state={state.open ? "open" : "closed"} style={ptStyle(props.pt, props.dt, "root")} ref={rootRef}>
      <button
        {...ptAttrs(props.pt, "trigger")}
        type="button"
        data-part="trigger"
        class={ptClass(props.pt, props.unstyled, "cr-btn cr-btn--outline cr-btn--sm", "trigger")}
        aria-haspopup="menu"
        aria-expanded={state.open ? "true" : "false"}
        onClick={() => state.toggle()}
        onKeyDown={(event) => state.onTriggerKey(event)}
      >
        {props.label}
      </button>
      <Show when={state.open}>
        <button
          type="button"
          class="cr-menu__scrim"
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => state.close()}
        ></button>
        <div
          {...ptAttrs(props.pt, "panel")}
          data-part="panel"
          class={ptClass(props.pt, props.unstyled, "cr-menu__panel", "panel")}
          role="menu"
          /* Hidden at mount so it can never paint at its unplaced CSS position —
           * place() (via focusFirst) reveals it once placeEl() has run. Not
           * ptStyle-backed: this part carries no pt/dt style hook (see
           * styling-contract.md). */
          style={{ visibility: "hidden" }}
          onKeyDown={(event) => state.onPanelKey(event)}
        >
          <For each={props.items}>
            {(item: CrMenuItem, i: number) => (
              <button
                {...ptAttrs(props.pt, "item")}
                type="button"
                role="menuitem"
                data-part="item"
                class={ptClass(props.pt, props.unstyled, "cr-menu__item" + (item.danger ? " cr-menu__item--danger" : ""), "item")}
                onClick={() => state.pick(i)}
              >
                {item.label}
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
