// Unit tests for the collision-aware positioning primitive (node:test).
// Run: npm run test:position

import assert from "node:assert/strict";
import { test } from "node:test";
import { computePosition } from "../utils/position.js";

const VP = { width: 1000, height: 800 };
const anchor = (x, y, w = 80, h = 30) => ({ x, y, width: w, height: h });
const floating = (w = 200, h = 120) => ({ width: w, height: h });

test("bottom-start: below the anchor, left edges aligned", () => {
  const p = computePosition(anchor(100, 100), floating(), VP, {
    placement: "bottom-start",
    offset: 6,
  });
  assert.equal(p.x, 100, "left-aligned to anchor");
  assert.equal(p.y, 136, "below anchor (100+30+6)");
  assert.equal(p.placement, "bottom-start");
});

test("flips to top when there's no room below but room above", () => {
  const p = computePosition(anchor(100, 720), floating(200, 120), VP, {
    placement: "bottom-start",
  });
  assert.equal(p.placement, "top-start", "flipped");
  assert.equal(p.y, 720 - 120 - 6, "placed above the anchor");
});

test("does NOT flip when the preferred side fits", () => {
  const p = computePosition(anchor(100, 100), floating(200, 120), VP, {
    placement: "bottom-start",
  });
  assert.equal(p.placement, "bottom-start");
});

test("shift: clamps a right-aligned panel back into the viewport", () => {
  // anchor near the right edge, wide panel would overflow right
  const p = computePosition(anchor(960, 100, 30, 30), floating(300, 100), VP, {
    placement: "bottom-end",
    padding: 8,
  });
  assert.ok(p.x + 300 <= VP.width - 8 + 1, `right edge within viewport (x=${p.x})`);
  assert.ok(p.x >= 8, "not shifted off the left");
});

test("align=center centers the floating element on the anchor", () => {
  const p = computePosition(anchor(400, 100, 100, 30), floating(200, 80), VP, {
    placement: "bottom-center",
  });
  assert.equal(p.x, 400 + 50 - 100, "centered: ax + aw/2 - fw/2 = 350");
});

test("horizontal side: right places to the anchor's right", () => {
  const p = computePosition(anchor(100, 100, 80, 30), floating(120, 60), VP, {
    placement: "right-start",
  });
  assert.equal(p.x, 100 + 80 + 6, "to the right of the anchor");
  assert.equal(p.y, 100, "top-aligned");
});

test("flip can be disabled", () => {
  const p = computePosition(anchor(100, 720), floating(200, 120), VP, {
    placement: "bottom-start",
    flip: false,
  });
  assert.equal(p.placement, "bottom-start", "stays below even without room");
});
