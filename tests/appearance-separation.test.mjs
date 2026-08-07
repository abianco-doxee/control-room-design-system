// Guard: appearance must not leak into the feature layer (node:test).
// Run: npm run test:separation
//
// The system's promise is that components carry NO brand colour — they reference
// semantic roles (CSS custom properties), so any theme reskins them. This test
// makes that boundary mechanical instead of merely observed: it fails if a raw
// brand colour appears in the shared component stylesheet or a component source.
//
// Two sanctioned exceptions, both narrow and explicit:
//   1. physical black/white (#fff/#000) used for bevel highlights inside
//      color-mix() or as a mask alpha — device shading, not a hue;
//   2. the four generative-canvas components, which paint to <canvas> (where CSS
//      vars don't reach the 2D context) and therefore read the palette at runtime
//      via getComputedStyle, keeping a default hex only as a FALLBACK.
// The list of palette-bearing files is pinned, so a new component can't quietly
// hardcode a colour without this test turning red.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

// hex that isn't physical black/white
const isBW = (h) => /^#(fff|ffffff|000|000000)$/i.test(h);
const brandHex = (src) => (src.match(/#[0-9a-fA-F]{3,8}\b/g) || []).filter((h) => !isBW(h));
// colour-function literals (color-mix is fine — it mixes token vars, not a literal)
const colorFuncs = (src) => src.match(/\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklch|oklab)\(/g) || [];

// the ONLY component sources allowed to embed palette (as runtime-var fallbacks)
const GENERATIVE = ["CrAscii", "CrCat", "CrChrome", "CrSigil"];

test("components.css carries no brand colour (only physical black/white)", () => {
  const css = read("styles/components.css");
  const hex = brandHex(css);
  assert.deepEqual(hex, [], `raw brand hex in components.css: ${[...new Set(hex)].join(", ")}`);
  const fns = colorFuncs(css);
  assert.deepEqual(fns, [], `colour-function literals in components.css: ${[...new Set(fns)].join(", ")}`);
});

test("no component source uses a colour-function literal", () => {
  const files = readdirSync(join(ROOT, "components")).filter((f) => f.endsWith(".lite.tsx"));
  for (const f of files) {
    const fns = colorFuncs(read(`components/${f}`));
    assert.deepEqual(fns, [], `${f} uses a colour-function literal: ${[...new Set(fns)].join(", ")}`);
  }
});

test("only the generative-canvas components embed palette — and only as var fallbacks", () => {
  const files = readdirSync(join(ROOT, "components")).filter((f) => f.endsWith(".lite.tsx"));
  const withPalette = files.filter((f) => brandHex(read(`components/${f}`)).length > 0).map((f) => f.replace(".lite.tsx", ""));

  // the pinned set: exactly the generative-art components, nothing new
  assert.deepEqual(
    withPalette.slice().sort(),
    GENERATIVE.slice().sort(),
    "a component outside the generative-art set hardcodes a brand colour (or the allowlist is stale)",
  );

  // each of them must read the palette from the theme at runtime (fallbacks only)
  for (const name of GENERATIVE) {
    const src = read(`components/${name}.lite.tsx`);
    assert.match(src, /getPropertyValue\(/, `${name} must read CSS custom properties (theme-driven), not just hardcode`);
  }
});
