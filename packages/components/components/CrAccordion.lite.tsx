import { useStore, onMount, Show, For, useContext, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

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
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "item" · "header" · "chevron" · "panel". */
  unstyled?: boolean;
  pt?: CrPassThrough<"chevron" | "header" | "item" | "panel" | "root">;
  dt?: CrDesignTokens;
}

/* Collapsible sections. Each header is a button (aria-expanded + aria-controls);
 * panels are regions revealed on toggle. `single` makes it exclusive. ↑/↓/Home/End
 * move between headers (Enter/Space toggle natively). Styling via .cr-accordion. */
export default function CrAccordion(props: CrAccordionProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrAccordion"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrAccordion"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrAccordion"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  const state = useStore({
    open: {} as Record<number, boolean>,
    toggle(i: number) {
      if (props.single) state.open = state.open[i] ? {} : { [i]: true };
      else state.open = { ...state.open, [i]: !state.open[i] };
    },
    onKey(event: any) {
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
    <div {...ptAttrs(ptResolve(cr, props.pt, "CrAccordion"), "root")} data-part="root" class={ptClass(ptResolve(cr, props.pt, "CrAccordion"), props.unstyled, "cr-accordion", "root")} style={ptStyle(ptResolve(cr, props.pt, "CrAccordion"), props.dt, "root")} onKeyDown={(event) => state.onKey(event)}>
      <For each={props.items}>
        {(item: CrAccordionItem, i: number) => (
          <div {...ptAttrs(ptResolve(cr, props.pt, "CrAccordion"), "item")} data-part="item" class={ptClass(ptResolve(cr, props.pt, "CrAccordion"), props.unstyled, "cr-accordion__item", "item")}>
            <button
              {...ptAttrs(ptResolve(cr, props.pt, "CrAccordion"), "header")}
              type="button"
              data-part="header"
              data-state={state.open[i] ? "expanded" : "collapsed"}
              class={ptClass(ptResolve(cr, props.pt, "CrAccordion"), props.unstyled, "cr-accordion__header", "header")}
              aria-expanded={state.open[i] ? "true" : "false"}
              aria-controls={"cr-acc-panel-" + i}
              id={"cr-acc-head-" + i}
              onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrAccordion'), 'header', 'onClick', event); state.toggle(i); }}
            >
              <span>{item.title}</span>
              <span {...ptAttrs(ptResolve(cr, props.pt, "CrAccordion"), "chevron")} data-part="chevron" class={ptClass(ptResolve(cr, props.pt, "CrAccordion"), props.unstyled, "cr-accordion__chevron", "chevron")} aria-hidden="true"></span>
            </button>
            <Show when={state.open[i]}>
              <div {...ptAttrs(ptResolve(cr, props.pt, "CrAccordion"), "panel")} data-part="panel" class={ptClass(ptResolve(cr, props.pt, "CrAccordion"), props.unstyled, "cr-accordion__panel", "panel")} id={"cr-acc-panel-" + i} role="region" aria-labelledby={"cr-acc-head-" + i}>
                {item.body}
              </div>
            </Show>
          </div>
        )}
      </For>
    </div>
  );
}
