import { useStore, onMount, Show, For } from "@builder.io/mitosis";

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
}

/* Hierarchical tree (role=tree), rendered as a flat list of visible rows (Mitosis
   cannot recurse a component). Each row carries aria-level and aria-expanded, with
   full arrow-key navigation and expand/collapse. Styling via .cr-tree. */
export default function CrTree(props: CrTreeProps) {
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
    onKey(event: KeyboardEvent) {
      const activeEl: any = document.activeElement;
      const tree = activeEl ? activeEl.closest('[role="tree"]') : null;
      if (!tree) return;
      const items = Array.from(tree.querySelectorAll('[role="treeitem"]'));
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
    <ul class="cr-tree" role="tree" aria-label={props.label} onKeyDown={(event) => state.onKey(event)}>
      <For each={state.rows()}>
        {(row: any, i: number) => (
          <li
            class="cr-tree__item"
            role="treeitem"
            data-id={row.id}
            aria-level={row.depth + 1}
            aria-expanded={state.expandedAttr(row)}
            aria-selected={state.selected === row.id ? "true" : "false"}
            tabIndex={state.tabIndexFor(row, i)}
            style={state.indent(row)}
            onClick={() => state.activate(row)}
          >
            <Show when={row.hasChildren} else={<span class="cr-tree__lead" aria-hidden="true">·</span>}>
              <span class="cr-tree__twist" aria-hidden="true"></span>
            </Show>
            <span>{row.label}</span>
          </li>
        )}
      </For>
    </ul>
  );
}
