import { useStore, For, Show, useContext, onMount, onUpdate, onUnMount } from "@builder.io/mitosis";
import { ptAttrs, ptClass, ptHandler, ptResolve, ptStyle, resolveLocale, resolveMessage, ptHooks } from "../lib/pt.ts";
import type { CrPassThrough, CrDesignTokens } from "../lib/pt-types.ts";
import CrContext from "./cr.context.lite";

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
  /** First day of the week. Default "sunday". */
  weekStart?: "sunday" | "monday";
  /** Show the month dropdown + year stepper in the header. Default true. Set
   *  false for the bare prev/next header. */
  switcher?: boolean;
  /** Inclusive year range offered by the switcher, relative to the displayed
   *  year (never the clock). Default 8 — so the displayed year ±8. */
  yearSpan?: number;
  label?: string;
  onSelect?: (iso: string) => void;
  /** Fires with the new `YYYY-MM` when the month is stepped, or when the
   *  switcher's month dropdown / year stepper changes it. */
  onMonthChange?: (month: string) => void;
  /** Override this component's built-in English strings. Any key you omit falls
   *  back to the app-level `messages` from context, then to the built-in default.
   *  See lib/messages.ts for the keys. */
  labels?: Record<string, any>;
  /** BCP-47 tag for month/weekday names (e.g. "it", "en-GB"). Falls back to the
   *  app-level `locale` from context, then "en". */
  locale?: string;
  /* ── styling contract (portable pt/dt subset — see references/styling-contract.md) ──
   * Parts: "root" · "header" · "prev" · "next" · "grid" · "weekday" · "day" ·
   * "monthSelect" · "yearSelect".
   * The selected accent is `--cr-calendar-selected-bg` (a state, Law 2). */
  unstyled?: boolean;
  pt?: CrPassThrough<
    | "day"
    | "grid"
    | "header"
    | "monthSelect"
    | "next"
    | "prev"
    | "root"
    | "weekday"
    | "yearSelect"
  >;
  dt?: CrDesignTokens;
}

/* Month and weekday names come from `Intl.DateTimeFormat`, never a table: it is in
 * every supported runtime, covers every locale, and needs no translation file. The
 * reference date is a FIXED UTC day (2021-01-03 is a Sunday) so weekday order is
 * derived, not read from a clock — the same SSR-determinism discipline the rest of
 * this component follows. Formatting lives in useStore getters because Mitosis
 * strips free consts from the compiled output (see CrTelemetry). */

/* A month calendar grid — WAI-ARIA `role="grid"` with weekday columnheaders and
 * day buttons, roving tabindex (←/→ ±1 day, ↑/↓ ±1 week, Home/End week ends,
 * PageUp/PageDown step months, Enter/Space select). Fully controlled and SSR-safe:
 * the displayed month and "today" are injected props, never read from the clock.
 * The header's month/year switcher is the same story — its year list is derived
 * from the DISPLAYED year, so it introduces no clock read either; every control
 * (prev, next, month dropdown, year dropdown) funnels through state.goTo and
 * emits onMonthChange with a `YYYY-MM`. Styling via .cr-calendar; data-part per part. */
export default function CrCalendar(props: CrCalendarProps) {
  const cr = useContext(CrContext);

  onMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrCalendar"));
    if (h && h.onMounted) h.onMounted();
  });
  onUpdate(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrCalendar"));
    if (h && h.onUpdated) h.onUpdated();
  });
  onUnMount(() => {
    const h = ptHooks(ptResolve(cr, props.pt, "CrCalendar"));
    if (h && h.onUnmounted) h.onUnmounted();
  });

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
      const fmt = new Intl.DateTimeFormat(resolveLocale(props.locale, cr && cr.locale), {
        month: "short",
        timeZone: "UTC",
      });
      return fmt.format(new Date(Date.UTC(v[0], v[1], 1))) + " " + v[0];
    },
    // "monday" → 1, anything else (incl. undefined) → 0 = Sunday.
    get firstDow(): number {
      return props.weekStart === "monday" ? 1 : 0;
    },
    get weekdays(): string[] {
      const ws = state.firstDow;
      const fmt = new Intl.DateTimeFormat(resolveLocale(props.locale, cr && cr.locale), {
        weekday: "short",
        timeZone: "UTC",
      });
      const out: string[] = [];
      /* 2021-01-03 is a Sunday; +i days walks the week from the configured start. */
      for (let i = 0; i < 7; i++) out.push(fmt.format(new Date(Date.UTC(2021, 0, 3 + ((i + ws) % 7)))));
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
      const ws = state.firstDow;
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
    get showSwitcher(): boolean {
      return props.switcher !== false;
    },
    get monthNames(): string[] {
      const fmt = new Intl.DateTimeFormat(resolveLocale(props.locale, cr && cr.locale), {
        month: "long",
        timeZone: "UTC",
      });
      const out: string[] = [];
      for (let i = 0; i < 12; i++) out.push(fmt.format(new Date(Date.UTC(2021, i, 1))));
      return out;
    },
    get viewYear(): number {
      return state.view[0];
    },
    get viewMonth(): number {
      return state.view[1];
    },
    // Years offered by the switcher, derived from the DISPLAYED year (never the
    // clock) and clamped to min/max when those bound the range.
    get years(): number[] {
      const span = props.yearSpan === undefined || props.yearSpan === null ? 8 : props.yearSpan;
      const y = state.viewYear;
      let lo = y - span;
      let hi = y + span;
      if (props.min) {
        const mn = parseInt(props.min.slice(0, 4), 10);
        if (mn && mn > lo) lo = mn;
      }
      if (props.max) {
        const mx = parseInt(props.max.slice(0, 4), 10);
        if (mx && mx < hi) hi = mx;
      }
      if (lo > y) lo = y;
      if (hi < y) hi = y;
      const out: number[] = [];
      for (let n = lo; n <= hi; n++) out.push(n);
      return out;
    },
    // The single emit point: normalise (y, m0) and fire onMonthChange.
    goTo(y: number, m0: number) {
      const d = new Date(y, m0, 1);
      const next = d.getFullYear() + "-" + state.pad(d.getMonth() + 1);
      if (props.onMonthChange) props.onMonthChange(next);
    },
    stepMonth(delta: number) {
      const v = state.view;
      state.goTo(v[0], v[1] + delta);
    },
    pickMonth(event: any) {
      const raw = event && event.target ? event.target.value : "";
      const m0 = parseInt(raw, 10);
      if (isNaN(m0)) return;
      state.goTo(state.viewYear, m0);
    },
    pickYear(event: any) {
      const raw = event && event.target ? event.target.value : "";
      const y = parseInt(raw, 10);
      if (isNaN(y)) return;
      state.goTo(y, state.viewMonth);
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
      {...ptAttrs(ptResolve(cr, props.pt, "CrCalendar"), "root")}
      data-part="root"
      class={ptClass(ptResolve(cr, props.pt, "CrCalendar"), props.unstyled, "cr-calendar", "root")}
      style={ptStyle(ptResolve(cr, props.pt, "CrCalendar"), props.dt, "root")}
    >
      <div {...ptAttrs(ptResolve(cr, props.pt, "CrCalendar"), "header")} data-part="header" class={ptClass(ptResolve(cr, props.pt, "CrCalendar"), props.unstyled, "cr-calendar__header", "header")}>
        <button
          {...ptAttrs(ptResolve(cr, props.pt, "CrCalendar"), "prev")}
          type="button"
          data-part="prev"
          class={ptClass(ptResolve(cr, props.pt, "CrCalendar"), props.unstyled, "cr-calendar__nav", "prev")}
          aria-label={resolveMessage(cr, props.labels, "CrCalendar", "prevMonth")}
          onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrCalendar'), 'prev', 'onClick', event); state.stepMonth(-1); }}
        >
          <span aria-hidden="true">◂</span>
        </button>
        <Show when={state.showSwitcher}>
          <span class="cr-calendar__switcher">
            <select
              {...ptAttrs(ptResolve(cr, props.pt, "CrCalendar"), "monthSelect")}
              data-part="monthSelect"
              class={ptClass(ptResolve(cr, props.pt, "CrCalendar"), props.unstyled, "cr-calendar__select cr-calendar__select--month", "monthSelect")}
              aria-label={resolveMessage(cr, props.labels, "CrCalendar", "month")}
              value={state.viewMonth}
              onChange={(event) => state.pickMonth(event)}
            >
              <For each={state.monthNames}>
                {(name: string, i: number) => (
                  <option value={i} selected={i === state.viewMonth}>
                    {name}
                  </option>
                )}
              </For>
            </select>
            <select
              {...ptAttrs(ptResolve(cr, props.pt, "CrCalendar"), "yearSelect")}
              data-part="yearSelect"
              class={ptClass(ptResolve(cr, props.pt, "CrCalendar"), props.unstyled, "cr-calendar__select cr-calendar__select--year", "yearSelect")}
              aria-label={resolveMessage(cr, props.labels, "CrCalendar", "year")}
              value={state.viewYear}
              onChange={(event) => state.pickYear(event)}
            >
              <For each={state.years}>
                {(y: number) => (
                  <option value={y} selected={y === state.viewYear}>
                    {y}
                  </option>
                )}
              </For>
            </select>
            <span class="cr-calendar__month cr-calendar__month--sr" aria-live="polite">{state.monthLabel}</span>
          </span>
        </Show>
        <Show when={!state.showSwitcher}>
          <span class="cr-calendar__month" aria-live="polite">{state.monthLabel}</span>
        </Show>
        <button
          {...ptAttrs(ptResolve(cr, props.pt, "CrCalendar"), "next")}
          type="button"
          data-part="next"
          class={ptClass(ptResolve(cr, props.pt, "CrCalendar"), props.unstyled, "cr-calendar__nav", "next")}
          aria-label={resolveMessage(cr, props.labels, "CrCalendar", "nextMonth")}
          onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrCalendar'), 'next', 'onClick', event); state.stepMonth(1); }}
        >
          <span aria-hidden="true">▸</span>
        </button>
      </div>

      <div
        {...ptAttrs(ptResolve(cr, props.pt, "CrCalendar"), "grid")}
        data-part="grid"
        class={ptClass(ptResolve(cr, props.pt, "CrCalendar"), props.unstyled, "cr-calendar__grid", "grid")}
        role="grid"
        aria-label={props.label || state.monthLabel}
        onKeyDown={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrCalendar'), 'grid', 'onKeyDown', event); state.onKey(event); }}
      >
        <div class="cr-calendar__row cr-calendar__row--head" role="row">
          <For each={state.weekdays}>
            {(wd: string) => (
              <span
                {...ptAttrs(ptResolve(cr, props.pt, "CrCalendar"), "weekday")}
                data-part="weekday"
                class={ptClass(ptResolve(cr, props.pt, "CrCalendar"), props.unstyled, "cr-calendar__weekday", "weekday")}
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
                      {...ptAttrs(ptResolve(cr, props.pt, "CrCalendar"), "day")}
                      type="button"
                      data-part="day"
                      data-idx={w * 7 + dow}
                      data-state={props.value === cell.iso ? "selected" : cell.inMonth ? "in-month" : "adjacent"}
                      class={ptClass(
                        ptResolve(cr, props.pt, "CrCalendar"),
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
                      onClick={(event) => { ptHandler(ptResolve(cr, props.pt, 'CrCalendar'), 'day', 'onClick', event); state.pick(cell); }}
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
