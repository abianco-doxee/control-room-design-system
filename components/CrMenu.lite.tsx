import { useStore, Show, For } from "@builder.io/mitosis";

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

/* Dropdown menu. A trigger button toggles a role=menu panel; a transparent
 * full-viewport scrim closes it on outside click (no global listeners, so it
 * behaves identically across targets). Styling via .cr-menu. */
export default function CrMenu(props: CrMenuProps) {
  const state = useStore({
    open: false,
    toggle() {
      state.open = !state.open;
    },
    close() {
      state.open = false;
    },
    pick(i: number) {
      state.open = false;
      if (props.onSelect) props.onSelect(i);
    },
  });

  return (
    <div class="cr-menu">
      <button
        type="button"
        class="cr-btn cr-btn--controls cr-btn--sm"
        aria-haspopup="menu"
        aria-expanded={state.open ? "true" : "false"}
        onClick={() => state.toggle()}
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
