// Law 3 — "Decay is information. Corruption escalates with severity."
//
// The law makes two mechanical claims that CSS can be held to, and both were
// once violated:
//
//  1. "MUST reserve drip (VERTICAL, DOWNWARD, in --drip) as the house glitch for
//     error surfaces and the masthead only." The shipped .cr-drip used to paint
//     radial-gradient blobs of --sig-err bleeding past the bottom edge — liquid
//     paint running down a wall, not signal corruption on a CRT — and never
//     referenced --drip at all, leaving that token with zero consumers.
//
//  2. "MUST map glitch intensity to severity — the intensity IS the readout."
//     There were no tier classes, so nothing could map a tier to a state.
//
// These assertions are about the *mechanism*, not the exact pixel values: they
// pin direction, token, and the existence of the severity ladder.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STYLES = join(ROOT, "packages", "styles", "styles");
const components = readFileSync(join(STYLES, "components.css"), "utf8");
const dripPart = readFileSync(join(STYLES, "parts", "drip.css"), "utf8");
const tiersPart = readFileSync(join(STYLES, "parts", "glitch-tiers.css"), "utf8");

/** The `.cr-drip` rule block plus its pseudo-elements. */
function dripBlock(css) {
  const start = css.indexOf(".cr-drip {");
  assert.notEqual(start, -1, ".cr-drip must be defined");
  const end = css.indexOf(".cr-drip__title", start);
  return css.slice(start, end === -1 ? undefined : end);
}

test("the drip glitch is vertical and drawn in --drip", () => {
  const block = dripBlock(components);

  // Vertical scanlines: a 90deg repeating gradient makes vertical bars.
  assert.match(block, /repeating-linear-gradient\(\s*90deg/, "drip must be vertical scanlines");
  assert.match(block, /var\(--drip\)/, "drip must be drawn in --drip");

  // Downward: masked so it fades away from the top edge.
  assert.match(block, /mask-image:\s*linear-gradient\(180deg/, "drip must fade downward");

  // The old wrong implementation, explicitly excluded.
  assert.doesNotMatch(block, /radial-gradient/, "drip must not be liquid blobs");
  assert.doesNotMatch(block, /top:\s*100%/, "drip must not hang below the surface");
});

test("--drip actually has a consumer", () => {
  // The token existed with zero consumers while the component named after it
  // painted --sig-err. If this fails, the drip has drifted off its own token.
  assert.match(components, /var\(--drip\)/, "--drip must be consumed by the style layer");
});

test("the three glitch tiers exist so intensity can map to severity", () => {
  assert.match(components, /\.cr-glitch-t1\s*\{/, "T1 (split, nominal) must exist");
  assert.match(components, /\.cr-glitch-t2\s*\{/, "T2 (slice, degraded) must exist");
  // T2's slice is the one tier the law pins to a specific pair of hues.
  assert.match(components, /\.cr-glitch-t2::before[^}]*var\(--drip\)/, "T2 slices in --drip");
  assert.match(
    components,
    /\.cr-glitch-t2::after[^}]*var\(--sig-accent\)/,
    "T2 slices in --sig-accent"
  );
});

test("every corruption tier is leashed by reduced motion", () => {
  // It is motion even when it is not animated.
  for (const [name, css] of [
    ["drip", dripPart],
    ["glitch tiers", tiersPart],
  ]) {
    assert.match(
      css,
      /@media \(prefers-reduced-motion: reduce\)/,
      `${name} must guard reduced motion`
    );
  }
  // Each part must carry its OWN guard: an import-on-use consumer taking only
  // parts/drip.css must not silently lose it.
  assert.match(
    dripPart,
    /prefers-reduced-motion[^}]*\}[\s\S]*?\.cr-drip::before\s*\{\s*display:\s*none|\.cr-drip::before\s*\{\s*display:\s*none/,
    "parts/drip.css must disable its own drip"
  );
  assert.match(
    tiersPart,
    /\.cr-glitch-t1\s*\{\s*text-shadow:\s*none/,
    "parts/glitch-tiers.css must disable T1"
  );
});
