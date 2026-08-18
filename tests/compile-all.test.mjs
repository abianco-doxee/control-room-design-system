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

// ── shadow gates ─────────────────────────────────────────────────────────────
//
// Mitosis flattens both `props.x` and `state.x` to a bare `x` on the targets that
// have nowhere else to put them. A local, parameter, or object key reusing one of
// those names therefore COLLAPSES into the same identifier, and the result is
// valid-looking code that is wrong:
//
//   const series = props.series || []   →  const series = series || []   (TDZ throw)
//   mode()       + prop `mode`          →  dup identifier / self-reference
//   param query  + store member         →  function load(query.value)    (Vue)
//   key hidden   + store member         →  hidden.value:                 (Vue)
//
// Which targets are actually exposed is not a guess — it follows from how each one
// emits props, verified against the generated output:
//
//   svelte   `export let x`   → prop and locals share ONE lexical scope. Exposed.
//   angular  `@Input() x`     → prop is `this.x`; a local `let x` cannot collide.
//   react/vue/solid/qwik      → keep `props.x` intact; nothing to collapse.
//
// Vue is exposed to the STORE half only (it rewrites store reads to `.value`),
// which is what broke CrCombobox and CrLineChart. So: scan Svelte for prop
// shadows, and scan the .lite sources for store shadows, which covers every
// target from the one place the collision is authored.

test("svelte: no local shadows a prop (the props.x → x collapse)", () => {
  const shadows = [];
  for (const n of NAMES) {
    const lines = readFileSync(join(FW, "svelte", "components", `${n}.svelte`), "utf8").split("\n");
    const props = new Set();
    for (const l of lines) {
      const m = /^\s*export let ([A-Za-z_][A-Za-z0-9_]*)/.exec(l);
      if (m) props.add(m[1]);
    }
    lines.forEach((l, i) => {
      if (/^\s*export let /.test(l)) return;
      for (const m of l.matchAll(/\b(?:const|let)\s+([A-Za-z_][A-Za-z0-9_]*)\b/g)) {
        if (props.has(m[1])) shadows.push(`${n}.svelte:${i + 1}: local '${m[1]}' shadows the prop`);
      }
    });
  }
  assert.deepEqual(shadows, [], `prop shadows:\n  ${shadows.join("\n  ")}`);
});

// The store half, checked at the SOURCE — one scan covering every target, since
// the collision is authored once in the .lite file. Catches the CrForm `errs`,
// CrCombobox `query` and CrLineChart `hidden` shapes: a local, a function
// parameter, or an object key reusing a `useStore({...})` member's name.
test("lite sources: no local, param, or key shadows a store member", () => {
  const dir = join(ROOT, "packages", "components", "components");
  const shadows = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".lite.tsx"))) {
    const src = readFileSync(join(dir, file), "utf8");
    const storeAt = src.indexOf("useStore({");
    if (storeAt === -1) continue;

    // Member names are the keys at the store literal's top level of indentation.
    const members = new Set();
    const after = src.slice(storeAt);
    for (const m of after.matchAll(/^ {4}([A-Za-z_][A-Za-z0-9_]*)\s*[:(]/gm)) members.add(m[1]);
    if (!members.size) continue;

    let inBlockComment = false;
    src.split("\n").forEach((line, i) => {
      // Strip comments properly: a `/* … */` block spans lines, and its
      // continuation lines carry no marker of their own beyond a leading `*`.
      let code = line;
      if (inBlockComment) {
        const close = code.indexOf("*/");
        if (close === -1) return;
        code = code.slice(close + 2);
        inBlockComment = false;
      }
      const open = code.indexOf("/*");
      if (open !== -1 && code.indexOf("*/", open) === -1) {
        inBlockComment = true;
        code = code.slice(0, open);
      }
      code = code.split("/*")[0].split("//")[0];
      const flag = (name, kind) => {
        if (members.has(name))
          shadows.push(`${file}:${i + 1}: ${kind} '${name}' shadows a store member`);
      };
      // `const x =` / `let x =`, but not the store's own `const state = useStore`
      for (const m of code.matchAll(/\b(?:const|let)\s+([A-Za-z_][A-Za-z0-9_]*)\s*[=:]/g)) {
        if (m[1] !== "state") flag(m[1], "local");
      }
      // a method's own parameter list: `name(a: T, b: T) {`
      const sig = /^\s{4}[A-Za-z_][A-Za-z0-9_]*\(([^)]*)\)\s*[:{]/.exec(code);
      if (sig && sig[1].trim()) {
        for (const p of sig[1].split(",")) {
          const nm = /^\s*([A-Za-z_][A-Za-z0-9_]*)/.exec(p);
          if (nm) flag(nm[1], "param");
        }
      }
    });
  }
  assert.deepEqual(shadows, [], `store-member shadows:\n  ${shadows.join("\n  ")}`);
});
