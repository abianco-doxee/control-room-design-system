// EVERY-component compile gate.
//
// The runtime gate (test:frameworks) proves the targets *run*, but only over a
// hand-picked BREADTH list of ~10 components that render cleanly headless. That
// left 70+ components compile-unchecked, and two of them were in fact broken:
// CrTabs and CrForm emitted duplicate identifiers on Svelte ("Identifier 'mode'
// has already been declared") and never compiled for anyone. Nothing failed,
// because nothing compiled them.
//
// This gate closes that hole the cheap way: no rendering, no props, no runtime —
// just push all 81 components through each target's own PARSER and require zero
// errors. Compilation is the floor; a component that cannot compile cannot be
// consumed, whatever the runtime gate says about its neighbours.
//
// Run after `npm run build:components`.

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FW = join(ROOT, "packages", "components", "dist", "frameworks");

const NAMES = readdirSync(join(FW, "svelte", "components"))
  .filter((f) => f.endsWith(".svelte"))
  .map((f) => f.replace(/\.svelte$/, ""))
  .sort();

test("the component set is non-trivial (guards against an empty/failed build)", () => {
  assert.ok(NAMES.length >= 60, `expected 60+ components, found ${NAMES.length}`);
});

test("svelte: every component compiles", async () => {
  const { compile } = await import("svelte/compiler");
  const failed = [];
  for (const n of NAMES) {
    const src = readFileSync(join(FW, "svelte", "components", `${n}.svelte`), "utf8");
    try {
      compile(src, { generate: "ssr", filename: `${n}.svelte` });
    } catch (e) {
      failed.push(`${n}: ${String(e.message).split("\n")[0]}`);
    }
  }
  assert.deepEqual(failed, [], `svelte compile failures:\n  ${failed.join("\n  ")}`);
});

// `inlineTemplate: true` compiles the template INTO the script, which is what a
// real bundler does — and, critically, it decodes HTML entities in binding
// expressions first. Mitosis emits `:class="ptClass(…, &quot;CrInput&quot;)"`,
// which a standalone compileTemplate() would reject as a syntax error while
// every actual Vue toolchain compiles it fine. Compiling the two halves
// separately would fail on a component that genuinely works.
test("vue: every component's SFC compiles (script + inlined template)", async () => {
  const { compileScript, parse } = await import("@vue/compiler-sfc");
  const failed = [];
  for (const n of NAMES) {
    const src = readFileSync(join(FW, "vue", "components", `${n}.vue`), "utf8");
    try {
      const { descriptor } = parse(src, { filename: `${n}.vue` });
      compileScript(descriptor, { id: n, inlineTemplate: true });
    } catch (e) {
      failed.push(`${n}: ${String(e.message).split("\n")[0]}`);
    }
  }
  assert.deepEqual(failed, [], `vue compile failures:\n  ${failed.join("\n  ")}`);
});

test("solid: every component transforms", async () => {
  const babel = await import("@babel/core");
  const failed = [];
  for (const n of NAMES) {
    const src = readFileSync(join(FW, "solid", "components", `${n}.jsx`), "utf8");
    try {
      await babel.transformAsync(src, {
        presets: [["babel-preset-solid", { generate: "ssr", hydratable: false }]],
        filename: `${n}.jsx`,
      });
    } catch (e) {
      failed.push(`${n}: ${String(e.message).split("\n")[0]}`);
    }
  }
  assert.deepEqual(failed, [], `solid transform failures:\n  ${failed.join("\n  ")}`);
});

// React and Qwik are TSX consumed by tsc/esbuild downstream; a parse check is the
// equivalent floor for them.
for (const target of ["react", "qwik"]) {
  test(`${target}: every component parses as TSX`, async () => {
    const esbuild = await import("esbuild");
    const failed = [];
    for (const n of NAMES) {
      const src = readFileSync(join(FW, target, "components", `${n}.tsx`), "utf8");
      try {
        esbuild.transformSync(src, { loader: "tsx", jsx: "preserve" });
      } catch (e) {
        const msg = e.errors && e.errors[0] ? e.errors[0].text : e.message;
        failed.push(`${n}: ${String(msg).split("\n")[0]}`);
      }
    }
    assert.deepEqual(failed, [], `${target} parse failures:\n  ${failed.join("\n  ")}`);
  });
}
