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
}

/* Dropdown menu with full keyboard support: the trigger opens on click or ↓;
 * once open, ↑/↓ move between items, Home/End jump, Esc closes and returns focus
 * to the trigger. A transparent full-viewport scrim closes it on outside click
 * (no global listeners — identical across targets). Styling via .cr-menu. */
export default function CrMenu(props: CrMenuProps) {
  const rootRef = useRef(null);

  const state = useStore({
    open: false,
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
      }
    },
  });

  return (
    <div class="cr-menu" ref={rootRef}>
      <button
        type="button"
        class="cr-btn cr-btn--controls cr-btn--sm"
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
          class={"cr-menu__panel" + (props.align === "right" ? " cr-menu__panel--right" : "")}
          role="menu"
          onKeyDown={(event) => state.onPanelKey(event)}
        >
          <For each={props.items}>
            {(item: CrMenuItem, i: number) => (
              <button
                type="button"
                role="menuitem"
                class={"cr-menu__item" + (item.danger ? " cr-menu__item--danger" : "")}
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
