// Pins the component-side port against the published util. Components cannot
// import across packages (six Mitosis targets), so the logic is duplicated —
// this test is what stops the two copies drifting.
import assert from "node:assert/strict";
import { test } from "node:test";
import { computePosition as util } from "@alebianco/cr-utils/position";
import { computePosition as port } from "../packages/components/lib/position.ts";

const VP = { width: 1000, height: 800 };
const anchor = (x, y, w = 80, h = 30) => ({ x, y, width: w, height: h });
const floating = (w = 200, h = 120) => ({ width: w, height: h });

const CASES = [
  ["bottom-start room below", anchor(100, 100), floating(), { placement: "bottom-start" }],
  ["flips above when no room below", anchor(100, 700), floating(), { placement: "bottom-start" }],
  ["shifts right off the left edge", anchor(2, 100), floating(), { placement: "bottom-end" }],
  ["shifts left off the right edge", anchor(950, 100), floating(), { placement: "bottom-start" }],
  ["top-end preferred", anchor(400, 400), floating(), { placement: "top-end" }],
  [
    "no flip when disabled",
    anchor(100, 700),
    floating(),
    { placement: "bottom-start", flip: false },
  ],
];

for (const [name, a, f, opts] of CASES) {
  test(`port matches util: ${name}`, () => {
    assert.deepEqual(port(a, f, VP, opts), util(a, f, VP, opts));
  });
}
