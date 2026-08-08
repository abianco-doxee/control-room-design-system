// Unit tests for the timezone-aware time-axis tick generator (node:test).
// Run: npm run test:timescale
import { test } from "node:test";
import assert from "node:assert/strict";
import { timeTicks } from "../utils/time-scale.js";

const DAY = 24 * 3600 * 1000;
// Read an instant's wall-clock parts in a zone (mirrors the module's helper).
function parts(ms, zone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: zone, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
  const o = {};
  for (const p of dtf.formatToParts(new Date(ms))) if (p.type !== "literal") o[p.type] = +p.value;
  return o;
}

test("sub-day span → clock ticks (HH:MM), aligned and in range", () => {
  const lo = Date.UTC(2026, 0, 1, 9, 3, 0);
  const hi = Date.UTC(2026, 0, 1, 11, 40, 0);
  const ticks = timeTicks(lo, hi, { zone: "UTC", target: 6 });
  assert.ok(ticks.length >= 2, "several ticks");
  for (const t of ticks) {
    assert.ok(t.value >= lo && t.value <= hi, "in range");
    assert.match(t.label, /^\d{2}:\d{2}$/, `clock label ${t.label}`);
  }
});

test("multi-week span → weekly ticks on local Mondays", () => {
  const lo = Date.UTC(2026, 0, 1);
  const hi = lo + 28 * DAY;
  const ticks = timeTicks(lo, hi, { zone: "UTC", target: 6 });
  assert.ok(ticks.length >= 3 && ticks.length <= 8, `~weekly count: ${ticks.length}`);
  for (const t of ticks) {
    const wd = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(new Date(t.value));
    assert.equal(wd, "Mon", `tick on Monday, got ${wd}`);
    assert.equal(parts(t.value, "UTC").hour, 0, "at local midnight");
  }
});

test("multi-month span → monthly ticks on the 1st at local midnight", () => {
  const lo = Date.UTC(2025, 0, 15);
  const hi = Date.UTC(2025, 4, 20); // ~4 months
  const ticks = timeTicks(lo, hi, { zone: "UTC", target: 6 });
  assert.ok(ticks.length >= 3, `several months: ${ticks.length}`);
  for (const t of ticks) {
    const p = parts(t.value, "UTC");
    assert.equal(p.day, 1, "first of month");
    assert.equal(p.hour, 0, "local midnight");
  }
  assert.deepEqual(ticks.map((t) => t.label.replace(/ '\d\d/, "")), ["Feb", "Mar", "Apr", "May"]);
});

test("multi-year span → yearly ticks labelled with the full year", () => {
  const lo = Date.UTC(2021, 5, 1);
  const hi = Date.UTC(2025, 5, 1);
  const ticks = timeTicks(lo, hi, { zone: "UTC", target: 6 });
  for (const t of ticks) {
    const p = parts(t.value, "UTC");
    assert.equal(p.month, 1, "January");
    assert.equal(p.day, 1, "the 1st");
    assert.match(t.label, /^\d{4}$/, `year label ${t.label}`);
  }
});

test("calendar boundaries are computed in the target zone, not UTC", () => {
  // A fixed +5h zone (no DST): local midnight is 19:00 UTC the previous day.
  const lo = Date.UTC(2026, 0, 1);
  const hi = lo + 6 * DAY;
  const ticks = timeTicks(lo, hi, { zone: "Etc/GMT-5", target: 8 });
  assert.ok(ticks.length >= 3);
  for (const t of ticks) {
    assert.equal(parts(t.value, "Etc/GMT-5").hour, 0, "midnight in +5 zone");
    // and NOT midnight UTC
    assert.equal(parts(t.value, "UTC").hour, 19, "19:00 UTC ↔ 00:00 +5");
  }
});

test("DST transition: day ticks stay on local midnight across the spring shift", () => {
  // Europe/Rome springs forward on 2025-03-30 (02:00 → 03:00).
  const lo = Date.UTC(2025, 2, 28);
  const hi = Date.UTC(2025, 3, 2);
  const ticks = timeTicks(lo, hi, { zone: "Europe/Rome", target: 8 });
  assert.ok(ticks.length >= 3, "a few daily ticks across the DST edge");
  for (const t of ticks) {
    assert.equal(parts(t.value, "Europe/Rome").hour, 0, `local midnight, got ${parts(t.value, "Europe/Rome").hour}`);
  }
});
