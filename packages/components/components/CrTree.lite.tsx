import { useStore, onMount, Show, For, useContext, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle, ptResolve, ptHandler } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrTreeNode {
  id: string;
  label: string;
  children?: CrTreeNode[];
}

export interface CrTreeProps {
  nodes: CrTreeNode[];
  label?: string;
  /** Node ids expanded on first render. */
  defaultExpanded?: string[];
  onSelect?: (id: string) => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "item" · "twist" · "lead". */
  unstyled?: boolean;
  pt?: CrPassThrough<"item" | "lead" | "root" | "twist">;
  dt?: CrDesignTokens;
}

/* Hierarchical tree (role=tree), rendered as a flat list of visible rows (Mitosis
   cannot recurse a component). Each row carries aria-level and aria-expanded, with
   full arrow-key navigation and expand/collapse. Styling via .cr-tree. */
export default function CrTree(props: CrTreeProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onMounted) props.pt.hooks.onMounted();
  });
  onUpdate(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onUpdated) props.pt.hooks.onUpdated();
  }, []);
  onUnMount(() => {
    if (props.pt && props.pt.hooks && props.pt.hooks.onUnmounted) props.pt.hooks.onUnmounted();
  });

  const state = useStore({
    expanded: {} as Record<string, boolean>,
    selected: "",
    activeId: "",
    rows(): any[] {
      const out: any[] = [];
      const stack: any[] = [];
      let k = props.nodes.length - 1;
      while (k >= 0) {
        stack.push({ node: props.nodes[k], depth: 0 });
        k = k - 1;
      }
      while (stack.length) {
        const top = stack.pop();
        const n = top.node;
        const depth = top.depth;
        const hasChildren = !!(n.children && n.children.length);
        const isOpen = !!state.expanded[n.id];
        out.push({ id: n.id, label: n.label, depth: depth, hasChildren: hasChildren, isOpen: isOpen });
        if (hasChildren && isOpen) {
          let c = n.children.length - 1;
          while (c >= 0) {
            stack.push({ node: n.children[c], depth: depth + 1 });
            c = c - 1;
          }
        }
      }
      return out;
    },
    toggle(id: string) {
      state.expanded = { ...state.expanded, [id]: !state.expanded[id] };
    },
    select(id: string) {
      state.selected = id;
      if (props.onSelect) props.onSelect(id);
    },
    activate(row: any) {
      if (row.hasChildren) state.toggle(row.id);
      state.select(row.id);
      state.activeId = row.id;
    },
    focusItem(el: any) {
      el.focus();
      state.activeId = el.getAttribute("data-id");
    },
    tabIndexFor(row: any, i: number): number {
      if (state.activeId) return row.id === state.activeId ? 0 : -1;
      return i === 0 ? 0 : -1;
    },
    expandedAttr(row: any): any {
      if (!row.hasChildren) return undefined;
      return row.isOpen ? "true" : "false";
    },
    indent(row: any): any {
      return { paddingLeft: "calc(" + row.depth + " * var(--space-4) + var(--space-2))" };
    },
    onKey(event: any) {
      const activeEl: any = document.activeElement;
      const tree = activeEl ? activeEl.closest('[role="tree"]') : null;
      if (!tree) return;
      const items: any[] = Array.from(tree.querySelectorAll('[role="treeitem"]'));
      const i = items.indexOf(activeEl);
      if (i < 0) return;
      const id = activeEl.getAttribute("data-id");
      const exp = activeEl.getAttribute("aria-expanded");
      const level = Number(activeEl.getAttribute("aria-level"));
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (items[i + 1]) state.focusItem(items[i + 1]);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (items[i - 1]) state.focusItem(items[i - 1]);
      } else if (event.key === "Home") {
        event.preventDefault();
        state.focusItem(items[0]);
      } else if (event.key === "End") {
        event.preventDefault();
        state.focusItem(items[items.length - 1]);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (exp === "false") state.toggle(id);
        else if (exp === "true" && items[i + 1]) state.focusItem(items[i + 1]);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (exp === "true") {
          state.toggle(id);
        } else {
          for (let j = i - 1; j >= 0; j--) {
            if (Number(items[j].getAttribute("aria-level")) < level) {
              state.focusItem(items[j]);
              break;
            }
          }
        }
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (exp !== null) state.toggle(id);
        state.select(id);
      }
    },
  });

  onMount(() => {
    if (props.defaultExpanded && props.defaultExpanded.length) {
      const seed: Record<string, boolean> = {};
      props.defaultExpanded.forEach((id: string) => (seed[id] = true));
      state.expanded = seed;
    }
  });

  return (
    <ul {...ptAttrs(ptResolve(cr, props.pt, "CrTree"), "root")} data-part="root" class={ptClass(ptResolve(cr, props.pt, "CrTree"), props.unstyled, "cr-tree", "root")} role="tree" aria-label={props.label} style={ptStyle(ptResolve(cr, props.pt, "CrTree"), props.dt, "root")} onKeyDown={(event) => state.onKey(event)}>
      <For each={state.rows()}>
        {(row: any, i: number) => (
          <li
            {...ptAttrs(ptResolve(cr, props.pt, "CrTree"), "item")}
            data-part="item"
            data-state={state.selected === row.id ? "selected" : "unselected"}
            class={ptClass(ptResolve(cr, props.pt, "CrTree"), props.unstyled, "cr-tree__item", "item")}
            role="treeitem"
            data-id={row.id}
            aria-level={row.depth + 1}
            aria-expanded={state.expandedAttr(row)}
            aria-selected={state.selected === row.id ? "true" : "false"}
            tabIndex={state.tabIndexFor(row, i)}
            style={state.indent(row)}
            onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrTree'), 'item', 'onClick', event); state.activate(row); }}
          >
            <Show when={row.hasChildren} else={<span {...ptAttrs(ptResolve(cr, props.pt, "CrTree"), "lead")} data-part="lead" class={ptClass(ptResolve(cr, props.pt, "CrTree"), props.unstyled, "cr-tree__lead", "lead")} aria-hidden="true">·</span>}>
              <span {...ptAttrs(ptResolve(cr, props.pt, "CrTree"), "twist")} data-part="twist" class={ptClass(ptResolve(cr, props.pt, "CrTree"), props.unstyled, "cr-tree__twist", "twist")} aria-hidden="true"></span>
            </Show>
            <span>{row.label}</span>
          </li>
        )}
      </For>
    </ul>
  );
}
