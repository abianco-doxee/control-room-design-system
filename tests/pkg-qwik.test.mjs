// Consumability gate for the compiled Qwik package (node:test).
// Run: npm run test:pkg:qwik   (pretest builds dist/pkg/qwik first)
//
// Imports the built package as a consumer would and confirms the named exports
// resolve, load as Qwik components, and ship typed declarations. (Full SSR render
// isn't exercised here: @builder.io/qwik/server pulls the @qwik-client-manifest
// virtual module that only the Qwik/Vite optimizer provides at build time — the
// consumer's Qwik build supplies it. The React package gate covers rendered
// markup, and both come from the same Mitosis source.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as CR from "../dist/pkg/qwik/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PKG = join(ROOT, "dist", "pkg", "qwik");

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
