import { useStore, useRef, Show, For } from "@builder.io/mitosis";

export interface CrMenuItem {
  label: string;
  /** Render in the error hue (destructive action). */
  danger?: boolean;
}

export interface CrMenuProps {
  label: string;
  items: CrMenuItem[];
  /** Panel edge alignment. */
  align?: "left" | "right";
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
    /* ── styling helpers (see CrTabs for the shared contract) ── */
    cls(base: string, part: string): string {
      const p = props.pt && props.pt[part];
      return ((props.unstyled ? "" : base) + (p && p.class ? " " + p.class : "")).trim();
    },
    pta(part: string): any {
      const p = props.pt && props.pt[part];
      if (!p) return {};
      const out: any = { ...p };
      delete out.class;
      delete out.style;
      return out;
    },
    partStyle(part: string): any {
      const p = props.pt && props.pt[part];
      const base = part === "root" ? props.dt || {} : {};
      return { ...base, ...(p && p.style ? p.style : {}) };
    },
    toggle() {
      state.open = !state.open;
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
      const first = root ? root.querySelector('[role="menuitem"]') : null;
      if (first) {
        first.focus();
        return;
      }
      if ((tries || 0) < 6) setTimeout(() => state.focusFirst((tries || 0) + 1), 16);
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
    <div {...state.pta("root")} class={state.cls("cr-menu", "root")} data-part="root" data-state={state.open ? "open" : "closed"} style={state.partStyle("root")} ref={rootRef}>
      <button
        {...state.pta("trigger")}
        type="button"
        data-part="trigger"
        class={state.cls("cr-btn cr-btn--outline cr-btn--sm", "trigger")}
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
          {...state.pta("panel")}
          data-part="panel"
          class={state.cls("cr-menu__panel" + (props.align === "right" ? " cr-menu__panel--right" : ""), "panel")}
          role="menu"
          onKeyDown={(event) => state.onPanelKey(event)}
        >
          <For each={props.items}>
            {(item: CrMenuItem, i: number) => (
              <button
                {...state.pta("item")}
                type="button"
                role="menuitem"
                data-part="item"
                class={state.cls("cr-menu__item" + (item.danger ? " cr-menu__item--danger" : ""), "item")}
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
