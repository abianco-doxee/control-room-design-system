import { useStore, For } from "@builder.io/mitosis";

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
  /* ── styling contract (portable pt/dt subset) ──
   * Parts: "root" (tablist) · "tab" (each tab). Each carries data-part + data-state. */
  /** Drop the `cr-*` classes on this instance (keep behavior + data-part hooks). */
  unstyled?: boolean;
  /** Pass-through per part: `{ tab: { class, "data-testid", onMouseEnter, … } }`.
   *  class is MERGED with the base class; other keys are spread (added, not
   *  overriding the component's own role/aria/handlers). */
  pt?: any;
  /** Per-instance design tokens — a map of CSS custom properties applied to the
   *  root (they cascade to the parts): `{ "--sig-work": "#f0f" }`. */
  dt?: any;
}

/* Tab strip (role=tablist) with roving-tabindex keyboard nav: ←/→ (and ↑/↓)
 * move between tabs, Home/End jump to ends; only the active tab is in the tab
 * order. Pass `id` to wire the WAI-ARIA tab↔panel association (see the prop doc).
 * Styling: `.cr-tabs` by default; `unstyled` drops it, `pt`/`dt` retarget it —
 * every part exposes data-part + data-state so you can style from attributes. */
export default function CrTabs(props: CrTabsProps) {
  const state = useStore({
    active: props.active || 0,
    /** base class gated by `unstyled`, with the part's pt class merged in. */
    cls(base: string, part: string): string {
      const p = props.pt && props.pt[part];
      const extra = p && p.class ? " " + p.class : "";
      return ((props.unstyled ? "" : base) + extra).trim();
    },
    /** the part's pt bag, minus class/style (spread as extra attrs/handlers). */
    pta(part: string): any {
      const p = props.pt && props.pt[part];
      if (!p) return {};
      const out: any = { ...p };
      delete out.class;
      delete out.style;
      return out;
    },
    /** part style: dt custom-properties on root, plus any pt style for the part. */
    partStyle(part: string): any {
      const p = props.pt && props.pt[part];
      const base = part === "root" ? props.dt || {} : {};
      return { ...base, ...(p && p.style ? p.style : {}) };
    },
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
      {...state.pta("root")}
      class={state.cls("cr-tabs", "root")}
      role="tablist"
      data-part="root"
      style={state.partStyle("root")}
      onKeyDown={(event) => state.onKey(event)}
    >
      <For each={props.tabs}>
        {(tab: string, i: number) => (
          <button
            {...state.pta("tab")}
            type="button"
            role="tab"
            data-part="tab"
            data-state={state.active === i ? "active" : "inactive"}
            id={props.id ? props.id + "-tab-" + i : undefined}
            aria-controls={props.id ? props.id + "-panel-" + i : undefined}
            class={state.cls("cr-tab" + (state.active === i ? " cr-tab--on" : ""), "tab")}
            aria-selected={state.active === i ? "true" : "false"}
            tabIndex={state.active === i ? 0 : -1}
            style={state.partStyle("tab")}
            onClick={() => state.select(i)}
          >
            {tab}
          </button>
        )}
      </For>
    </div>
  );
}
