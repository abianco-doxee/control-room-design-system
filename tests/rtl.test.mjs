// RTL-safe authoring guard (node:test). Run: npm run test:rtl
//
// Direction-agnostic layout means using CSS *logical* properties (margin-inline-*,
// padding-inline-*, border-inline-*, text-align: start/end) instead of physical
// left/right ones, so the whole system mirrors under dir="rtl". This fails if a
// physical flow property creeps back into the component stylesheet. (Positioning
// `left:`/`right:` on fixed/absolute overlays and gradient/clip-path angles are out
// of scope — they're not flow direction.)

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(ROOT, "packages", "styles", "styles", "components.css"), "utf8");

const FORBIDDEN = [
  [/\bmargin-left\s*:/g, "margin-left → margin-inline-start"],
  [/\bmargin-right\s*:/g, "margin-right → margin-inline-end"],
  [/\bpadding-left\s*:/g, "padding-left → padding-inline-start"],
  [/\bpadding-right\s*:/g, "padding-right → padding-inline-end"],
  [/\bborder-left\s*:/g, "border-left → border-inline-start"],
  [/\bborder-right\s*:/g, "border-right → border-inline-end"],
  [/\btext-align\s*:\s*left\b/g, "text-align:left → start"],
  [/\btext-align\s*:\s*right\b/g, "text-align:right → end"],
];

test("components.css uses logical, not physical, flow properties (RTL-safe)", () => {
  const hits = [];
  for (const [re, fix] of FORBIDDEN) {
    const m = css.match(re);
    if (m) hits.push(`${m.length}× ${fix}`);
  }
  assert.deepEqual(
    hits,
    [],
    `physical flow properties found — use logical:\n  ${hits.join("\n  ")}`
  );
});
