import { useStore, For, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptAttrs, ptClass, ptHandler, ptResolve, ptStyle, resolveMessage } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrPaginationProps {
  /** Current page, 1-based (controlled). */
  page: number;
  /** Total number of pages. */
  total: number;
  onChange?: (page: number) => void;
  /** Override this component's built-in English strings. Any key you omit falls
   *  back to the app-level `messages` from context, then to the built-in default.
   *  See lib/messages.ts for the keys. */
  labels?: Record<string, any>;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "btn" · "ellipsis". */
  unstyled?: boolean;
  pt?: CrPassThrough<"btn" | "ellipsis" | "root">;
  dt?: CrDesignTokens;
}

/* Controlled pager: ◂ prev · windowed page numbers with ellipses · next ▸.
 * The nav glyphs are the house solid triangles, the same pair CrCalendar and
 * CrCarousel use for their prev/next buttons; they were ‹ › here alone. Each is
 * aria-hidden because the button already carries an aria-label.
 * Derived values live in useStore getters (Mitosis strips free consts in the
 * component body for some targets). Styling via .cr-pager. */
export default function CrPagination(props: CrPaginationProps) {
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
    <nav {...ptAttrs(ptResolve(cr, props.pt, "CrPagination"), "root")} data-part="root" class={ptClass(ptResolve(cr, props.pt, "CrPagination"), props.unstyled, "cr-pager", "root")} aria-label={resolveMessage(cr, props.labels, "CrPagination", "pagination")} style={ptStyle(ptResolve(cr, props.pt, "CrPagination"), props.dt, "root")}>
      <button
        {...ptAttrs(ptResolve(cr, props.pt, "CrPagination"), "btn")}
        type="button"
        data-part="btn"
        class={ptClass(ptResolve(cr, props.pt, "CrPagination"), props.unstyled, "cr-pager__btn", "btn")}
        aria-label={resolveMessage(cr, props.labels, "CrPagination", "prevPage")}
        disabled={state.cur <= 1}
        onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrPagination'), 'btn', 'onClick', event); state.go(state.cur - 1); }}
      >
        <span aria-hidden="true">◂</span>
      </button>
      <For each={state.items}>
        {(n: number) =>
          n < 0 ? (
            <span {...ptAttrs(ptResolve(cr, props.pt, "CrPagination"), "ellipsis")} data-part="ellipsis" class={ptClass(ptResolve(cr, props.pt, "CrPagination"), props.unstyled, "cr-pager__ellipsis", "ellipsis")} aria-hidden="true">…</span>
          ) : (
            <button
              {...ptAttrs(ptResolve(cr, props.pt, "CrPagination"), "btn")}
              type="button"
              data-part="btn"
              data-state={n === state.cur ? "current" : "inactive"}
              class={ptClass(ptResolve(cr, props.pt, "CrPagination"), props.unstyled, "cr-pager__btn" + (n === state.cur ? " cr-pager__btn--on" : ""), "btn")}
              aria-label={resolveMessage(cr, props.labels, "CrPagination", "page", n)}
              aria-current={n === state.cur ? "page" : "false"}
              onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrPagination'), 'btn', 'onClick', event); state.go(n); }}
            >
              {n}
            </button>
          )
        }
      </For>
      <button
        {...ptAttrs(ptResolve(cr, props.pt, "CrPagination"), "btn")}
        type="button"
        data-part="btn"
        class={ptClass(ptResolve(cr, props.pt, "CrPagination"), props.unstyled, "cr-pager__btn", "btn")}
        aria-label={resolveMessage(cr, props.labels, "CrPagination", "nextPage")}
        disabled={state.cur >= state.last}
        onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrPagination'), 'btn', 'onClick', event); state.go(state.cur + 1); }}
      >
        <span aria-hidden="true">▸</span>
      </button>
    </nav>
  );
}
