import { useStore, useRef, Show, For } from "@builder.io/mitosis";

export interface CrGridColumn {
  key: string;
  label: string;
  sortable?: boolean;
  /** cell text alignment: "start" (default) · "end" (numbers) · "center". */
  align?: string;
  /** a CSS grid track for this column, e.g. "1fr", "120px", "minmax(80px,1fr)". */
  width?: string;
}

export interface CrDataGridProps {
  columns: CrGridColumn[];
  rows: any[];
  /** row field used as the stable key (default: the row index). */
  rowKey?: string;
  /** show a leading checkbox column for row selection. */
  selectable?: boolean;
  /** scroll viewport height in px (default 320). */
  height?: number;
  /** fixed row height in px — the basis for virtualization (default 34). */
  rowHeight?: number;
  emptyLabel?: string;
  onSortChange?: (key: string, dir: string) => void;
  onSelectionChange?: (keys: string[]) => void;
}

/* Control Room data grid — a dense, virtualized table for large datasets.
 * - **Virtualized**: only the rows in (or near) the viewport are in the DOM, so
 *   10k rows scroll smoothly. Fixed row height; a sizer preserves scroll height and
 *   the visible block is offset with translateY.
 * - **Sortable**: click/Enter a sortable header to cycle asc → desc → none (stable).
 * - **Selectable**: a leading checkbox column + select-all.
 * - **Sticky header**, grid a11y (role=grid/row/columnheader/gridcell, aria-sort,
 *   aria-rowcount, aria-selected). Styling via .cr-grid. */
export default function CrDataGrid(props: CrDataGridProps) {
  const vpRef = useRef(null);

  const state = useStore({
    sortKey: "",
    /* "" | "asc" | "desc" */
    sortDir: "",
    sel: {} as Record<string, boolean>,
    scrollTop: 0,

    rowH(): number {
      return props.rowHeight || 34;
    },
    viewportH(): number {
      return props.height || 320;
    },
    keyOf(row: any, index: number): string {
      return props.rowKey ? String(row[props.rowKey]) : String(index);
    },
    template(): string {
      const cols = props.columns.map((c) => c.width || "1fr").join(" ");
      return (props.selectable ? "36px " : "") + cols;
    },
    align(col: CrGridColumn): string {
      return col.align === "end" ? "end" : col.align === "center" ? "center" : "start";
    },

    /* ── sorting ── */
    toggleSort(col: CrGridColumn) {
      if (!col.sortable) return;
      let dir = "asc";
      if (state.sortKey === col.key) dir = state.sortDir === "asc" ? "desc" : state.sortDir === "desc" ? "" : "asc";
      state.sortKey = dir ? col.key : "";
      state.sortDir = dir;
      if (props.onSortChange) props.onSortChange(state.sortKey, state.sortDir);
    },
    ariaSort(col: CrGridColumn): string {
      if (state.sortKey !== col.key || !state.sortDir) return "none";
      return state.sortDir === "asc" ? "ascending" : "descending";
    },
    sortGlyph(col: CrGridColumn): string {
      if (state.sortKey !== col.key || !state.sortDir) return "";
      return state.sortDir === "asc" ? "▲" : "▼";
    },
    sorted(): any[] {
      if (!state.sortKey || !state.sortDir) return props.rows;
      const k = state.sortKey;
      const dir = state.sortDir === "asc" ? 1 : -1;
      /* copy first — never mutate the caller's array */
      return props.rows.slice().sort((a: any, b: any) => {
        const av = a[k];
        const bv = b[k];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
        return String(av).localeCompare(String(bv)) * dir;
      });
    },

    /* ── virtualization ── */
    onScroll(event: any) {
      state.scrollTop = (event.target as HTMLElement).scrollTop;
    },
    totalH(): number {
      return props.rows.length * state.rowH();
    },
    start(): number {
      const overscan = 4;
      return Math.max(0, Math.floor(state.scrollTop / state.rowH()) - overscan);
    },
    windowRows(): any[] {
      const rh = state.rowH();
      /* rows across the viewport + overscan at both ends */
      const count = Math.ceil(state.viewportH() / rh) + 8;
      const s = state.start();
      return state.sorted().slice(s, s + count);
    },
    offsetY(): number {
      return state.start() * state.rowH();
    },
    absIndex(i: number): number {
      return state.start() + i;
    },

    /* ── selection ── */
    isSelected(row: any, index: number): boolean {
      return !!state.sel[state.keyOf(row, index)];
    },
    toggleRow(row: any, index: number) {
      const k = state.keyOf(row, index);
      const next = { ...state.sel };
      if (next[k]) delete next[k];
      else next[k] = true;
      state.sel = next;
      state.emitSelection(next);
    },
    allChecked(): boolean {
      return props.rows.length > 0 && Object.keys(state.sel).length === props.rows.length;
    },
    toggleAll() {
      let next: Record<string, boolean> = {};
      if (!state.allChecked()) {
        for (let i = 0; i < props.rows.length; i++) next[state.keyOf(props.rows[i], i)] = true;
      }
      state.sel = next;
      state.emitSelection(next);
    },
    /* take the next map explicitly — reading state.sel right after setting it is a
     * stale read once compiled to React (setState is async). */
    emitSelection(next: Record<string, boolean>) {
      if (props.onSelectionChange) props.onSelectionChange(Object.keys(next));
    },
    selCount(): number {
      return Object.keys(state.sel).length;
    },
  });

  return (
    <div class="cr-grid" role="grid" aria-rowcount={props.rows.length}>
      <div class="cr-grid__head" role="row" style={{ gridTemplateColumns: state.template() }}>
        <Show when={props.selectable}>
          <div class="cr-grid__cell cr-grid__cell--check" role="columnheader">
            <input
              type="checkbox"
              aria-label="Select all rows"
              checked={state.allChecked()}
              onChange={() => state.toggleAll()}
            />
          </div>
        </Show>
        <For each={props.columns}>
          {(col: CrGridColumn) => (
            <div
              class={"cr-grid__cell cr-grid__cell--" + state.align(col)}
              role="columnheader"
              aria-sort={col.sortable ? state.ariaSort(col) : undefined}
            >
              <Show when={col.sortable}>
                <button type="button" class="cr-grid__sort" onClick={() => state.toggleSort(col)}>
                  {col.label}
                  <span class="cr-grid__glyph" aria-hidden="true">{state.sortGlyph(col)}</span>
                </button>
              </Show>
              <Show when={!col.sortable}>
                <span>{col.label}</span>
              </Show>
            </div>
          )}
        </For>
      </div>

      <div class="cr-grid__viewport" ref={vpRef} style={{ height: state.viewportH() + "px" }} onScroll={(event) => state.onScroll(event)}>
        <Show when={props.rows.length === 0}>
          <div class="cr-grid__empty">{props.emptyLabel || "No rows"}</div>
        </Show>
        <div class="cr-grid__sizer" style={{ height: state.totalH() + "px" }}>
          <div class="cr-grid__rows" style={{ transform: "translateY(" + state.offsetY() + "px)" }}>
            <For each={state.windowRows()}>
              {(row: any, i: number) => (
                <div
                  class="cr-grid__row"
                  role="row"
                  aria-rowindex={state.absIndex(i) + 1}
                  aria-selected={props.selectable ? (state.isSelected(row, state.absIndex(i)) ? "true" : "false") : undefined}
                  style={{ gridTemplateColumns: state.template(), height: state.rowH() + "px" }}
                >
                  <Show when={props.selectable}>
                    <div class="cr-grid__cell cr-grid__cell--check" role="gridcell">
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        checked={state.isSelected(row, state.absIndex(i))}
                        onChange={() => state.toggleRow(row, state.absIndex(i))}
                      />
                    </div>
                  </Show>
                  <For each={props.columns}>
                    {(col: CrGridColumn) => (
                      <div class={"cr-grid__cell cr-grid__cell--" + state.align(col)} role="gridcell">
                        {row[col.key]}
                      </div>
                    )}
                  </For>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
}
