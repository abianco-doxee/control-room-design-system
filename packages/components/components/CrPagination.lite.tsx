import { useStore, For } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrPaginationProps {
  /** Current page, 1-based (controlled). */
  page: number;
  /** Total number of pages. */
  total: number;
  onChange?: (page: number) => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "btn" · "ellipsis". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* Controlled pager: ‹ prev · windowed page numbers with ellipses · next ›.
 * Derived values live in useStore getters (Mitosis strips free consts in the
 * component body for some targets). Styling via .cr-pager. */
export default function CrPagination(props: CrPaginationProps) {
  const state = useStore({
    get cur() {
      return props.page || 1;
    },
    get last() {
      return props.total || 1;
    },
    /** page numbers to render; -1 marks an ellipsis gap */
    get items(): number[] {
      const cur = props.page || 1;
      const last = props.total || 1;
      const out: number[] = [];
      if (last <= 7) {
        for (let i = 1; i <= last; i++) out.push(i);
        return out;
      }
      out.push(1);
      if (cur > 3) out.push(-1);
      const start = Math.max(2, cur - 1);
      const end = Math.min(last - 1, cur + 1);
      for (let i = start; i <= end; i++) out.push(i);
      if (cur < last - 2) out.push(-1);
      out.push(last);
      return out;
    },
    go(p: number) {
      if (p >= 1 && p <= state.last && p !== state.cur && props.onChange) props.onChange(p);
    },
  });

  return (
    <nav {...ptAttrs(props.pt, "root")} data-part="root" class={ptClass(props.pt, props.unstyled, "cr-pager", "root")} aria-label="Pagination" style={ptStyle(props.pt, props.dt, "root")}>
      <button
        {...ptAttrs(props.pt, "btn")}
        type="button"
        data-part="btn"
        class={ptClass(props.pt, props.unstyled, "cr-pager__btn", "btn")}
        aria-label="Previous page"
        disabled={state.cur <= 1}
        onClick={() => state.go(state.cur - 1)}
      >
        ‹
      </button>
      <For each={state.items}>
        {(n: number) =>
          n < 0 ? (
            <span {...ptAttrs(props.pt, "ellipsis")} data-part="ellipsis" class={ptClass(props.pt, props.unstyled, "cr-pager__ellipsis", "ellipsis")} aria-hidden="true">…</span>
          ) : (
            <button
              {...ptAttrs(props.pt, "btn")}
              type="button"
              data-part="btn"
              data-state={n === state.cur ? "current" : "inactive"}
              class={ptClass(props.pt, props.unstyled, "cr-pager__btn" + (n === state.cur ? " cr-pager__btn--on" : ""), "btn")}
              aria-label={"Page " + n}
              aria-current={n === state.cur ? "page" : "false"}
              onClick={() => state.go(n)}
            >
              {n}
            </button>
          )
        }
      </For>
      <button
        {...ptAttrs(props.pt, "btn")}
        type="button"
        data-part="btn"
        class={ptClass(props.pt, props.unstyled, "cr-pager__btn", "btn")}
        aria-label="Next page"
        disabled={state.cur >= state.last}
        onClick={() => state.go(state.cur + 1)}
      >
        ›
      </button>
    </nav>
  );
}
