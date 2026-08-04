import { useStore, onMount, Show, For } from "@builder.io/mitosis";

export interface CrAccordionItem {
  title: string;
  body: string;
}

export interface CrAccordionProps {
  items: CrAccordionItem[];
  /** Only one panel open at a time. */
  single?: boolean;
  /** Indexes open on first render. */
  defaultOpen?: number[];
}

/* Collapsible sections. Each header is a button (aria-expanded + aria-controls);
 * panels are regions revealed on toggle. `single` makes it exclusive. ↑/↓/Home/End
 * move between headers (Enter/Space toggle natively). Styling via .cr-accordion. */
export default function CrAccordion(props: CrAccordionProps) {
  const state = useStore({
    open: {} as Record<number, boolean>,
    toggle(i: number) {
      if (props.single) state.open = state.open[i] ? {} : { [i]: true };
      else state.open = { ...state.open, [i]: !state.open[i] };
    },
    onKey(event: KeyboardEvent) {
      const active: any = document.activeElement;
      const root = active ? active.closest(".cr-accordion") : null;
      if (!root) return;
      const heads = Array.from(root.querySelectorAll(".cr-accordion__header"));
      const i = heads.indexOf(active);
      if (i < 0) return;
      let next = -1;
      if (event.key === "ArrowDown") next = (i + 1) % heads.length;
      else if (event.key === "ArrowUp") next = (i - 1 + heads.length) % heads.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = heads.length - 1;
      if (next >= 0) {
        event.preventDefault();
        (heads[next] as HTMLElement).focus();
      }
    },
  });

  onMount(() => {
    if (props.defaultOpen && props.defaultOpen.length) {
      const seed: Record<number, boolean> = {};
      props.defaultOpen.forEach((i: number) => (seed[i] = true));
      state.open = seed;
    }
  });

  return (
    <div class="cr-accordion" onKeyDown={(event) => state.onKey(event)}>
      <For each={props.items}>
        {(item: CrAccordionItem, i: number) => (
          <div class="cr-accordion__item">
            <button
              type="button"
              class="cr-accordion__header"
              aria-expanded={state.open[i] ? "true" : "false"}
              aria-controls={"cr-acc-panel-" + i}
              id={"cr-acc-head-" + i}
              onClick={() => state.toggle(i)}
            >
              <span>{item.title}</span>
              <span class="cr-accordion__chevron" aria-hidden="true"></span>
            </button>
            <Show when={state.open[i]}>
              <div class="cr-accordion__panel" id={"cr-acc-panel-" + i} role="region" aria-labelledby={"cr-acc-head-" + i}>
                {item.body}
              </div>
            </Show>
          </div>
        )}
      </For>
    </div>
  );
}
