// Drift guard: CrRelativeTime inlines its relative-time logic (a .lite component
// can't import a runtime util and stay portable across six targets). This renders
// the ACTUAL compiled React component and asserts its text matches the
// @control-room/utils relativeTime port for a spread of deltas — so the inlined
// copy and the util can never silently diverge.
//
// Run via test:pkg (pretest:pkg builds dist/pkg/react first).
import assert from "node:assert/strict";
import { test } from "node:test";
import { relativeTime } from "@control-room/utils/duration";
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
