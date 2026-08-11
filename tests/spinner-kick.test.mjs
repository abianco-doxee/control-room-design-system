// Spinner geometry + press-kick wiring.
//
// Both of these regressed once and neither was visible from a passing DOM test:
//
//  1. The spinner was a rotating bordered circle (border-radius: 50%) — the
//     framework default, and a contradiction of Law 1's rectangular chassis.
//     Its replacement sizes cells GEOMETRICALLY. An earlier attempt sized them
//     in `ch` around Unicode block glyphs; U+2588 overflows its 1ch advance by
//     ~70%, so at --lg the four cells merged into one filled square. Painted
//     rectangles keep the geometry exact at every size.
//
//  2. `.cr-btn--kick` (the press glitch) existed in CSS, was reduced-motion
//     guarded, and was applied by NOTHING — dead code. The app it came from
//     drove it with framework click state, which a Mitosis component compiled to
//     six targets cannot do, so it is driven by :active instead.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STYLES = join(ROOT, "packages", "styles", "styles");
const components = readFileSync(join(STYLES, "components.css"), "utf8");
const spinnerPart = readFileSync(join(STYLES, "parts", "spinner.css"), "utf8");
const spinnerSrc = readFileSync(
  join(ROOT, "packages", "components", "components", "CrSpinner.lite.tsx"),
  "utf8"
);

/** The `.cr-spinner` rules, up to the next component banner. */
function spinnerBlock(css) {
  const start = css.indexOf(".cr-spinner {");
  assert.notEqual(start, -1, ".cr-spinner must be defined");
  const end = css.indexOf("/* ──", start + 10);
  return css.slice(start, end === -1 ? undefined : end);
}

test("the spinner is not a rotating circle", () => {
  const block = spinnerBlock(components);
  assert.doesNotMatch(block, /border-radius:\s*50%/, "no circular ring");
  assert.doesNotMatch(block, /rotate\(/, "the track translates, it does not rotate");
  // Law 1: the chassis is rectangular.
  assert.match(block, /background:\s*currentColor/, "cells are painted rectangles");
});

test("spinner cells are sized geometrically, not by glyph metrics", () => {
  const block = spinnerBlock(components);
  // `ch` units around a full-block glyph is the bug: the glyph overflows its
  // advance width, so cells overlap and merge at larger sizes.
  assert.doesNotMatch(block, /\d\s*\*\s*1ch|:\s*1ch/, "cells must not be sized in ch");
  assert.match(block, /--cr-spinner-cell:/, "cell size is a token");
  assert.match(block, /--cr-spinner-gap:/, "gap is a token");
  // Container must be exactly 3 cells + 2 gaps so the track corners land true.
  assert.match(
    block,
    /width:\s*calc\(var\(--cr-spinner-cell\)\s*\*\s*3\s*\+\s*var\(--cr-spinner-gap\)\s*\*\s*2\)/,
    "container is 3 cells + 2 gaps"
  );
});

test("all four spinner cells exist and carry the shade ramp", () => {
  // Four cells in the component…
  const cells = spinnerSrc.match(/cr-spinner__ring/g) || [];
  assert.equal(cells.length, 4, "component renders four cells");
  // …and four opacity stops in CSS, so the tail decays behind the leader.
  const block = spinnerBlock(components);
  for (const n of [1, 2, 3, 4]) {
    assert.match(block, new RegExp(`nth-child\\(${n}\\)`), `cell ${n} is styled`);
  }
  assert.match(block, /opacity:\s*0\.72/, "ramp stop 2");
  assert.match(block, /opacity:\s*0\.45/, "ramp stop 3");
  assert.match(block, /opacity:\s*0\.22/, "ramp stop 4");
});

test("the spinner announces itself once, and its cells are decoration", () => {
  assert.match(spinnerSrc, /role="status"/, "wrapper is role=status");
  assert.equal((spinnerSrc.match(/role="status"/g) || []).length, 1, "exactly one live region");
  assert.equal(
    (spinnerSrc.match(/aria-hidden="true"/g) || []).length,
    4,
    "all four cells are aria-hidden"
  );
});

test("the spinner holds position under reduced motion", () => {
  assert.match(spinnerPart, /@media \(prefers-reduced-motion: reduce\)/);
  // It must stop TRAVELLING, not merely slow down: the old version just
  // stretched its duration to 2.4s and kept spinning.
  assert.match(spinnerPart, /cr-spinner-hold/, "cells pulse in place instead");
});

test("the press kick is wired to something", () => {
  // It was dead CSS: defined, guarded, applied by nothing. Assert on the rule
  // that actually ANIMATES, not just any mention of the selector — the
  // reduced-motion block names it too, so a bare selector match still passes
  // with the real rule deleted. Strip every reduced-motion block (the sheet has
  // many, so truncating at the first one would cut the kick rule out) and
  // require the animation inside the :active rule body.
  const declaring = components.replace(
    /@media \(prefers-reduced-motion[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g,
    ""
  );
  assert.match(
    declaring,
    /\.cr-btn:active::after[^}]*animation:\s*cr-kick/,
    ":active must drive the kick animation outside the reduced-motion block"
  );
  // Tinted by the button's own signal, so a destructive button kicks red.
  assert.match(declaring, /border:\s*3px solid var\(--cr-btn-tint/, "kick follows the signal");
  // A caller can still drive it explicitly (a signal, a test fixture).
  assert.match(declaring, /\.cr-btn--kick::after/, "explicit opt-in survives");
});

test("the press kick drops its movement under reduced motion", () => {
  const rm = components.slice(components.indexOf("@media (prefers-reduced-motion: reduce)"));
  assert.match(rm, /\.cr-btn:active::after/, ":active kick is leashed too");
  assert.match(rm, /transform:\s*none/, "the translate is dropped");
});
