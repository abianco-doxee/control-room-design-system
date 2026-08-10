import { useStore, Show, For } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

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
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "head" · "body" · "row" · "th" · "td" · "sort" · "indicator" · "check". */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

/* Dense operator table. Sort (scalar state), row selection (re-assigned object
 * so every target re-renders), and a sticky header — all from tokens via the
 * .cr-table classes. Styling lives in @abianco-doxee/cr-styles (components.css). */
export default function CrTable(props: CrTableProps) {
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
    <table {...ptAttrs(props.pt, "root")} class={ptClass(props.pt, props.unstyled, "cr-table" + (props.sticky ? " cr-table--sticky" : ""), "root")} data-part="root" style={ptStyle(props.pt, props.dt, "root")}>
      <thead {...ptAttrs(props.pt, "head")} data-part="head">
        <tr {...ptAttrs(props.pt, "row")} data-part="row">
          <Show when={props.selectable}>
            <th {...ptAttrs(props.pt, "th")} class={ptClass(props.pt, props.unstyled, "cr-table__sel", "th")} data-part="th" scope="col" aria-label="select"></th>
          </Show>
          <For each={props.columns}>
            {(col: string, colIndex: number) => (
              <th
                {...ptAttrs(props.pt, "th")}
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
                  <button {...ptAttrs(props.pt, "sort")} type="button" class={ptClass(props.pt, props.unstyled, "cr-table__sortable", "sort")} data-part="sort" data-state={state.sortCol === colIndex ? "active" : "inactive"} onClick={() => state.toggleSort(colIndex)}>
                    {col}
                    <Show when={state.sortCol === colIndex}>
                      <span {...ptAttrs(props.pt, "indicator")} class={ptClass(props.pt, props.unstyled, "cr-table__ind", "indicator")} data-part="indicator" aria-hidden="true">{state.sortDir === 1 ? "▲" : "▼"}</span>
                    </Show>
                  </button>
                </Show>
              </th>
            )}
          </For>
        </tr>
      </thead>
      <tbody {...ptAttrs(props.pt, "body")} data-part="body">
        <For each={state.order()}>
          {(rowIndex: number) => (
            <tr {...ptAttrs(props.pt, "row")} data-part="row" data-state={props.selectable && state.selected[rowIndex] ? "selected" : "unselected"} aria-selected={props.selectable && state.selected[rowIndex] ? "true" : "false"}>
              <Show when={props.selectable}>
                <td {...ptAttrs(props.pt, "td")} class={ptClass(props.pt, props.unstyled, "cr-table__sel", "td")} data-part="td">
                  <input
                    {...ptAttrs(props.pt, "check")}
                    type="checkbox"
                    class={ptClass(props.pt, props.unstyled, "cr-check", "check")}
                    data-part="check"
                    checked={!!state.selected[rowIndex]}
                    aria-label="select row"
                    onChange={() => state.toggleRow(rowIndex)}
                  />
                </td>
              </Show>
              <For each={props.rows[rowIndex]}>
                {(cell: string) => <td {...ptAttrs(props.pt, "td")} data-part="td">{cell}</td>}
              </For>
            </tr>
          )}
        </For>
      </tbody>
    </table>
  );
}
