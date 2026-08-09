// Spike guard for the pt/dt/unstyled styling contract + per-target override.
// Reads the compiled framework output (run `npm run build:components` first).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const fw = (t, f) => readFileSync(join(ROOT, "dist", "frameworks", t, "components", f), "utf8");

test("Vue CrTabs is the hand-written per-target override (full native pt)", () => {
  const vue = fw("vue", "CrTabs.vue");
  assert.match(vue, /crGlobalPT/, "override wired global pt via inject");
  assert.match(vue, /mergeProps/, "override uses Vue mergeProps (listener chaining)");
});

test("the other targets are generated from the single .lite source (portable pt)", () => {
  // React keeps the portable pt spread + data-part; no override leakage.
  const react = fw("react", "CrTabs.tsx");
  assert.doesNotMatch(react, /crGlobalPT/, "override did NOT leak into React");
  assert.match(react, /data-part/, "generated output exposes data-part hooks");
  assert.match(react, /\.\.\.pta\(/, "generated output has the portable pt spread");
});

test("every target exposes the data-part styling hook on CrTabs", () => {
  for (const t of ["react", "vue", "svelte", "solid", "qwik", "angular"]) {
    const file = readdirSync(join(ROOT, "dist", "frameworks", t, "components")).find((f) => /^CrTabs\./.test(f));
    assert.ok(file, `${t}: CrTabs output exists`);
    assert.match(fw(t, file), /data-part/, `${t}: exposes data-part`);
  }
});
