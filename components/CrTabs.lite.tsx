import { useStore, For } from "@builder.io/mitosis";

export interface CrTabsProps {
  tabs: string[];
  /** Initially-active tab index. */
  active?: number;
  onChange?: (index: number) => void;
}

/* Tab strip (role=tablist). Scalar active-index state; styling via .cr-tabs. */
export default function CrTabs(props: CrTabsProps) {
  const state = useStore({
    active: props.active || 0,
    select(i: number) {
      state.active = i;
      if (props.onChange) props.onChange(i);
    },
  });

  return (
    <div class="cr-tabs" role="tablist">
      <For each={props.tabs}>
        {(tab: string, i: number) => (
          <button
            type="button"
            role="tab"
            class={"cr-tab" + (state.active === i ? " cr-tab--on" : "")}
            aria-selected={state.active === i ? "true" : "false"}
            onClick={() => state.select(i)}
          >
            {tab}
          </button>
        )}
      </For>
    </div>
  );
}
