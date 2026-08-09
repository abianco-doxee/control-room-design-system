import { useStore, For } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

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
  pt?: any;
  /** Per-instance design tokens applied to the root, e.g.
   *  `{ "--cr-tabs-indicator": "var(--sig-accent)" }`. */
  dt?: any;
}

/* Tab strip (role=tablist) with roving-tabindex keyboard nav: ←/→ (and ↑/↓)
 * move between tabs, Home/End jump to ends; only the active tab is in the tab
 * order. Pass `id` to wire the WAI-ARIA tab↔panel association (see the prop doc).
 * Styling: `.cr-tabs` by default; `unstyled` drops it, `pt`/`dt` retarget it —
 * every part exposes data-part + data-state. Styling helpers come from lib/pt. */
export default function CrTabs(props: CrTabsProps) {
  const state = useStore({
    active: props.active || 0,
    select(i: number) {
      state.active = i;
      if (props.onChange) props.onChange(i);
    },
    onKey(e: any) {
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
    <div
      {...ptAttrs(props.pt, "root")}
      class={ptClass(props.pt, props.unstyled, "cr-tabs", "root")}
      role="tablist"
      data-part="root"
      style={ptStyle(props.pt, props.dt, "root")}
      onKeyDown={(event) => state.onKey(event)}
    >
      <For each={props.tabs}>
        {(tab: string, i: number) => (
          <button
            {...ptAttrs(props.pt, "tab")}
            type="button"
            role="tab"
            data-part="tab"
            data-state={state.active === i ? "active" : "inactive"}
            id={props.id ? props.id + "-tab-" + i : undefined}
            aria-controls={props.id ? props.id + "-panel-" + i : undefined}
            class={ptClass(props.pt, props.unstyled, "cr-tab" + (state.active === i ? " cr-tab--on" : ""), "tab")}
            aria-selected={state.active === i ? "true" : "false"}
            tabIndex={state.active === i ? 0 : -1}
            style={ptStyle(props.pt, props.dt, "tab")}
            onClick={() => state.select(i)}
          >
            {tab}
          </button>
        )}
      </For>
    </div>
  );
}
