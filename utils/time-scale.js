// Timezone-aware time-axis tick generation for the chart family.
//
// Pure ESM, no dependencies — it uses the built-in Intl time-zone database, so
// day / week / month / year ticks land on real calendar boundaries in a given
// IANA zone (DST included), not on fixed millisecond multiples. Small spans fall
// back to clock ticks (…30s · 1m · 1h…).
//
// The SAME algorithm is mirrored inline in components/CrLineChart.lite.tsx
// (Mitosis compiles to six targets and doesn't import runtime helpers into each),
// exactly like utils/position.js ↔ CrPopover. Keep the two in sync;
// tests/time-scale.test.mjs guards this module.

const S = 1000, MIN = 60 * S, HR = 60 * MIN, DAY = 24 * HR;
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const pad = (n) => (n < 10 ? "0" + n : "" + n);

// Calendar parts of an instant as read in `zone` (month 1-12).
function zoneParts(ms, zone) {
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
}

function weekday(ms, zone) {
  const s = new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short" }).format(new Date(ms));
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

function fmtClock(ms, zone, withSec) {
  const p = zoneParts(ms, zone);
  return pad(p.hour) + ":" + pad(p.minute) + (withSec ? ":" + pad(p.second) : "");
}
function fmtCal(ms, unit, zone) {
  const p = zoneParts(ms, zone);
  const mon = MON[p.month - 1];
  if (unit === "year") return "" + p.year;
  if (unit === "month") return p.month === 1 ? mon + " '" + pad(p.year % 100) : mon;
  return p.day + " " + mon; // day, week
}

const FIXED = [S, 2 * S, 5 * S, 10 * S, 15 * S, 30 * S, MIN, 2 * MIN, 5 * MIN, 10 * MIN, 15 * MIN, 30 * MIN, HR, 2 * HR, 3 * HR, 6 * HR, 12 * HR];

function fixedTicks(lo, hi, step, zone) {
  const withSec = step < MIN;
  const ticks = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi && ticks.length < 1000; v += step) {
    ticks.push({ value: v, label: fmtClock(v, zone, withSec) });
  }
  return ticks;
}

function calTicks(lo, hi, unit, step, zone) {
  const p = zoneParts(lo, zone);
  let cy = p.year, cmo = p.month - 1, cd = p.day;
  if (unit === "year") { cy = Math.floor(cy / step) * step; cmo = 0; cd = 1; }
  else if (unit === "month") { cmo = Math.floor(cmo / step) * step; cd = 1; }
  let cur = zonedToEpoch(cy, cmo, cd, 0, 0, 0, zone);
  if (unit === "week") {
    const back = (weekday(cur, zone) + 6) % 7; // days since Monday
    cur = zonedToEpoch(cy, cmo, cd - back, 0, 0, 0, zone);
  }
  const ticks = [];
  let guard = 0;
  while (cur <= hi && guard < 5000) {
    if (cur >= lo) ticks.push({ value: cur, label: fmtCal(cur, unit, zone) });
    const q = zoneParts(cur, zone);
    if (unit === "year") cur = zonedToEpoch(q.year + step, 0, 1, 0, 0, 0, zone);
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
 * "UTC"). `opts.target` (~6) is the desired tick count.
 */
export function timeTicks(lo, hi, opts = {}) {
  const zone = opts.zone || "UTC";
  const target = opts.target || 6;
  let a = lo, b = hi;
  if (b <= a) b = a + S;
  const span = b - a;
  for (const st of FIXED) if (span / st <= target) return fixedTicks(a, b, st, zone);
  for (const nd of [1, 2]) if (span / (nd * DAY) <= target) return calTicks(a, b, "day", nd, zone);
  if (span / (7 * DAY) <= target) return calTicks(a, b, "week", 1, zone);
  for (const nm of [1, 3]) if (span / (nm * 30.4 * DAY) <= target) return calTicks(a, b, "month", nm, zone);
  for (const ny of [1, 2, 5, 10, 25, 50, 100]) if (span / (ny * 365 * DAY) <= target) return calTicks(a, b, "year", ny, zone);
  return calTicks(a, b, "year", 500, zone);
}
