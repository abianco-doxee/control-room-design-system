import { useStore, For, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptHandler, ptResolve, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrTabsProps {
  tabs: string[];
  /** Initially-active tab index. */
  active?: number;
  /** Base id for tab↔panel wiring. When set, each tab gets `id="{id}-tab-{i}"`
   *  and `aria-controls="{id}-panel-{i}"`; render each panel as the matching
   *  `<div role="tabpanel" id="{id}-panel-{i}" aria-labelledby="{id}-tab-{i}"
   *  tabindex="0" hidden={i !== active}>` so screen readers get the relationship
   *  and the panel is reachable by keyboard. Omit it for a decorative strip. */
  id?: string;
  onChange?: (index: number) => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" (tablist) · "tab" (each tab). Each carries data-part + data-state. */
  /** Drop the `cr-*` classes on this instance (keep behavior + data-part hooks). */
  unstyled?: boolean;
  /** Pass-through per part: `{ tab: { class, "data-testid", onMouseEnter, … } }`. */
  pt?: CrPassThrough<"root" | "tab">;
  /** Per-instance design tokens applied to the root, e.g.
   *  `{ "--cr-tabs-indicator": "var(--sig-accent)" }`. */
  dt?: CrDesignTokens;
}

/* Tab strip (role=tablist) with roving-tabindex keyboard nav: ←/→ (and ↑/↓)
 * move between tabs, Home/End jump to ends; only the active tab is in the tab
 * order. Pass `id` to wire the WAI-ARIA tab↔panel association (see the prop doc).
 * Styling: `.cr-tabs` by default; `unstyled` drops it, `pt`/`dt` retarget it —
 * every part exposes data-part + data-state. Styling helpers come from lib/pt. */
export default function CrTabs(props: CrTabsProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrTabs"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrTabs"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrTabs"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  const state = useStore({
    /* NOT named `active`: Svelte compiles a store field and the same-named PROP
     * into one scope (`export let active` + `let active = active || 0`), which is
     * a duplicate declaration and kills the whole component. Store fields must not
     * shadow prop names. */
    current: props.active || 0,
    select(i: number) {
      state.current = i;
      if (props.onChange) props.onChange(i);
    },
    /* Handler chaining for the "tab" part. The component's own handler stays in
     * JSX — that is what makes every target bind it natively (Svelte 4 turns a
     * spread `onClick` into a plain ATTRIBUTE with no listener, so moving it into
     * ptAttrs would silently kill tab selection there). The consumer's pt handler
     * is invoked from inside ours, consumer-first, so BOTH run on all six targets
     * from one source. See ptHandler() in lib/pt.ts. */
    onTabClick(event: any, i: number) {
      ptHandler(ptResolve(cr, props.pt, "CrTabs"), "tab", "onClick", event);
      state.select(i);
    },
    onKey(e: any) {
      /* NOT named `active`: this component already has an `active` prop, and
       * Svelte hoists both the prop and this local into one scope — the compiled
       * SFC then dies with "Identifier 'active' has already been declared" and the
       * whole component fails to render. Keep locals distinct from prop names. */
      const focused: any = document.activeElement;
      const list = focused ? focused.closest('[role="tablist"]') : null;
      if (!list) return;
      const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
      const i = tabs.indexOf(focused);
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
    <div
      {...ptAttrs(ptResolve(cr, props.pt, "CrTabs"), "root")}
      class={ptClass(ptResolve(cr, props.pt, "CrTabs"), props.unstyled, "cr-tabs", "root")}
      role="tablist"
      data-part="root"
      style={ptStyle(ptResolve(cr, props.pt, "CrTabs"), props.dt, "root")}
      onKeyDown={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrTabs'), 'root', 'onKeyDown', event); state.onKey(event); }}
    >
      <For each={props.tabs}>
        {(tab: string, i: number) => (
          <button
            {...ptAttrs(ptResolve(cr, props.pt, "CrTabs"), "tab")}
            type="button"
            role="tab"
            data-part="tab"
            data-state={state.current === i ? "active" : "inactive"}
            id={props.id ? props.id + "-tab-" + i : undefined}
            aria-controls={props.id ? props.id + "-panel-" + i : undefined}
            class={ptClass(ptResolve(cr, props.pt, "CrTabs"), props.unstyled, "cr-tab" + (state.current === i ? " cr-tab--on" : ""), "tab")}
            aria-selected={state.current === i ? "true" : "false"}
            tabIndex={state.current === i ? 0 : -1}
            style={ptStyle(ptResolve(cr, props.pt, "CrTabs"), props.dt, "tab")}
            onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrTabs'), 'tab', 'onClick', event); state.onTabClick(event, i); }}
          >
            {tab}
          </button>
        )}
      </For>
    </div>
  );
}
