// Unit tests for the timezone-aware time-axis tick generator (node:test).
// Run: npm run test:timescale

import assert from "node:assert/strict";
import { test } from "node:test";
import { timeTicks } from "@abianco-doxee/cr-utils/time-scale";

const DAY = 24 * 3600 * 1000;
// Read an instant's wall-clock parts in a zone (mirrors the module's helper).
function parts(ms, zone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
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
    const wd = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(
      new Date(t.value)
    );
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
  assert.deepEqual(
    ticks.map((t) => t.label.replace(/ '\d\d/, "")),
    ["Feb", "Mar", "Apr", "May"]
  );
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

test("locale: Italian month labels", () => {
  const lo = Date.UTC(2025, 0, 15);
  const hi = Date.UTC(2025, 4, 20);
  const ticks = timeTicks(lo, hi, { zone: "UTC", locale: "it" });
  assert.deepEqual(
    ticks.map((t) => t.label),
    ["feb", "mar", "apr", "mag"]
  );
});

test("week labels can be ISO week numbers (on Mondays)", () => {
  const lo = Date.UTC(2026, 0, 1);
  const hi = lo + 28 * DAY;
  const ticks = timeTicks(lo, hi, { zone: "UTC", week: "iso" });
  for (const t of ticks) {
    const wd = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(
      new Date(t.value)
    );
    assert.equal(wd, "Mon", "still on Mondays");
    assert.match(t.label, /^W\d+( '\d\d)?$/, `ISO week label ${t.label}`);
  }
  // 2026-01-01 is a Thursday → its Mondays are in ISO weeks 2, 3, …
  assert.equal(ticks[0].label.replace(/ '\d\d/, ""), "W2");
});

test("fiscalStart anchors year + quarter ticks and labels FY/Q (April start)", () => {
  // Fiscal year starting April; quarters Apr / Jul / Oct / Jan.
  const lo = Date.UTC(2024, 3, 1); // 1 Apr 2024
  const hi = Date.UTC(2025, 2, 31); // 31 Mar 2025 — one fiscal year
  const q = timeTicks(lo, hi, { zone: "UTC", fiscalStart: 4 });
  // ~12 months → quarterly ticks
  const months = q.map((t) =>
    new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short" }).format(new Date(t.value))
  );
  assert.deepEqual(months, ["Apr", "Jul", "Oct", "Jan"]);
  assert.deepEqual(
    q.map((t) => t.label),
    ["Q1 FY25", "Q2", "Q3", "Q4"]
  );

  // Multi-year → yearly ticks on 1 April, labelled by the ending FY.
  const y = timeTicks(Date.UTC(2022, 5, 1), Date.UTC(2025, 5, 1), { zone: "UTC", fiscalStart: 4 });
  for (const t of y) {
    const p = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(t.value));
    assert.equal(p, "04/01", "1 April");
    assert.match(t.label, /^FY\d\d$/, `FY label ${t.label}`);
  }
});

test("format escape hatch relabels the chosen tick positions", () => {
  const lo = Date.UTC(2025, 0, 15),
    hi = Date.UTC(2025, 4, 20);
  const base = timeTicks(lo, hi, { zone: "UTC" });
  const custom = timeTicks(lo, hi, {
    zone: "UTC",
    locale: "it",
    format: (v) => new Date(v).getUTCMonth() + 1 + "",
  });
  // same positions as the default run…
  assert.deepEqual(
    custom.map((t) => t.value),
    base.map((t) => t.value)
  );
  // …but labels come from format, overriding locale
  assert.deepEqual(
    custom.map((t) => t.label),
    ["2", "3", "4", "5"]
  );
});

test("defaults are unchanged (backward compatible)", () => {
  const lo = Date.UTC(2025, 0, 15),
    hi = Date.UTC(2025, 4, 20);
  const a = timeTicks(lo, hi, { zone: "UTC" });
  const b = timeTicks(lo, hi, { zone: "UTC", locale: "en", week: "date", fiscalStart: 1 });
  assert.deepEqual(a, b);
  assert.deepEqual(
    a.map((t) => t.label),
    ["Feb", "Mar", "Apr", "May"]
  );
});

test("DST transition: day ticks stay on local midnight across the spring shift", () => {
  // Europe/Rome springs forward on 2025-03-30 (02:00 → 03:00).
  const lo = Date.UTC(2025, 2, 28);
  const hi = Date.UTC(2025, 3, 2);
  const ticks = timeTicks(lo, hi, { zone: "Europe/Rome", target: 8 });
  assert.ok(ticks.length >= 3, "a few daily ticks across the DST edge");
  for (const t of ticks) {
    assert.equal(
      parts(t.value, "Europe/Rome").hour,
      0,
      `local midnight, got ${parts(t.value, "Europe/Rome").hour}`
    );
  }
});
