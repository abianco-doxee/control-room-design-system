import { useStore, Show, For } from "@builder.io/mitosis";

export interface CrLineSeries {
  name: string;
  data: number[];
  /** Signal tone; omit to take the next categorical hue in fixed order. */
  signal?: "work" | "wait" | "done" | "err" | "idle" | "accent" | "accent2";
}

export interface CrLineChartProps {
  series: CrLineSeries[];
  /** X-axis tick labels for the categorical (index) x-axis, drawn left→right. */
  labels?: string[];
  /** Continuous x-values, parallel to each sample index. Switches the x-axis to a
   *  real linear/time scale: points sit at their value and nice ticks are derived. */
  x?: number[];
  /** Treat `x` as epoch-ms: ticks snap to calendar boundaries (clock → day → week
   *  → month → year by span) computed in `xZone`, so multi-week/month charts get
   *  real date ticks, not fixed-millisecond marks. */
  xTime?: boolean;
  /** IANA time zone for the calendar x-axis (e.g. "Europe/Rome"). Default "UTC". */
  xZone?: string;
  /** Month-name language for calendar ticks: "en" (default) or "it". */
  xLocale?: string;
  /** Weekly ticks as dates ("3 Mar", default) or ISO week numbers ("W10"). */
  xWeek?: string;
  /** Fiscal year start month 1–12 (default 1 = calendar). Year/quarter ticks then
   *  anchor to it and label FY/Q (FY named by the ending calendar year). */
  xFiscalStart?: number;
  /** Force the y-scale; otherwise a "nice" scale is derived from the data. */
  min?: number;
  max?: number;
  /** viewBox height (aspect); the plot scales to its container width. */
  height?: number;
  /** Fill under each line with a faint tint. */
  area?: boolean;
  /** Show the numbered y-axis (nice ticks + gridlines). Default true. */
  axis?: boolean;
  /** Suffix appended to each y-tick label (e.g. "ms", "%"). */
  unit?: string;
  /** Accessible name for the whole figure. */
  label?: string;
}

/* A time-series line chart: recessive gridlines, crisp non-scaling 2px lines,
 * a data-end dot per series, a numbered y-axis, and an interactive legend
 * (identity is never colour-alone — a legend is present for ≥2 series). One
 * y-axis only, ever. The x-axis is categorical (evenly-spaced `labels`) by
 * default, or a real continuous/time scale when `x` values are supplied — points
 * then sit at their value and nice ticks (round clock intervals under `xTime`)
 * are derived. Clicking a legend key isolates/restores that series (the y-scale
 * refits to what's visible). Pointer over the plot snaps a crosshair to the
 * nearest sample and reads every visible series' value into a top-docked tooltip
 * (progressive enhancement — the spoken summary still carries the data for AT).
 *
 * Everything that reads the hovered index or the hidden set is a METHOD (a getter
 * would run before the store is initialised on Qwik). Series take a signal tone,
 * or the next hue in a FIXED categorical order (never cycled) — colour follows
 * the entity, not its rank. */
export default function CrLineChart(props: CrLineChartProps) {
  const state = useStore({
    hovering: false,
    at: 0,
    hidden: {} as { [k: string]: boolean },
    hue(sig: string | undefined, i: number): string {
      const order = ["work", "accent-2", "accent", "wait", "done"];
      const key = sig ? (sig === "accent2" ? "accent-2" : sig) : order[i % order.length];
      return "var(--sig-" + key + ")";
    },
    /* A "nice" magnitude (1/2/5 x 10^k) for axis steps and extents. */
    niceNum(range: number, round: boolean): number {
      const exp = Math.floor(Math.log10(range));
      const f = range / Math.pow(10, exp);
      let nf: number;
      if (round) {
        if (f < 1.5) nf = 1; else if (f < 3) nf = 2; else if (f < 7) nf = 5; else nf = 10;
      } else {
        if (f <= 1) nf = 1; else if (f <= 2) nf = 2; else if (f <= 5) nf = 5; else nf = 10;
      }
      return nf * Math.pow(10, exp);
    },
    /* Round a data domain out to whole tick steps and list the ticks. */
    niceScale(lo: number, hi: number, maxTicks: number) {
      let a = lo;
      let b = hi;
      if (b <= a) b = a + 1;
      const range = state.niceNum(b - a, false);
      const step = state.niceNum(range / (maxTicks - 1), true);
      const niceLo = Math.floor(a / step) * step;
      const niceHi = Math.ceil(b / step) * step;
      const ticks: number[] = [];
      for (let v = niceLo; v <= niceHi + step * 0.5; v += step) ticks.push(Math.round(v / step) * step);
      return { min: niceLo, max: niceHi, ticks };
    },
    /* Compact, human tick labels: 1500 -> "1.5k", 2000000 -> "2M". */
    fmtTick(v: number): string {
      const a = Math.abs(v);
      if (a >= 1000000) return (Math.round(v / 100000) / 10) + "M";
      if (a >= 1000) return (Math.round(v / 100) / 10) + "k";
      return String(Math.round(v * 100) / 100);
    },
    /* ── Timezone-aware time axis. Same algorithm as utils/time-scale.js (mirrored
     * inline because Mitosis doesn't import runtime helpers into each target).
     * Day/week/month/year ticks land on real calendar boundaries in `zone`
     * (DST included) via the built-in Intl zone database; small spans fall back
     * to clock ticks. ─────────────────────────────────────────────────────── */
    z2(n: number): string { return n < 10 ? "0" + n : "" + n; },
    zoneParts(ms: number, zone: string): any {
      const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: zone, hourCycle: "h23",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      });
      const out = { year: 0, month: 1, day: 1, hour: 0, minute: 0, second: 0 };
      for (const p of dtf.formatToParts(new Date(ms))) {
        if (p.type === "year") out.year = +p.value;
        else if (p.type === "month") out.month = +p.value;
        else if (p.type === "day") out.day = +p.value;
        else if (p.type === "hour") out.hour = +p.value % 24;
        else if (p.type === "minute") out.minute = +p.value;
        else if (p.type === "second") out.second = +p.value;
      }
      return out;
    },
    zWeekday(ms: number, zone: string): number {
      const s = new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short" }).format(new Date(ms));
      const wd: any = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return wd[s] || 0;
    },
    zOffset(ms: number, zone: string): number {
      const p = state.zoneParts(ms, zone);
      return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - ms;
    },
    zEpoch(y: number, mo: number, d: number, h: number, mi: number, s: number, zone: string): number {
      const guess = Date.UTC(y, mo, d, h, mi, s);
      const ep = guess - state.zOffset(guess, zone);
      return guess - state.zOffset(ep, zone);
    },
    fmtClock(ms: number, zone: string, withSec: boolean): string {
      const p = state.zoneParts(ms, zone);
      return state.z2(p.hour) + ":" + state.z2(p.minute) + (withSec ? ":" + state.z2(p.second) : "");
    },
    monNames(locale: string): string[] {
      if (locale === "it") return ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
      return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    },
    fyEnd(year: number, month: number, start: number): number { return month >= start ? year + 1 : year; },
    quarterOf(month: number, start: number): number { return Math.floor(((month - 1 - (start - 1) + 12) % 12) / 3) + 1; },
    isoWeek(y: number, mo: number, d: number): { week: number; year: number } {
      const date = new Date(Date.UTC(y, mo, d));
      const dayNr = (date.getUTCDay() + 6) % 7;
      date.setUTCDate(date.getUTCDate() - dayNr + 3);
      const isoYear = date.getUTCFullYear();
      const firstThu = new Date(Date.UTC(isoYear, 0, 4));
      firstThu.setUTCDate(firstThu.getUTCDate() - ((firstThu.getUTCDay() + 6) % 7) + 3);
      const week = 1 + Math.round((date.getTime() - firstThu.getTime()) / (7 * 24 * 3600 * 1000));
      return { week, year: isoYear };
    },
    calLabel(ms: number, unit: string, step: number, zone: string, locale: string, week: string, fs: number): string {
      const p = state.zoneParts(ms, zone);
      const mon = state.monNames(locale)[p.month - 1];
      if (unit === "year") return fs > 1 ? "FY" + state.z2(state.fyEnd(p.year, p.month, fs) % 100) : "" + p.year;
      if (unit === "month") {
        if (step === 3 && fs > 1) {
          const q = state.quarterOf(p.month, fs);
          return "Q" + q + (q === 1 ? " FY" + state.z2(state.fyEnd(p.year, p.month, fs) % 100) : "");
        }
        return fs === 1 && p.month === 1 ? mon + " '" + state.z2(p.year % 100) : mon;
      }
      if (unit === "week" && week === "iso") {
        const w = state.isoWeek(p.year, p.month - 1, p.day);
        return "W" + w.week + (w.week === 1 ? " '" + state.z2(w.year % 100) : "");
      }
      return p.day + " " + mon;
    },
    /* A fuller stamp for the hover tooltip's x-label. */
    fmtStamp(ms: number, zone: string, locale: string): string {
      const p = state.zoneParts(ms, zone);
      return p.day + " " + state.monNames(locale)[p.month - 1] + " " + state.z2(p.hour) + ":" + state.z2(p.minute);
    },
    timeTicks(lo: number, hi: number, zone: string, target: number, locale: string, week: string, fs: number): { value: number; label: string }[] {
      const S = 1000, MIN = 60 * S, HR = 60 * MIN, DAY = 24 * HR;
      const FIXED = [S, 2 * S, 5 * S, 10 * S, 15 * S, 30 * S, MIN, 2 * MIN, 5 * MIN, 10 * MIN, 15 * MIN, 30 * MIN, HR, 2 * HR, 3 * HR, 6 * HR, 12 * HR];
      let a = lo, b = hi;
      if (b <= a) b = a + S;
      const span = b - a;
      const out: { value: number; label: string }[] = [];
      for (const st of FIXED) {
        if (span / st <= target) {
          const withSec = st < MIN;
          for (let v = Math.ceil(a / st) * st; v <= b && out.length < 1000; v += st) out.push({ value: v, label: state.fmtClock(v, zone, withSec) });
          return out;
        }
      }
      let unit = "year";
      let step = 500;
      if (span / DAY <= target) { unit = "day"; step = 1; }
      else if (span / (2 * DAY) <= target) { unit = "day"; step = 2; }
      else if (span / (7 * DAY) <= target) { unit = "week"; step = 1; }
      else if (span / (30.4 * DAY) <= target) { unit = "month"; step = 1; }
      else if (span / (3 * 30.4 * DAY) <= target) { unit = "month"; step = 3; }
      else {
        const years = [1, 2, 5, 10, 25, 50, 100];
        step = years[years.length - 1];
        for (const ny of years) { if (span / (ny * 365 * DAY) <= target) { step = ny; break; } }
        unit = "year";
      }
      const p0 = state.zoneParts(a, zone);
      let cy = p0.year, cmo = p0.month - 1, cd = p0.day;
      if (unit === "year") {
        cmo = fs - 1; cd = 1;
        if (fs > 1 && p0.month - 1 < fs - 1) cy = cy - 1;
        cy = Math.floor(cy / step) * step;
      } else if (unit === "month") {
        const off = (fs - 1) % step;
        cmo = Math.floor((p0.month - 1 - off) / step) * step + off;
        cd = 1;
      }
      let cur = state.zEpoch(cy, cmo, cd, 0, 0, 0, zone);
      if (unit === "week") {
        const back = (state.zWeekday(cur, zone) + 6) % 7;
        cur = state.zEpoch(cy, cmo, cd - back, 0, 0, 0, zone);
      }
      let guard = 0;
      while (cur <= b && guard < 5000) {
        if (cur >= a) out.push({ value: cur, label: state.calLabel(cur, unit, step, zone, locale, week, fs) });
        const q = state.zoneParts(cur, zone);
        if (unit === "year") cur = state.zEpoch(q.year + step, fs - 1, 1, 0, 0, 0, zone);
        else if (unit === "month") cur = state.zEpoch(q.year, q.month - 1 + step, 1, 0, 0, 0, zone);
        else if (unit === "week") cur = state.zEpoch(q.year, q.month - 1, q.day + 7, 0, 0, 0, zone);
        else cur = state.zEpoch(q.year, q.month - 1, q.day + step, 0, 0, 0, zone);
        guard++;
      }
      return out;
    },
    isHidden(i: number): boolean {
      return !!state.hidden["" + i];
    },
    toggle(i: number) {
      const next: { [k: string]: boolean } = {};
      for (const k in state.hidden) next[k] = state.hidden[k];
      next["" + i] = !next["" + i];
      state.hidden = next;
    },
    metrics() {
      const series = props.series || [];
      const axis = props.axis !== false;
      const W = 320;
      const H = props.height || 140;
      const L = axis ? 30 : 8;
      const R = 8;
      const T = 10;
      const xs = props.x && props.x.length ? props.x : null;
      const continuous = !!xs;
      const B = 18;
      const plotW = W - L - R;
      const plotH = H - T - B;
      let n = 0;
      for (const s of series) if ((s.data || []).length > n) n = (s.data || []).length;
      let lo = props.min;
      let hi = props.max;
      if (lo === undefined || hi === undefined) {
        let dlo = Infinity;
        let dhi = -Infinity;
        for (let si = 0; si < series.length; si++) {
          if (state.isHidden(si)) continue;
          for (const v of series[si].data || []) {
            if (v < dlo) dlo = v;
            if (v > dhi) dhi = v;
          }
        }
        if (!isFinite(dlo)) { dlo = 0; dhi = 1; }
        if (lo === undefined) lo = dlo;
        if (hi === undefined) hi = dhi;
      }
      const forced = props.min !== undefined && props.max !== undefined;
      const sc = state.niceScale(lo, hi, 5);
      const min = forced ? lo : sc.min;
      const max = forced ? hi : sc.max;
      const range = max - min || 1;
      const ticks: number[] = [];
      for (const t of sc.ticks) if (t >= min - range * 1e-6 && t <= max + range * 1e-6) ticks.push(t);
      let xmin = 0;
      let xmax = 1;
      const xticks: { v: number; label: string }[] = [];
      if (xs) {
        let xlo = Infinity;
        let xhi = -Infinity;
        for (const v of xs) { if (v < xlo) xlo = v; if (v > xhi) xhi = v; }
        if (!isFinite(xlo)) { xlo = 0; xhi = 1; }
        xmin = xlo;
        xmax = xhi;
        const xspan = (xhi - xlo) || 1;
        if (props.xTime) {
          const tt = state.timeTicks(xlo, xhi, props.xZone || "UTC", 6, props.xLocale || "en", props.xWeek || "date", props.xFiscalStart || 1);
          for (const t of tt) if (t.value >= xlo - xspan * 1e-6 && t.value <= xhi + xspan * 1e-6) xticks.push({ v: t.value, label: t.label });
        } else {
          for (const t of state.niceScale(xlo, xhi, 5).ticks) if (t >= xlo - xspan * 1e-6 && t <= xhi + xspan * 1e-6) xticks.push({ v: t, label: state.fmtTick(t) });
        }
      }
      return { W, H, L, R, T, B, plotW, plotH, n, min, max, range, axis, ticks, xs, continuous, xmin, xmax, xticks };
    },
    geo() {
      const m = state.metrics();
      const series = props.series || [];
      const xs = m.xs || [];
      const xspan = (m.xmax - m.xmin) || 1;
      const yAt = (v: number) => m.T + (1 - (v - m.min) / m.range) * m.plotH;
      const xAtV = (v: number) => m.L + ((v - m.xmin) / xspan) * m.plotW;
      const xAtI = (i: number, n: number) => m.L + (n <= 1 ? m.plotW / 2 : (i / (n - 1)) * m.plotW);
      const lines = series.map((s: CrLineSeries, si: number) => {
        const d = s.data || [];
        const lim = m.continuous ? Math.min(d.length, xs.length) : d.length;
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < lim; i++) pts.push({ x: m.continuous ? xAtV(xs[i]) : xAtI(i, lim), y: yAt(d[i]) });
        const line = pts.map((p: { x: number; y: number }) => p.x.toFixed(2) + "," + p.y.toFixed(2)).join(" ");
        let area = "";
        if (pts.length) {
          area = "M " + pts[0].x.toFixed(2) + "," + (m.T + m.plotH).toFixed(2);
          for (const p of pts) area += " L " + p.x.toFixed(2) + "," + p.y.toFixed(2);
          area += " L " + pts[pts.length - 1].x.toFixed(2) + "," + (m.T + m.plotH).toFixed(2) + " Z";
        }
        const end = pts.length ? pts[pts.length - 1] : { x: m.L, y: m.T };
        return { name: s.name, color: state.hue(s.signal, si), line, area, ex: end.x, ey: end.y, si, hidden: state.isHidden(si) };
      });
      const yticks = m.ticks.map((v: number) => ({ y: yAt(v), label: state.fmtTick(v) + (props.unit || "") }));
      const ticks = m.continuous
        ? m.xticks.map((tk: { v: number; label: string }) => ({ t: tk.label, x: xAtV(tk.v) }))
        : (props.labels || []).map((t: string, i: number, a: string[]) => ({ t, x: xAtI(i, a.length) }));
      return { W: m.W, H: m.H, L: m.L, R: m.R, axis: m.axis, continuous: m.continuous, plotTop: m.T, plotBot: m.T + m.plotH, lines, yticks, ticks };
    },
    summary(): string {
      const series = props.series || [];
      const parts = series.map((s: CrLineSeries) => {
        const d = s.data || [];
        return s.name + " latest " + (d.length ? d[d.length - 1] : "n/a");
      });
      return (props.label || "line chart") + " — " + parts.join(", ");
    },
    move(event: any) {
      const m = state.metrics();
      if (m.n < 1) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (!rect.width) return;
      const vbX = ((event.clientX - rect.left) / rect.width) * m.W;
      state.hovering = true;
      if (m.continuous && m.xs) {
        const xs = m.xs;
        const xspan = (m.xmax - m.xmin) || 1;
        let best = 0;
        let bd = Infinity;
        for (let i = 0; i < xs.length; i++) {
          const cx = m.L + ((xs[i] - m.xmin) / xspan) * m.plotW;
          const dd = Math.abs(cx - vbX);
          if (dd < bd) { bd = dd; best = i; }
        }
        state.at = best;
        return;
      }
      let frac = (vbX - m.L) / m.plotW;
      if (frac < 0) frac = 0;
      if (frac > 1) frac = 1;
      state.at = m.n <= 1 ? 0 : Math.round(frac * (m.n - 1));
    },
    leave() {
      state.hovering = false;
    },
    cursor() {
      const m = state.metrics();
      const idx = state.at;
      const series = props.series || [];
      const xs = m.xs || [];
      const xspan = (m.xmax - m.xmin) || 1;
      const cx = m.continuous
        ? (idx < xs.length ? m.L + ((xs[idx] - m.xmin) / xspan) * m.plotW : m.L)
        : m.L + (m.n <= 1 ? m.plotW / 2 : (idx / (m.n - 1)) * m.plotW);
      const rows = series
        .map((s: CrLineSeries, si: number) => {
          if (state.isHidden(si)) return null;
          const d = s.data || [];
          if (idx >= d.length) return null;
          const v = d[idx];
          return { name: s.name, color: state.hue(s.signal, si), value: v, cy: m.T + (1 - (v - m.min) / m.range) * m.plotH };
        })
        .filter((r: any) => r);
      let leftPct = (cx / m.W) * 100;
      if (leftPct < 12) leftPct = 12;
      if (leftPct > 88) leftPct = 88;
      const label = m.continuous
        ? (idx < xs.length ? (props.xTime ? state.fmtStamp(xs[idx], props.xZone || "UTC", props.xLocale || "en") : state.fmtTick(xs[idx])) : "")
        : ((props.labels || [])[idx] || "");
      return { cx, top: m.T, bot: m.T + m.plotH, leftPct, label, rows };
    },
  });

  return (
    <figure class="cr-chart cr-linechart">
      <div class="cr-linechart__graphic" role="img" aria-label={state.summary()}>
      <svg
        class="cr-linechart__plot"
        viewBox={"0 0 " + state.geo().W + " " + state.geo().H}
        aria-hidden="true"
        focusable="false"
        onMouseMove={(event) => state.move(event)}
        onMouseLeave={() => state.leave()}
      >
        <For each={state.geo().yticks}>
          {(g: { y: number; label: string }) => (
            <g>
              <line class="cr-chart__grid" x1={state.geo().L} y1={g.y} x2={state.geo().W - state.geo().R} y2={g.y} vector-effect="non-scaling-stroke" />
              <Show when={state.geo().axis}>
                <text class="cr-chart__ytick" x={state.geo().L - 5} y={g.y + 3} text-anchor="end">{g.label}</text>
              </Show>
            </g>
          )}
        </For>
        <For each={state.geo().ticks}>
          {(tk: { t: string; x: number }) => (
            <g>
              <Show when={state.geo().continuous}>
                <line class="cr-chart__grid cr-chart__grid--v" x1={tk.x} y1={state.geo().plotTop} x2={tk.x} y2={state.geo().plotBot} vector-effect="non-scaling-stroke" />
              </Show>
              <text class="cr-chart__tick" x={tk.x} y={state.geo().H - 5} text-anchor="middle">{tk.t}</text>
            </g>
          )}
        </For>
        <For each={state.geo().lines}>
          {(s: { name: string; color: string; line: string; area: string; ex: number; ey: number; si: number; hidden: boolean }) => (
            <g style={{ display: s.hidden ? "none" : "inline" }}>
              <Show when={props.area}>
                <path class="cr-linechart__area" d={s.area} style={{ fill: s.color }} />
              </Show>
              <polyline class="cr-linechart__line" points={s.line} style={{ stroke: s.color }} vector-effect="non-scaling-stroke" />
              <circle class="cr-linechart__end" cx={s.ex} cy={s.ey} r="2.6" style={{ fill: s.color }} vector-effect="non-scaling-stroke" />
            </g>
          )}
        </For>
        <Show when={state.hovering}>
          <line class="cr-chart__cross" x1={state.cursor().cx} y1={state.cursor().top} x2={state.cursor().cx} y2={state.cursor().bot} vector-effect="non-scaling-stroke" />
          <For each={state.cursor().rows}>
            {(r: { color: string; cy: number }) => <circle class="cr-chart__cursor" cx={state.cursor().cx} cy={r.cy} r="3.4" style={{ fill: r.color }} vector-effect="non-scaling-stroke" />}
          </For>
        </Show>
      </svg>
      <Show when={state.hovering}>
        <div class="cr-chart__tip" style={{ left: state.cursor().leftPct + "%" }} aria-hidden="true">
          <Show when={state.cursor().label}>
            <span class="cr-chart__tip-x">{state.cursor().label}</span>
          </Show>
          <For each={state.cursor().rows}>
            {(r: { name: string; color: string; value: number }) => (
              <span class="cr-chart__tip-row">
                <span class="cr-chart__tip-sw" style={{ background: r.color }}></span>
                <span class="cr-chart__tip-n">{r.name}</span>
                <span class="cr-chart__tip-v">{r.value}</span>
              </span>
            )}
          </For>
        </div>
      </Show>
      </div>
      <Show when={(props.series || []).length > 1}>
        <figcaption class="cr-chart__legend">
          <For each={state.geo().lines}>
            {(s: { name: string; color: string; si: number; hidden: boolean }) => (
              <button
                type="button"
                class={"cr-chart__key" + (s.hidden ? " cr-chart__key--off" : "")}
                aria-pressed={s.hidden ? "false" : "true"}
                onClick={() => state.toggle(s.si)}
              >
                <span class="cr-chart__sw" style={{ background: s.color }} aria-hidden="true"></span>
                {s.name}
              </button>
            )}
          </For>
        </figcaption>
      </Show>
    </figure>
  );
}
