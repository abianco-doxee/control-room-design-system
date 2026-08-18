// Add the missing React/Qwik list `key` to Mitosis's `.map()` output.
//
// Mitosis auto-derives `key={x.id}` only when the iterated item has an `id`
// field. Every other `<For each={…}>` compiles to a bare
//
//     {props.items?.map((crumb, i) => (
//       <li …>                              ← no key
//
// which React reports as "Each child in a list should have a unique key prop"
// for 26 of the 81 components. It is not cosmetic: without a key React falls back
// to index-order reconciliation, so inserting or reordering a row remounts the
// ones after it — losing focus, input state and animation, and refiring the
// effects of any live region inside.
//
// This is an AST transform, deliberately. A regex version was attempted first and
// could not be made safe: Mitosis emits the callback in several shapes (concise
// body, block body with `return`, and a ternary returning two different elements),
// and every pattern that handled one shape mangled another — the worst scanned a
// fixed character window, ran past the end of the map, and keyed the component's
// own root element with an index variable that was not in scope. Parsing removes
// the guesswork: find CallExpressions named `map`, take the element(s) the
// callback actually returns, and set an attribute on those nodes only.
//
// Index keys are the correct floor here: these components iterate caller-supplied
// arrays whose identity field cannot be known. Any component whose item has an
// `id` keeps the better key Mitosis already emitted.
//
// Applies to React and Qwik, the two targets whose reconcilers use `key`.
// Vue/Svelte/Solid have their own keying (`:key`, `{#each … (k)}`, `<For>`).
//
//   node build/build-fix-keys.mjs           patch dist/frameworks/{react,qwik}
//   node build/build-fix-keys.mjs --check   fail if any keyless list map remains
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseAsync, types as t, transformFromAstAsync } from "@babel/core";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const TARGETS = ["react", "qwik"];

const PARSE_OPTS = {
  sourceType: "module",
  babelrc: false,
  configFile: false,
  parserOpts: { plugins: ["jsx", "typescript"] },
};

/** The JSX elements a map callback returns: the body itself, or both arms of a
 *  returned conditional. Anything else (a fragment, a call) is left alone. */
function returnedElements(node) {
  const out = [];
  const collect = (expr) => {
    if (!expr) return;
    if (t.isJSXElement(expr)) out.push(expr);
    else if (t.isConditionalExpression(expr)) {
      collect(expr.consequent);
      collect(expr.alternate);
    }
  };
  if (t.isBlockStatement(node.body)) {
    // block body — only a top-level `return`, not one nested in a helper
    for (const stmt of node.body.body) if (t.isReturnStatement(stmt)) collect(stmt.argument);
  } else {
    collect(node.body);
  }
  return out;
}

const hasKey = (el) =>
  el.openingElement.attributes.some((a) => t.isJSXAttribute(a) && a.name.name === "key");

/** Visit every `<something>.map(cb)` and key the elements its callback returns. */
function keyListMaps(ast) {
  let changed = false;

  const walk = (node, visit) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const n of node) walk(n, visit);
      return;
    }
    if (typeof node.type === "string") visit(node);
    for (const k of Object.keys(node)) {
      if (k === "loc" || k === "leadingComments" || k === "trailingComments") continue;
      walk(node[k], visit);
    }
  };

  walk(ast, (node) => {
    // `items.map(…)` is a CallExpression; `props.items?.map(…)` — which Mitosis
    // emits for every optional array prop — is an OptionalCallExpression with an
    // OptionalMemberExpression callee. Missing the optional forms is why an
    // earlier version silently skipped 26 of the components it was meant to fix.
    const isCall = t.isCallExpression(node) || t.isOptionalCallExpression(node);
    if (!isCall) return;
    const callee = node.callee;
    const isMember = t.isMemberExpression(callee) || t.isOptionalMemberExpression(callee);
    if (!isMember || callee.property.name !== "map") return;
    const cb = node.arguments[0];
    if (!cb || (!t.isArrowFunctionExpression(cb) && !t.isFunctionExpression(cb))) return;

    const els = returnedElements(cb).filter((el) => !hasKey(el));
    if (!els.length) return;

    // The index is the callback's second parameter; add one if absent. `.map`
    // always supplies it, so widening the signature is safe.
    let idx = cb.params[1];
    if (!t.isIdentifier(idx)) {
      idx = t.identifier("_i");
      cb.params[1] = idx;
    }
    for (const el of els) {
      el.openingElement.attributes.unshift(
        t.jsxAttribute(t.jsxIdentifier("key"), t.jsxExpressionContainer(t.identifier(idx.name)))
      );
      changed = true;
    }
  });

  return changed;
}

let patched = 0;
let unpatched = 0;

for (const fw of TARGETS) {
  const dir = join(ROOT, "dist", "frameworks", fw, "components");
  if (!existsSync(dir)) continue;

  for (const file of readdirSync(dir).filter((f) => f.endsWith(".tsx"))) {
    const p = join(dir, file);
    const src = readFileSync(p, "utf8");

    const ast = await parseAsync(src, { ...PARSE_OPTS, filename: file });
    if (!keyListMaps(ast)) continue;

    if (CHECK) {
      unpatched++;
      console.error(`✗ ${fw}/${file} has a list map with no key`);
      continue;
    }

    const { code } = await transformFromAstAsync(ast, src, {
      ...PARSE_OPTS,
      filename: file,
      cloneInputAst: false,
      // keep the emit as close to the input as possible — this output is read by
      // humans debugging codegen, and re-printed on every build
      generatorOpts: { retainLines: false, jsescOption: { minimal: true } },
    });
    writeFileSync(p, code);
    patched++;
  }
}

if (CHECK) {
  if (unpatched) {
    console.error("\nRun: npm run build:components (regenerates + patches).");
    process.exit(1);
  }
  console.log("✓ key fixup: every react/qwik list map is keyed");
  process.exit(0);
}

console.log(`key fixup: added list keys in ${patched} file(s)`);
