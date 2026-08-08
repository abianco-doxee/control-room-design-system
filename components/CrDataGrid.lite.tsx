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
  /** Ties the active-cell id together for keyboard nav (default "cr-grid"). */
  id?: string;
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

    /* ── keyboard navigation (WAI-ARIA grid, active-descendant) ──
     * The grid is one tab stop; arrow keys move an ACTIVE cell (fr,fc) tracked in
     * state and surfaced via aria-activedescendant, so nav survives virtualization
     * (no focus() on a possibly-unrendered cell — we just scroll it into view). */
    fr: -1,
    fc: 0,
    gid(): string {
      return props.id || "cr-grid";
    },
    colCount(): number {
      return props.columns.length + (props.selectable ? 1 : 0);
    },
    cellId(r: number, c: number): string {
      return state.gid() + "-c-" + r + "-" + c;
    },
    activeId(): string | undefined {
      return state.fr >= 0 ? state.cellId(state.fr, state.fc) : undefined;
    },
    isActive(r: number, c: number): boolean {
      return r === state.fr && c === state.fc;
    },
    scrollRowIntoView(r: number) {
      const vp: any = vpRef;
      if (!vp) return;
      const rh = state.rowH();
      const top = r * rh;
      const cur = vp.scrollTop;
      if (top < cur) {
        vp.scrollTop = top;
        state.scrollTop = top;
      } else if (top + rh > cur + state.viewportH()) {
        const nt = top + rh - state.viewportH();
        vp.scrollTop = nt;
        state.scrollTop = nt;
      }
    },
    onGridFocus() {
      if (state.fr < 0 && props.rows.length > 0) {
        state.fr = state.start();
        state.fc = 0;
      }
    },
    onGridKey(event: any) {
      const rowsN = props.rows.length;
      const cols = state.colCount();
      if (rowsN === 0) return;
      let r = state.fr < 0 ? state.start() : state.fr;
      let c = state.fc;
      const page = Math.max(1, Math.floor(state.viewportH() / state.rowH()) - 1);
      const key = event.key;
      let handled = true;
      if (key === "ArrowDown") r = Math.min(rowsN - 1, r + 1);
      else if (key === "ArrowUp") r = Math.max(0, r - 1);
      else if (key === "ArrowRight") c = Math.min(cols - 1, c + 1);
      else if (key === "ArrowLeft") c = Math.max(0, c - 1);
      else if (key === "Home") c = 0;
      else if (key === "End") c = cols - 1;
      else if (key === "PageDown") r = Math.min(rowsN - 1, r + page);
      else if (key === "PageUp") r = Math.max(0, r - page);
      else handled = false;
      if (!handled) return;
      event.preventDefault();
      state.fr = r;
      state.fc = c;
      state.scrollRowIntoView(r);
    },
  });

  return (
    <div
      class="cr-grid"
      role="grid"
      aria-rowcount={props.rows.length}
      tabIndex={0}
      aria-activedescendant={state.activeId()}
      onFocus={() => state.onGridFocus()}
      onKeyDown={(event) => state.onGridKey(event)}
    >
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
                    <div
                      class={"cr-grid__cell cr-grid__cell--check" + (state.isActive(state.absIndex(i), 0) ? " cr-grid__cell--active" : "")}
                      role="gridcell"
                      id={state.cellId(state.absIndex(i), 0)}
                    >
                      <input
                        type="checkbox"
                        aria-label="Select row"
                        checked={state.isSelected(row, state.absIndex(i))}
                        onChange={() => state.toggleRow(row, state.absIndex(i))}
                      />
                    </div>
                  </Show>
                  <For each={props.columns}>
                    {(col: CrGridColumn, ci: number) => (
                      <div
                        class={"cr-grid__cell cr-grid__cell--" + state.align(col) + (state.isActive(state.absIndex(i), (props.selectable ? 1 : 0) + ci) ? " cr-grid__cell--active" : "")}
                        role="gridcell"
                        id={state.cellId(state.absIndex(i), (props.selectable ? 1 : 0) + ci)}
                      >
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
