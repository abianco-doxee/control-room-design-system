// Timezone-aware time-axis tick generation for the chart family.
//
// Pure ESM, no dependencies — it uses the built-in Intl time-zone database, so
// day / week / month / year ticks land on real calendar boundaries in a given
// IANA zone (DST included), not on fixed millisecond multiples. Small spans fall
// back to clock ticks (…30s · 1m · 1h…).
//
// Options let the calendar be expressed the way a team reads it:
//   • locale       "en" | "it"      — month-name language (day-first either way)
//   • week         "date" | "iso"   — weekly ticks as "3 Mar" or ISO "W10"
//   • fiscalStart  1..12            — fiscal year/quarter anchor (1 = calendar).
//                                     Years/quarters then align to that month and
//                                     label FY/Q, FY named by the ending year.
//   • format       (value)=>string  — escape hatch: relabel the chosen tick
//                                     positions; wins over locale/week/fiscal.
// Defaults ("en" / "date" / 1, no format) reproduce a plain Gregorian axis.
//
// The SAME algorithm is mirrored inline in @control-room/components'
// CrLineChart.lite.tsx (Mitosis compiles to six targets and doesn't import runtime
// helpers into each), exactly like this package's position.js ↔ CrPopover. Keep the
// two in sync; tests/time-scale.test.mjs guards this module.

const S = 1000,
  MIN = 60 * S,
  HR = 60 * MIN,
  DAY = 24 * HR;
const MON = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  it: ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"],
};
const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const pad = (n) => (n < 10 ? "0" + n : "" + n);
const clampInt = (v, lo, hi, dflt) => {
  const n = Math.round(+v);
  if (!isFinite(n)) return dflt;
  return n < lo ? lo : n > hi ? hi : n;
};

// Calendar parts of an instant as read in `zone` (month 1-12).
function zoneParts(ms, zone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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
}

function weekday(ms, zone) {
  const s = new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short" }).format(
    new Date(ms)
  );
  return WD[s] || 0;
}

// zone offset (ms) at an instant: how far the wall clock leads UTC.
function offsetAt(ms, zone) {
  const p = zoneParts(ms, zone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - ms;
}

// The epoch-ms whose wall clock in `zone` is the given calendar time (mo 0-based).
// Two offset reads converge across DST edges. Date.UTC normalises overflow
// (day 0, month 13, day -3 …) so callers can add raw calendar deltas.
function zonedToEpoch(y, mo, d, h, mi, s, zone) {
  const guess = Date.UTC(y, mo, d, h, mi, s);
  const ep = guess - offsetAt(guess, zone);
  return guess - offsetAt(ep, zone);
}

// Fiscal year identified by the calendar year it *ends* in.
function fyEnd(year, month, start) {
  return month >= start ? year + 1 : year;
}
// 1-based fiscal quarter of a (1-12) month given the fiscal start month.
function quarterOf(month, start) {
  return Math.floor(((month - 1 - (start - 1) + 12) % 12) / 3) + 1;
}

// ISO-8601 week number + week-year for a Gregorian date (mo 0-based).
function isoWeek(y, mo, d) {
  const date = new Date(Date.UTC(y, mo, d));
  const dayNr = (date.getUTCDay() + 6) % 7; // Mon=0
  date.setUTCDate(date.getUTCDate() - dayNr + 3); // Thursday of this week
  const isoYear = date.getUTCFullYear();
  const firstThu = new Date(Date.UTC(isoYear, 0, 4));
  firstThu.setUTCDate(firstThu.getUTCDate() - ((firstThu.getUTCDay() + 6) % 7) + 3);
  const week = 1 + Math.round((date.getTime() - firstThu.getTime()) / (7 * DAY));
  return { week, year: isoYear };
}

function fmtClock(ms, zone, withSec) {
  const p = zoneParts(ms, zone);
  return pad(p.hour) + ":" + pad(p.minute) + (withSec ? ":" + pad(p.second) : "");
}

function label(ms, unit, step, o) {
  const p = zoneParts(ms, o.zone);
  const mon = MON[o.locale][p.month - 1];
  if (unit === "year") {
    return o.fiscalStart > 1
      ? "FY" + pad(fyEnd(p.year, p.month, o.fiscalStart) % 100)
      : "" + p.year;
  }
  if (unit === "month") {
    if (step === 3 && o.fiscalStart > 1) {
      const q = quarterOf(p.month, o.fiscalStart);
      return "Q" + q + (q === 1 ? " FY" + pad(fyEnd(p.year, p.month, o.fiscalStart) % 100) : "");
    }
    return o.fiscalStart === 1 && p.month === 1 ? mon + " '" + pad(p.year % 100) : mon;
  }
  if (unit === "week" && o.week === "iso") {
    const w = isoWeek(p.year, p.month - 1, p.day);
    return "W" + w.week + (w.week === 1 ? " '" + pad(w.year % 100) : "");
  }
  return p.day + " " + mon; // day, week (date)
}

const FIXED = [
  S,
  2 * S,
  5 * S,
  10 * S,
  15 * S,
  30 * S,
  MIN,
  2 * MIN,
  5 * MIN,
  10 * MIN,
  15 * MIN,
  30 * MIN,
  HR,
  2 * HR,
  3 * HR,
  6 * HR,
  12 * HR,
];

function fixedTicks(lo, hi, step, zone) {
  const withSec = step < MIN;
  const ticks = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi && ticks.length < 1000; v += step) {
    ticks.push({ value: v, label: fmtClock(v, zone, withSec) });
  }
  return ticks;
}

function calTicks(lo, hi, unit, step, o) {
  const zone = o.zone,
    fs = o.fiscalStart;
  const p = zoneParts(lo, zone);
  let cy = p.year,
    cmo = p.month - 1,
    cd = p.day;
  if (unit === "year") {
    cmo = fs - 1;
    cd = 1;
    if (fs > 1 && p.month - 1 < fs - 1) cy = cy - 1; // fiscal year started last calendar year
    cy = Math.floor(cy / step) * step;
  } else if (unit === "month") {
    const off = (fs - 1) % step; // fiscal-quarter phase
    cmo = Math.floor((p.month - 1 - off) / step) * step + off;
    cd = 1;
  }
  let cur = zonedToEpoch(cy, cmo, cd, 0, 0, 0, zone);
  if (unit === "week") {
    const back = (weekday(cur, zone) + 6) % 7; // days since Monday
    cur = zonedToEpoch(cy, cmo, cd - back, 0, 0, 0, zone);
  }
  const ticks = [];
  let guard = 0;
  while (cur <= hi && guard < 5000) {
    if (cur >= lo) ticks.push({ value: cur, label: label(cur, unit, step, o) });
    const q = zoneParts(cur, zone);
    if (unit === "year") cur = zonedToEpoch(q.year + step, fs - 1, 1, 0, 0, 0, zone);
    else if (unit === "month") cur = zonedToEpoch(q.year, q.month - 1 + step, 1, 0, 0, 0, zone);
    else if (unit === "week") cur = zonedToEpoch(q.year, q.month - 1, q.day + 7, 0, 0, 0, zone);
    else cur = zonedToEpoch(q.year, q.month - 1, q.day + step, 0, 0, 0, zone);
    guard++;
  }
  return ticks;
}

/**
 * Ticks for a time domain [lo, hi] (epoch-ms), each `{ value, label }`.
 * Granularity auto-scales to the span: clock ticks under ~a day, then calendar
 * day / week / month / year boundaries computed in `opts.zone` (IANA, default
 * "UTC"). `opts.target` (~6) is the desired tick count. `opts.locale`,
 * `opts.week`, and `opts.fiscalStart` shape the labels (see file header).
 */
export function timeTicks(lo, hi, opts = {}) {
  const o = {
    zone: opts.zone || "UTC",
    locale: opts.locale === "it" ? "it" : "en",
    week: opts.week === "iso" ? "iso" : "date",
    fiscalStart: clampInt(opts.fiscalStart, 1, 12, 1),
  };
  const target = opts.target || 6;
  // `format` is the escape hatch: it relabels the chosen tick *positions*, taking
  // precedence over locale/week/fiscal (which only shape the built-in text).
  const fmt = typeof opts.format === "function" ? opts.format : null;
  const fin = (arr) => (fmt ? arr.map((t) => ({ value: t.value, label: fmt(t.value) })) : arr);
  let a = lo,
    b = hi;
  if (b <= a) b = a + S;
  const span = b - a;
  for (const st of FIXED) if (span / st <= target) return fin(fixedTicks(a, b, st, o.zone));
  for (const nd of [1, 2])
    if (span / (nd * DAY) <= target) return fin(calTicks(a, b, "day", nd, o));
  if (span / (7 * DAY) <= target) return fin(calTicks(a, b, "week", 1, o));
  for (const nm of [1, 3])
    if (span / (nm * 30.4 * DAY) <= target) return fin(calTicks(a, b, "month", nm, o));
  for (const ny of [1, 2, 5, 10, 25, 50, 100])
    if (span / (ny * 365 * DAY) <= target) return fin(calTicks(a, b, "year", ny, o));
  return fin(calTicks(a, b, "year", 500, o));
}
