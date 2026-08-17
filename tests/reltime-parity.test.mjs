// Drift guard: CrRelativeTime inlines its relative-time logic (a .lite component
// can't import a runtime util and stay portable across six targets). This renders
// the ACTUAL compiled React component and asserts its text matches the
// @alebianco/cr-utils relativeTime port for a spread of deltas — so the inlined
// copy and the util can never silently diverge.
//
// Run via test:pkg (pretest:pkg builds dist/pkg/react first).
import assert from "node:assert/strict";
import { test } from "node:test";
import { relativeTime } from "@alebianco/cr-utils/duration";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as CR from "../packages/components/dist/pkg/react/index.js";

const NOW = 1_700_000_000_000;
// boundaries around the "just now" cutoff and each unit rollover, both signs
const DELTAS = [
  0,
  999,
  1000,
  44_999,
  45_000,
  59_000,
  60_000,
  61_000,
  90_000,
  3_599_000,
  3_600_000,
  3_660_000,
  86_399_000,
  86_400_000,
  90_000_000,
  3 * 86_400_000,
  25 * 3_600_000,
  -1000,
  -90_000,
  -3_600_000,
  -90_000_000,
];

const textOf = (html) => html.replace(/<[^>]+>/g, "");

test("compiled React CrRelativeTime renders exactly what utils.relativeTime returns", () => {
  assert.equal(typeof CR.CrRelativeTime, "function", "react pkg exports CrRelativeTime");
  for (const d of DELTAS) {
    const time = NOW - d;
    const html = renderToStaticMarkup(createElement(CR.CrRelativeTime, { time, now: NOW }));
    assert.equal(
      textOf(html),
      relativeTime(time, NOW),
      `delta=${d}: component text must match utils.relativeTime`
    );
  }
});

// The parity test above compares two copies of the SAME logic, so it passes when
// both are wrong — it guards divergence, not correctness. These pinned literals
// are the other half: they fail if the shared behaviour regresses in lockstep.
//
// The ±1-day rows are the specific regression they exist to catch. Intl's
// `numeric:"auto"` renders ±1 of any unit as a CALENDAR word ("yesterday",
// "tomorrow"), but the value is an ELAPSED-DURATION count, so "auto" is correct
// only for the sub-45s "now" and the ladder must pin `numeric:"always"`.
const EXPECTED = [
  [0, "now"],
  [30_000, "now"],
  [44_999, "now"],
  [45_000, "45s ago"],
  [60_000, "1m ago"],
  [300_000, "5m ago"],
  [3_600_000, "1h ago"],
  [7_200_000, "2h ago"],
  [86_400_000, "1d ago"],
  [25 * 3_600_000, "1d ago"],
  [3 * 86_400_000, "3d ago"],
  [-86_400_000, "in 1d"],
  [-3_600_000, "in 1h"],
];

test("relativeTime English output is pinned (no calendar words on the ladder)", () => {
  for (const [d, want] of EXPECTED) {
    assert.equal(relativeTime(NOW - d, NOW), want, `delta=${d}`);
  }
});

test("the compiled component is pinned to the same literals", () => {
  for (const [d, want] of EXPECTED) {
    const html = renderToStaticMarkup(
      createElement(CR.CrRelativeTime, { time: NOW - d, now: NOW })
    );
    assert.equal(textOf(html), want, `delta=${d}`);
  }
});

// Locale is the dimension the parity test never exercised, so the duplicated
// sign-only behaviour table could drift freely between the two copies.
const LOCALES = ["en", "it", "de", "fr", "ru", "sv", "nb", "ja"];

test("the sign-only locale table matches between the util and the component", () => {
  for (const locale of LOCALES) {
    for (const d of [300_000, 86_400_000, -300_000]) {
      const time = NOW - d;
      const html = renderToStaticMarkup(
        createElement(CR.CrRelativeTime, { time, now: NOW, locale })
      );
      assert.equal(
        textOf(html),
        relativeTime(time, NOW, locale),
        `locale=${locale} delta=${d}: component and util must agree`
      );
    }
  }
});

test("sign-only locales read as elapsed time, not a bare +/- delta", () => {
  // A bare leading sign ("-5 мин") reads as a delta; those locales take `short`.
  for (const locale of ["ru", "sv", "nb", "fr"]) {
    const out = relativeTime(NOW - 300_000, NOW, locale);
    assert.ok(
      !/^[-−+]/.test(out),
      `${locale} must not render a bare sign, got ${JSON.stringify(out)}`
    );
  }
});

test("an invalid locale tag falls back to English instead of throwing", () => {
  // "en_US" (Java/Python/POSIX spelling) is the common mistake, and this runs
  // during render from app config — a throw would blank the whole subtree.
  for (const bad of ["en_US", "not_a_locale", "@@@"]) {
    assert.equal(relativeTime(NOW - 300_000, NOW, bad), "5m ago", `locale=${bad}`);
    const html = renderToStaticMarkup(
      createElement(CR.CrRelativeTime, { time: NOW - 300_000, now: NOW, locale: bad })
    );
    assert.equal(textOf(html), "5m ago", `component locale=${bad}`);
  }
});
