import { useStore, For } from "@builder.io/mitosis";
import { ptClass, ptAttrs, ptStyle } from "../lib/pt.ts";

export interface CrCalendarDay {
  iso: string;
  day: number;
  inMonth: boolean;
  disabled: boolean;
}

export interface CrCalendarProps {
  /** Displayed month, `YYYY-MM` (injected — never read from the clock, so SSR and
   *  client agree). Falls back to the month of `value`, then `today`. */
  month?: string;
  /** Selected date, `YYYY-MM-DD` (controlled). */
  value?: string;
  /** Today, `YYYY-MM-DD` (injected — omit to not ring a "today" cell). */
  today?: string;
  /** Selectable range, inclusive, `YYYY-MM-DD`. */
  min?: string;
  max?: string;
  /** 0 = Sunday (default) · 1 = Monday. */
  weekStart?: number;
  label?: string;
  onSelect?: (iso: string) => void;
  /** Fires with the new `YYYY-MM` when the month is stepped. */
  onMonthChange?: (month: string) => void;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "header" · "prev" · "next" · "grid" · "weekday" · "day".
   * The selected accent is `--cr-calendar-selected-bg` (a state, Law 2). */
  unstyled?: boolean;
  pt?: any;
  dt?: any;
}

const WD = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* A month calendar grid — WAI-ARIA `role="grid"` with weekday columnheaders and
 * day buttons, roving tabindex (←/→ ±1 day, ↑/↓ ±1 week, Home/End week ends,
 * PageUp/PageDown step months, Enter/Space select). Fully controlled and SSR-safe:
 * the displayed month and "today" are injected props, never read from the clock.
 * Styling via .cr-calendar; data-part per part. */
export default function CrCalendar(props: CrCalendarProps) {
  const state = useStore({
    pad(n: number): string {
      return n < 10 ? "0" + n : "" + n;
    },
    // {y, m} (m 0-based) for the displayed month, from month|value|today.
    get view(): number[] {
      const src = props.month || (props.value ? props.value.slice(0, 7) : "") || (props.today ? props.today.slice(0, 7) : "");
      const parts = src.split("-");
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!y || !m) return [1970, 0];
      return [y, m - 1];
    },
    get monthLabel(): string {
      const v = state.view;
      return MON[v[1]] + " " + v[0];
    },
    get weekdays(): string[] {
      const ws = props.weekStart === 1 ? 1 : 0;
      const out: string[] = [];
      for (let i = 0; i < 7; i++) out.push(WD[(i + ws) % 7]);
      return out;
    },
    outOfRange(iso: string): boolean {
      if (props.min && iso < props.min) return true;
      if (props.max && iso > props.max) return true;
      return false;
    },
    // 6 weeks × 7 days covering the month plus adjacent-month spill. Nested so the
    // grid is role=grid > role=row > role=gridcell (the required ARIA structure).
    get weeks(): CrCalendarDay[][] {
      const v = state.view;
      const y = v[0];
      const m = v[1];
      const ws = props.weekStart === 1 ? 1 : 0;
      const first = new Date(y, m, 1);
      const lead = (first.getDay() - ws + 7) % 7;
      const rows: CrCalendarDay[][] = [];
      for (let w = 0; w < 6; w++) {
        const row: CrCalendarDay[] = [];
        for (let dow = 0; dow < 7; dow++) {
          const i = w * 7 + dow;
          const d = new Date(y, m, 1 - lead + i);
          const iso = d.getFullYear() + "-" + state.pad(d.getMonth() + 1) + "-" + state.pad(d.getDate());
          row.push({ iso, day: d.getDate(), inMonth: d.getMonth() === m, disabled: state.outOfRange(iso) });
        }
        rows.push(row);
      }
      return rows;
    },
    // The single tab stop: the selected day if visible, else the first day of month.
    tabbable(iso: string, inMonth: boolean, day: number): boolean {
      if (props.value) return iso === props.value;
      return inMonth && day === 1;
    },
    stepMonth(delta: number) {
      const v = state.view;
      const d = new Date(v[0], v[1] + delta, 1);
      const next = d.getFullYear() + "-" + state.pad(d.getMonth() + 1);
      if (props.onMonthChange) props.onMonthChange(next);
    },
    pick(cell: CrCalendarDay) {
      if (cell.disabled) return;
      if (props.onSelect) props.onSelect(cell.iso);
    },
    onKey(event: any) {
      const target: any = event.target;
      const idxAttr = target ? target.getAttribute("data-idx") : null;
      if (idxAttr === null || idxAttr === undefined) return;
      const i = parseInt(idxAttr, 10);
      let next = i;
      if (event.key === "ArrowRight") next = i + 1;
      else if (event.key === "ArrowLeft") next = i - 1;
      else if (event.key === "ArrowDown") next = i + 7;
      else if (event.key === "ArrowUp") next = i - 7;
      else if (event.key === "Home") next = i - (i % 7);
      else if (event.key === "End") next = i - (i % 7) + 6;
      else if (event.key === "PageDown") {
        event.preventDefault();
        state.stepMonth(1);
        return;
      } else if (event.key === "PageUp") {
        event.preventDefault();
        state.stepMonth(-1);
        return;
      } else return;
      if (next < 0 || next > 41) return;
      event.preventDefault();
      const grid: any = event.currentTarget;
      const el = grid.querySelector('[data-idx="' + next + '"]');
      if (el) el.focus();
    },
  });

  return (
    <div
      {...ptAttrs(props.pt, "root")}
      data-part="root"
      class={ptClass(props.pt, props.unstyled, "cr-calendar", "root")}
      style={ptStyle(props.pt, props.dt, "root")}
    >
      <div {...ptAttrs(props.pt, "header")} data-part="header" class={ptClass(props.pt, props.unstyled, "cr-calendar__header", "header")}>
        <button
          {...ptAttrs(props.pt, "prev")}
          type="button"
          data-part="prev"
          class={ptClass(props.pt, props.unstyled, "cr-calendar__nav", "prev")}
          aria-label="Previous month"
          onClick={() => state.stepMonth(-1)}
        >
          <span aria-hidden="true">◂</span>
        </button>
        <span class="cr-calendar__month" aria-live="polite">{state.monthLabel}</span>
        <button
          {...ptAttrs(props.pt, "next")}
          type="button"
          data-part="next"
          class={ptClass(props.pt, props.unstyled, "cr-calendar__nav", "next")}
          aria-label="Next month"
          onClick={() => state.stepMonth(1)}
        >
          <span aria-hidden="true">▸</span>
        </button>
      </div>

      <div
        {...ptAttrs(props.pt, "grid")}
        data-part="grid"
        class={ptClass(props.pt, props.unstyled, "cr-calendar__grid", "grid")}
        role="grid"
        aria-label={props.label || state.monthLabel}
        onKeyDown={(event) => state.onKey(event)}
      >
        <div class="cr-calendar__row cr-calendar__row--head" role="row">
          <For each={state.weekdays}>
            {(wd: string) => (
              <span
                {...ptAttrs(props.pt, "weekday")}
                data-part="weekday"
                class={ptClass(props.pt, props.unstyled, "cr-calendar__weekday", "weekday")}
                role="columnheader"
                aria-label={wd}
              >
                {wd}
              </span>
            )}
          </For>
        </div>
        <div class="cr-calendar__body" role="rowgroup">
          <For each={state.weeks}>
            {(week: CrCalendarDay[], w: number) => (
              <div class="cr-calendar__row" role="row">
                <For each={week}>
                  {(cell: CrCalendarDay, dow: number) => (
                    <button
                      {...ptAttrs(props.pt, "day")}
                      type="button"
                      data-part="day"
                      data-idx={w * 7 + dow}
                      data-state={props.value === cell.iso ? "selected" : cell.inMonth ? "in-month" : "adjacent"}
                      class={ptClass(
                        props.pt,
                        props.unstyled,
                        "cr-calendar__day" +
                          (cell.inMonth ? "" : " cr-calendar__day--adjacent") +
                          (props.value === cell.iso ? " cr-calendar__day--selected" : "") +
                          (props.today === cell.iso ? " cr-calendar__day--today" : ""),
                        "day"
                      )}
                      role="gridcell"
                      aria-selected={props.value === cell.iso ? "true" : "false"}
                      aria-current={props.today === cell.iso ? "date" : undefined}
                      aria-disabled={cell.disabled ? "true" : undefined}
                      aria-label={cell.iso}
                      disabled={cell.disabled}
                      tabIndex={state.tabbable(cell.iso, cell.inMonth, cell.day) ? 0 : -1}
                      onClick={() => state.pick(cell)}
                    >
                      {cell.day}
                    </button>
                  )}
                </For>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
