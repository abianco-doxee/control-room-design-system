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
import { existsSync, readFileSync } from "node:fs";
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
    `./qwik must resolve to dist/frameworks/qwik/index.ts, got ${resolved}`,
  );
  const src = readFileSync(resolved, "utf8");
  assert.match(src, /\.tsx"/, "the source barrel re-exports .tsx components");

  // Every framework ships an index.d.ts next to its source barrel; qwik was
  // long the sole omission, which is what let the broken export path stand.
  assert.ok(
    existsSync(join(dirname(resolved), "index.d.ts")),
    "dist/frameworks/qwik/index.d.ts present",
  );
});
