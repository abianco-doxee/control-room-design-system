// Consumability gate for the compiled Qwik package (node:test).
// Run: npm run test:pkg:qwik   (pretest builds dist/pkg/qwik first)
//
// Imports the built package as a consumer would and confirms the named exports
// resolve, load as Qwik components, and ship typed declarations.
//
// NOTE on what the `./qwik` subpath must point at: Qwik's optimizer only
// transforms *source*, never pre-compiled JS inside node_modules. Pointing
// `./qwik` at dist/pkg/qwik/*.js therefore fails in any real Qwik consumer with
// "Optimizer should replace all usages of $() with some special syntax" — even
// though the files import and expose functions fine under plain node, which is
// all the assertions below can see. The export must resolve to the raw
// dist/frameworks/qwik source, exactly as vue/angular/solid already do. The
// `resolves the ./qwik subpath` test guards that; keep it.

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import * as CR from "../packages/components/dist/pkg/qwik/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PKG = join(ROOT, "packages", "components", "dist", "pkg", "qwik");

test("the qwik package imports and exposes every component as a named export", () => {
  const expected = ["CrButton", "CrPanel", "CrChip", "CrForm", "CrTabs", "CrBarChart", "CrSigil"];
  for (const name of expected) assert.ok(CR[name], `${name} should be a named export`);
  const exported = Object.keys(CR).filter((k) => CR[k]);
  assert.ok(exported.length >= 60, `expected ~61 exports, got ${exported.length}`);
});

// Qwik cannot be SSR-rendered here the way the other five targets are: its
// renderToString needs a Vite build context (import.meta.env, the client
// manifest), and the optimizer only transforms source — see the NOTE above. So
// the strongest floor available in plain Node is that EVERY component loads and
// is callable, not the seven the next test spot-checks. Real rendering for Qwik
// happens in the consumer's own build; the compile gate
// (tests/compile-all.test.mjs) proves all 81 parse as valid Qwik TSX.
test("every component loads as a callable Qwik component", () => {
  const names = Object.keys(CR).filter((k) => k !== "CrContext");
  assert.ok(names.length >= 60, `expected ~81 components, got ${names.length}`);
  const bad = names.filter((n) => typeof CR[n] !== "function");
  assert.deepEqual(bad, [], `not callable: ${bad.join(", ")}`);
});

// Qwik's useContext THROWS when no provider is above the component
// ("Code(13): not found state for context") — every other target yields undefined
// and lets the pt/locale cascade fall back to its defaults. CrContext is opt-in,
// so a bare `useContext(CrContext)` made EVERY Qwik component unrenderable in an
// app that never provides it, which is every app that does not use the global
// tier — including this repo's own examples/console. build-fix-qwik.mjs passes a
// `null` default; this guards that it stays passed.
//
// NOT `undefined`: qwik's implementation guards with `if (defaultValue !== undefined)`
// and falls through to the throw, so undefined behaves exactly like no default.
test("every context read passes a default, so a provider-less app can render", () => {
  const dir = join(ROOT, "packages", "components", "dist", "frameworks", "qwik", "components");
  const bare = [];
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".tsx"))) {
    const src = readFileSync(join(dir, f), "utf8");
    for (const m of src.matchAll(/useContext\(CrContext([^)]*)\)/g)) {
      const arg = m[1].trim();
      if (arg === "" || /^,\s*undefined$/.test(arg)) bare.push(`${f}: useContext(CrContext${arg})`);
    }
  }
  assert.deepEqual(
    bare,
    [],
    `context reads that throw without a provider:\n  ${bare.join("\n  ")}`
  );
});

test("exports load as callable Qwik components", () => {
  // component$ output is a callable component; QRL/lazy markers are added later by
  // the consumer's Qwik optimizer, so here we assert they load as functions.
  for (const name of ["CrButton", "CrForm", "CrTabs"]) {
    assert.equal(typeof CR[name], "function", `${name} should load as a callable component`);
  }
});

test("typed declarations ship alongside the JS", () => {
  assert.ok(existsSync(join(PKG, "index.d.ts")), "index.d.ts present");
  assert.ok(existsSync(join(PKG, "index.js")), "index.js present");
  const idx = readFileSync(join(PKG, "index.d.ts"), "utf8");
  assert.match(idx, /export \{ default as CrButton \}/);
  assert.match(idx, /export type \{ CrButtonProps \}/);
  assert.doesNotMatch(idx, /\.tsx"/, "no .tsx specifiers leak into shipped types");
});

test("resolves the ./qwik subpath to optimizer-processable source, not compiled JS", () => {
  const require = createRequire(join(ROOT, "package.json"));
  const resolved = require.resolve("@alebianco/cr-components/qwik");

  // Must be the raw framework source: the optimizer cannot process compiled JS
  // in node_modules. See the note at the top of this file.
  assert.match(
    resolved,
    /dist[/\\]frameworks[/\\]qwik[/\\]index\.ts$/,
    `./qwik must resolve to dist/frameworks/qwik/index.ts, got ${resolved}`
  );
  const src = readFileSync(resolved, "utf8");
  assert.match(src, /\.tsx"/, "the source barrel re-exports .tsx components");

  // Every framework ships an index.d.ts next to its source barrel; qwik was
  // long the sole omission, which is what let the broken export path stand.
  assert.ok(
    existsSync(join(dirname(resolved), "index.d.ts")),
    "dist/frameworks/qwik/index.d.ts present"
  );
});
