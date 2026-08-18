import { useStore, useRef, Show, For, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import CrCheckbox from "./CrCheckbox.lite.tsx";
import { ptAttrs, ptClass, ptHandler, ptNested, ptResolve, ptStyle, resolveMessage, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

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
  /** row height in px — a fixed number (fast path, default 34) OR a
   *  `(row, index) => number` for **variable-height rows** (prefix-sum + binary
   *  search windowing). Heights must be deterministic from the row. */
  rowHeight?: number | ((row: any, index: number) => number);
  emptyLabel?: string;
  onSortChange?: (key: string, dir: string) => void;
  onSelectionChange?: (keys: string[]) => void;
  /** Override this component's built-in English strings. Any key you omit falls
   *  back to the app-level `messages` from context, then to the built-in default.
   *  See lib/messages.ts for the keys. */
  labels?: Record<string, any>;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "head" · "cell" · "sort" · "glyph" · "viewport" · "empty" · "sizer" · "rows" · "row". */
  unstyled?: boolean;
  /** `checkbox` is a NESTED SECTION: its value is a `pt` for the inner CrCheckbox
   *  (`pt={{ checkbox: { root: { "data-testid": "row-select" } } }}`), not an
   *  attribute bag for an element. */
  pt?: CrPassThrough<
    | "cell"
    | "checkbox"
    | "empty"
    | "glyph"
    | "head"
    | "root"
    | "row"
    | "rows"
    | "sizer"
    | "sort"
    | "viewport"
  >;
  dt?: CrDesignTokens;
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
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrDataGrid"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrDataGrid"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrDataGrid"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

  const vpRef = useRef(null);

  const state = useStore({
    sortKey: "",
    /* "" | "asc" | "desc" */
    sortDir: "",
    sel: {} as Record<string, boolean>,
    scrollTop: 0,

    rowH(): number {
      return typeof props.rowHeight === "number" ? props.rowHeight : 34;
    },
    viewportH(): number {
      return props.height || 320;
    },
    /* variable-height mode: rowHeight is a (row,index)=>number function */
    isVar(): boolean {
      return typeof props.rowHeight === "function";
    },
    rowPx(row: any, index: number): number {
      const rh: any = props.rowHeight;
      return typeof rh === "function" ? rh(row, index) || 34 : rh || 34;
    },
    /* prefix[i] = pixel offset of row i (length n+1); only built in variable mode */
    prefix(): number[] {
      const arr = state.sorted();
      const p: number[] = [0];
      for (let i = 0; i < arr.length; i++) p.push(p[i] + state.rowPx(arr[i], i));
      return p;
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
      if (!state.isVar()) return props.rows.length * state.rowH();
      const p = state.prefix();
      return p[p.length - 1];
    },
    start(): number {
      const overscan = 4;
      if (!state.isVar()) return Math.max(0, Math.floor(state.scrollTop / state.rowH()) - overscan);
      /* binary search for the last row whose offset is <= scrollTop */
      const p = state.prefix();
      let lo = 0;
      let hi = p.length - 1;
      let ans = 0;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (p[mid] <= state.scrollTop) {
          ans = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      return Math.max(0, ans - overscan);
    },
    windowRows(): any[] {
      const s = state.start();
      const arr = state.sorted();
      if (!state.isVar()) {
        const count = Math.ceil(state.viewportH() / state.rowH()) + 8; /* + overscan both ends */
        return arr.slice(s, s + count);
      }
      const p = state.prefix();
      const limit = state.scrollTop + state.viewportH();
      let e = s;
      while (e < arr.length && p[e] < limit) e++;
      return arr.slice(s, Math.min(arr.length, e + 4));
    },
    offsetY(): number {
      if (!state.isVar()) return state.start() * state.rowH();
      return state.prefix()[state.start()];
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
      let top: number;
      let rh: number;
      if (state.isVar()) {
        const p = state.prefix();
        top = p[r];
        rh = p[r + 1] - p[r];
      } else {
        rh = state.rowH();
        top = r * rh;
      }
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
      {...ptAttrs(ptResolve(cr, props.pt, "CrDataGrid"), "root")}
      class={ptClass(ptResolve(cr, props.pt, "CrDataGrid"), props.unstyled, "cr-grid", "root")}
      role="grid"
      aria-rowcount={props.rows.length}
      tabIndex={0}
      aria-activedescendant={state.activeId()}
      data-part="root"
      style={ptStyle(ptResolve(cr, props.pt, "CrDataGrid"), props.dt, "root")}
      onFocus={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrDataGrid'), 'root', 'onFocus', event); state.onGridFocus(); }}
      onKeyDown={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrDataGrid'), 'root', 'onKeyDown', event); state.onGridKey(event); }}
    >
      <div {...ptAttrs(ptResolve(cr, props.pt, "CrDataGrid"), "head")} class={ptClass(ptResolve(cr, props.pt, "CrDataGrid"), props.unstyled, "cr-grid__head", "head")} data-part="head" role="row" style={{ gridTemplateColumns: state.template() }}>
        <Show when={props.selectable}>
          <div {...ptAttrs(ptResolve(cr, props.pt, "CrDataGrid"), "cell")} class={ptClass(ptResolve(cr, props.pt, "CrDataGrid"), props.unstyled, "cr-grid__cell cr-grid__cell--check", "cell")} data-part="cell" role="columnheader">
            <CrCheckbox
              pt={ptNested(ptResolve(cr, props.pt, "CrDataGrid"), "checkbox")}
              unstyled={props.unstyled}
              label={resolveMessage(cr, props.labels, "CrDataGrid", "selectAllRows")}
              checked={state.allChecked()}
              onChange={() => state.toggleAll()}
            />
          </div>
        </Show>
        <For each={props.columns}>
          {(col: CrGridColumn) => (
            <div
              {...ptAttrs(ptResolve(cr, props.pt, "CrDataGrid"), "cell")}
              class={ptClass(ptResolve(cr, props.pt, "CrDataGrid"), props.unstyled, "cr-grid__cell cr-grid__cell--" + state.align(col), "cell")}
              data-part="cell"
              role="columnheader"
              aria-sort={col.sortable ? state.ariaSort(col) : undefined}
            >
              <Show when={col.sortable}>
                <button {...ptAttrs(ptResolve(cr, props.pt, "CrDataGrid"), "sort")} type="button" class={ptClass(ptResolve(cr, props.pt, "CrDataGrid"), props.unstyled, "cr-grid__sort", "sort")} data-part="sort" onClick={() => state.toggleSort(col)}>
                  {col.label}
                  <span {...ptAttrs(ptResolve(cr, props.pt, "CrDataGrid"), "glyph")} class={ptClass(ptResolve(cr, props.pt, "CrDataGrid"), props.unstyled, "cr-grid__glyph", "glyph")} data-part="glyph" aria-hidden="true">{state.sortGlyph(col)}</span>
                </button>
              </Show>
              <Show when={!col.sortable}>
                <span>{col.label}</span>
              </Show>
            </div>
          )}
        </For>
      </div>

      <div {...ptAttrs(ptResolve(cr, props.pt, "CrDataGrid"), "viewport")} class={ptClass(ptResolve(cr, props.pt, "CrDataGrid"), props.unstyled, "cr-grid__viewport", "viewport")} data-part="viewport" ref={vpRef} style={{ height: state.viewportH() + "px" }} onScroll={(event) => state.onScroll(event)}>
        <Show when={props.rows.length === 0}>
          <div {...ptAttrs(ptResolve(cr, props.pt, "CrDataGrid"), "empty")} class={ptClass(ptResolve(cr, props.pt, "CrDataGrid"), props.unstyled, "cr-grid__empty", "empty")} data-part="empty">{props.emptyLabel || "No rows"}</div>
        </Show>
        <div {...ptAttrs(ptResolve(cr, props.pt, "CrDataGrid"), "sizer")} class={ptClass(ptResolve(cr, props.pt, "CrDataGrid"), props.unstyled, "cr-grid__sizer", "sizer")} data-part="sizer" style={{ height: state.totalH() + "px" }}>
          <div {...ptAttrs(ptResolve(cr, props.pt, "CrDataGrid"), "rows")} class={ptClass(ptResolve(cr, props.pt, "CrDataGrid"), props.unstyled, "cr-grid__rows", "rows")} data-part="rows" style={{ transform: "translateY(" + state.offsetY() + "px)" }}>
            <For each={state.windowRows()}>
              {(row: any, i: number) => (
                <div
                  {...ptAttrs(ptResolve(cr, props.pt, "CrDataGrid"), "row")}
                  class={ptClass(ptResolve(cr, props.pt, "CrDataGrid"), props.unstyled, "cr-grid__row", "row")}
                  data-part="row"
                  role="row"
                  aria-rowindex={state.absIndex(i) + 1}
                  aria-selected={props.selectable ? (state.isSelected(row, state.absIndex(i)) ? "true" : "false") : undefined}
                  data-state={props.selectable ? (state.isSelected(row, state.absIndex(i)) ? "selected" : "unselected") : undefined}
                  style={{ gridTemplateColumns: state.template(), height: state.rowPx(row, state.absIndex(i)) + "px" }}
                >
                  <Show when={props.selectable}>
                    <div
                      {...ptAttrs(ptResolve(cr, props.pt, "CrDataGrid"), "cell")}
                      class={ptClass(ptResolve(cr, props.pt, "CrDataGrid"), props.unstyled, "cr-grid__cell cr-grid__cell--check" + (state.isActive(state.absIndex(i), 0) ? " cr-grid__cell--active" : ""), "cell")}
                      data-part="cell"
                      data-state={state.isActive(state.absIndex(i), 0) ? "active" : "inactive"}
                      role="gridcell"
                      id={state.cellId(state.absIndex(i), 0)}
                    >
                      <CrCheckbox
                        pt={ptNested(ptResolve(cr, props.pt, "CrDataGrid"), "checkbox")}
                        unstyled={props.unstyled}
                        label={resolveMessage(cr, props.labels, "CrDataGrid", "selectRow")}
                        checked={state.isSelected(row, state.absIndex(i))}
                        onChange={() => state.toggleRow(row, state.absIndex(i))}
                      />
                    </div>
                  </Show>
                  <For each={props.columns}>
                    {(col: CrGridColumn, ci: number) => (
                      <div
                        {...ptAttrs(ptResolve(cr, props.pt, "CrDataGrid"), "cell")}
                        class={ptClass(ptResolve(cr, props.pt, "CrDataGrid"), props.unstyled, "cr-grid__cell cr-grid__cell--" + state.align(col) + (state.isActive(state.absIndex(i), (props.selectable ? 1 : 0) + ci) ? " cr-grid__cell--active" : ""), "cell")}
                        data-part="cell"
                        data-state={state.isActive(state.absIndex(i), (props.selectable ? 1 : 0) + ci) ? "active" : "inactive"}
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
