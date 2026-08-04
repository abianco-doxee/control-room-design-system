import { useStore, For } from "@builder.io/mitosis";

export interface CrTabsProps {
  tabs: string[];
  /** Initially-active tab index. */
  active?: number;
  onChange?: (index: number) => void;
}

/* Tab strip (role=tablist) with roving-tabindex keyboard nav: ←/→ (and ↑/↓)
 * move between tabs, Home/End jump to ends; only the active tab is in the tab
 * order. Scalar active-index state; styling via .cr-tabs. */
export default function CrTabs(props: CrTabsProps) {
  const state = useStore({
    active: props.active || 0,
    select(i: number) {
      state.active = i;
      if (props.onChange) props.onChange(i);
    },
    onKey(e: any) {
      /* resolve the tablist from the focused tab — event.currentTarget is null
         under Qwik's delegated events, so don't rely on it. */
      const active: any = document.activeElement;
      const list = active ? active.closest('[role="tablist"]') : null;
      if (!list) return;
      const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
      const i = tabs.indexOf(active);
      let next = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = tabs.length - 1;
      if (next >= 0) {
        e.preventDefault();
        state.select(next);
        (tabs[next] as HTMLElement).focus();
      }
    },
  });

  return (
    <div class="cr-tabs" role="tablist" onKeyDown={(event) => state.onKey(event)}>
      <For each={props.tabs}>
        {(tab: string, i: number) => (
          <button
            type="button"
            role="tab"
            class={"cr-tab" + (state.active === i ? " cr-tab--on" : "")}
            aria-selected={state.active === i ? "true" : "false"}
            tabIndex={state.active === i ? 0 : -1}
            onClick={() => state.select(i)}
          >
            {tab}
          </button>
        )}
      </For>
    </div>
  );
}
