import { useStore, Show, For, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import CrCheckbox from "./CrCheckbox.lite.tsx";
import { ptAttrs, ptClass, ptHandler, ptNested, ptResolve, ptStyle, resolveMessage, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

export interface CrTableProps {
  columns: string[];
  rows: string[][];
  /** Click a header to sort by that column. */
  sortable?: boolean;
  /** Show a leading checkbox column and track selected rows. */
  selectable?: boolean;
  /** Header sticks to the top of the nearest scroll container. */
  sticky?: boolean;
  /** Fires with the ORIGINAL row indexes currently selected. */
  onSelect?: (indexes: number[]) => void;
  /** Override this component's built-in English strings. Any key you omit falls
   *  back to the app-level `messages` from context, then to the built-in default.
   *  See lib/messages.ts for the keys. */
  labels?: Record<string, any>;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "head" · "body" · "row" · "th" · "td" · "sort" · "indicator" · "checkbox". */
  unstyled?: boolean;
  /** `checkbox` is a NESTED SECTION: its value is a `pt` for the inner CrCheckbox
   *  (`pt={{ checkbox: { root: { "data-testid": "row-select" } } }}`), not an
   *  attribute bag.
   *
   *  RENAMED from `check`, which until the checkbox was extracted was a flat bag
   *  applied straight to an inline `<input>`. Both shapes are structurally valid
   *  `CrPTSection`s — its index signature accepts any key — so reusing the name
   *  would let old `pt={{ check: { class: "big" } }}` keep compiling while silently
   *  doing nothing: the child would look for `root` and find `class`. The rename
   *  turns that into a compile error instead. */
  pt?: CrPassThrough<
    "body" | "checkbox" | "head" | "indicator" | "root" | "row" | "sort" | "td" | "th"
  >;
  dt?: CrDesignTokens;
}

/* Dense operator table. Sort (scalar state), row selection (re-assigned object
 * so every target re-renders), and a sticky header — all from tokens via the
 * .cr-table classes. Styling lives in @alebianco/cr-styles (components.css). */
export default function CrTable(props: CrTableProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrTable"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrTable"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrTable"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  const state = useStore({
    sortCol: -1,
    /* 1 = ascending, -1 = descending */
    sortDir: 1,
    selected: {} as Record<number, boolean>,

    order(): number[] {
      const idx = props.rows.map((_r: string[], i: number) => i);
      if (state.sortCol >= 0) {
        const c = state.sortCol;
        const dir = state.sortDir;
        idx.sort((a: number, b: number) => {
          const av = props.rows[a][c] || "";
          const bv = props.rows[b][c] || "";
          return av < bv ? -dir : av > bv ? dir : 0;
        });
      }
      return idx;
    },

    toggleSort(c: number) {
      if (!props.sortable) return;
      if (state.sortCol === c) state.sortDir = -state.sortDir;
      else {
        state.sortCol = c;
        state.sortDir = 1;
      }
    },

    toggleRow(i: number) {
      state.selected = { ...state.selected, [i]: !state.selected[i] };
      if (props.onSelect) {
        const picked = Object.keys(state.selected)
          .filter((k: string) => state.selected[Number(k)])
          .map((k: string) => Number(k));
        props.onSelect(picked);
      }
    },
  });

  return (
    <table {...ptAttrs(ptResolve(cr, props.pt, "CrTable"), "root")} class={ptClass(ptResolve(cr, props.pt, "CrTable"), props.unstyled, "cr-table" + (props.sticky ? " cr-table--sticky" : ""), "root")} data-part="root" style={ptStyle(ptResolve(cr, props.pt, "CrTable"), props.dt, "root")}>
      <thead {...ptAttrs(ptResolve(cr, props.pt, "CrTable"), "head")} data-part="head">
        <tr {...ptAttrs(ptResolve(cr, props.pt, "CrTable"), "row")} data-part="row">
          <Show when={props.selectable}>
            <th {...ptAttrs(ptResolve(cr, props.pt, "CrTable"), "th")} class={ptClass(ptResolve(cr, props.pt, "CrTable"), props.unstyled, "cr-table__sel", "th")} data-part="th" scope="col" aria-label={resolveMessage(cr, props.labels, "CrTable", "select")}></th>
          </Show>
          <For each={props.columns}>
            {(col: string, colIndex: number) => (
              <th
                {...ptAttrs(ptResolve(cr, props.pt, "CrTable"), "th")}
                data-part="th"
                scope="col"
                aria-sort={
                  state.sortCol === colIndex
                    ? state.sortDir === 1
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <Show when={props.sortable} else={<span>{col}</span>}>
                  <button {...ptAttrs(ptResolve(cr, props.pt, "CrTable"), "sort")} type="button" class={ptClass(ptResolve(cr, props.pt, "CrTable"), props.unstyled, "cr-table__sortable", "sort")} data-part="sort" data-state={state.sortCol === colIndex ? "active" : "inactive"} onClick={() => state.toggleSort(colIndex)}>
                    {col}
                    <Show when={state.sortCol === colIndex}>
                      <span {...ptAttrs(ptResolve(cr, props.pt, "CrTable"), "indicator")} class={ptClass(ptResolve(cr, props.pt, "CrTable"), props.unstyled, "cr-table__ind", "indicator")} data-part="indicator" aria-hidden="true">{state.sortDir === 1 ? "▲" : "▼"}</span>
                    </Show>
                  </button>
                </Show>
              </th>
            )}
          </For>
        </tr>
      </thead>
      <tbody {...ptAttrs(ptResolve(cr, props.pt, "CrTable"), "body")} data-part="body">
        <For each={state.order()}>
          {(rowIndex: number) => (
            <tr {...ptAttrs(ptResolve(cr, props.pt, "CrTable"), "row")} data-part="row" data-state={props.selectable && state.selected[rowIndex] ? "selected" : "unselected"} aria-selected={props.selectable && state.selected[rowIndex] ? "true" : "false"}>
              <Show when={props.selectable}>
                <td {...ptAttrs(ptResolve(cr, props.pt, "CrTable"), "td")} class={ptClass(ptResolve(cr, props.pt, "CrTable"), props.unstyled, "cr-table__sel", "td")} data-part="td">
                  <CrCheckbox
                    pt={ptNested(ptResolve(cr, props.pt, "CrTable"), "checkbox")}
                    unstyled={props.unstyled}
                    checked={!!state.selected[rowIndex]}
                    label={resolveMessage(cr, props.labels, "CrTable", "selectRow")}
                    onChange={() => state.toggleRow(rowIndex)}
                  />
                </td>
              </Show>
              <For each={props.rows[rowIndex]}>
                {(cell: string) => <td {...ptAttrs(ptResolve(cr, props.pt, "CrTable"), "td")} data-part="td">{cell}</td>}
              </For>
            </tr>
          )}
        </For>
      </tbody>
    </table>
  );
}
