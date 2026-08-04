// Post-process the Mitosis Qwik output.
//
// The Qwik generator emits the ROOT element's computed `class` as an
// immediately-invoked arrow with a BLOCK body but no `return`:
//
//     class={(() => {
//       "cr-btn" + (props.kind ? " cr-btn--" + props.kind : "");
//     })()}
//
// which evaluates the string and discards it — the element ships with no class
// and loses all styling. (The same expression inside a `.map` callback is
// emitted correctly.) React/Vue/Svelte/Angular/Solid are unaffected. This is a
// generator quirk, not a source problem, so we fix the artifact rather than
// contort the shared .lite.tsx sources. dist/frameworks/** is git-ignored and
// regenerated on every `build:components`, so this runs each compile.
//
//   node build/build-fix-qwik.mjs           patch dist/frameworks/qwik
//   node build/build-fix-qwik.mjs --check   fail if any unpatched IIFE remains
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const QWIK = join(ROOT, "dist", "frameworks", "qwik", "components");
const CHECK = process.argv.includes("--check");

// class={(() => { <body> })()}  — capture the block body, add `return` if absent.
const IIFE = /class=\{\(\(\) => \{([\s\S]*?)\}\)\(\)\}/g;

if (!existsSync(QWIK)) {
  if (CHECK) { console.log("✓ qwik fixup: nothing compiled yet"); process.exit(0); }
  console.warn("⚠ qwik fixup: no dist/frameworks/qwik/components — run mitosis build first");
  process.exit(0);
}

let patched = 0;
let unpatched = 0;

for (const file of readdirSync(QWIK).filter((f) => f.endsWith(".tsx"))) {
  const p = join(QWIK, file);
  const src = readFileSync(p, "utf8");
  const out = src.replace(IIFE, (match, body) => {
    if (/\breturn\b/.test(body)) return match; // already correct
    // prefix the first non-whitespace of the body with `return `
    const fixed = body.replace(/^(\s*)(\S)/, (_m, ws, ch) => `${ws}return ${ch}`);
    return `class={(() => {${fixed}})()}`;
  });
  if (out !== src) {
    if (CHECK) { unpatched++; console.error(`✗ ${file} has an unpatched Qwik class IIFE`); continue; }
    writeFileSync(p, out);
    patched++;
  }
}

if (CHECK) {
  if (unpatched) { console.error("\nRun: npm run build:components (regenerates + patches)."); process.exit(1); }
  console.log("✓ qwik fixup: no unpatched class IIFEs");
  process.exit(0);
}
console.log(`qwik fixup: patched ${patched} component(s)`);
