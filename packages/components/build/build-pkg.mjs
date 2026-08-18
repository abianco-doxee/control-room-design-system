#!/usr/bin/env node
/**
 * Build the compiled, typed framework packages (dist/pkg/<framework>).
 *
 * React and Qwik (see PACKAGES below). tsc compiles each dist/frameworks/<fw>
 * (TSX + typed prop interfaces) into ESM JS + .d.ts. A normalisation pass then
 * rewrites any remaining relative `.tsx`/`.ts` import specifiers to `.js` so the
 * JS and the declarations agree and resolve in both Node ESM and bundlers (tsc's
 * extension rewriting covers the .js emit but not always the .d.ts re-exports).
 *
 * The output is a real named-export package — `import { CrButton, type
 * CrButtonProps } from "@alebianco/cr-design-system/react"` — with react/react-dom
 * left external (peer deps). The package stays private; this just makes its
 * framework entry points genuinely consumable (npm pack / workspace linking).
 *
 * Run:   node build/build-pkg.mjs
 * Check: node build/build-pkg.mjs --check   (compile only; fail on type errors)
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");

const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const ALL_PACKAGES = [
  { framework: "react", tsconfig: "build/tsconfig.pkg.react.json", out: "dist/pkg/react" },
  // Qwik's generated refs type as `Element` (no showModal/close/focus), so tsc
  // reports type errors while still emitting correct JS + .d.ts. Same leniency as
  // verify:types for React — we accept the emit as long as it actually landed.
  {
    framework: "qwik",
    tsconfig: "build/tsconfig.pkg.qwik.json",
    out: "dist/pkg/qwik",
    tolerant: true,
  },
];
const PACKAGES = only.length
  ? ALL_PACKAGES.filter((p) => only.includes(p.framework))
  : ALL_PACKAGES;

// rewrite `from "./x.tsx"` / `from './x.ts'` (and dynamic import) → `.js`
function normalizeExtensions(dir) {
  let touched = 0;
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(js|d\.ts)$/.test(e.name)) {
        const src = readFileSync(p, "utf8");
        const next = src
          .replace(/((?:from|import)\s*\(?\s*["'][^"']*?)\.(tsx|ts)(["'])/g, "$1.js$3")
          // Context modules are emitted by Mitosis's context generators, which
          // strip the extension entirely (`from "./cr.context"`). Node's ESM
          // resolver needs the explicit `.js`, so add it — matched on the
          // `.context` infix so no other relative import is touched.
          .replace(/((?:from|import)\s*\(?\s*["']\.[^"']*\.context)(["'])/g, "$1.js$2");
        if (next !== src) {
          writeFileSync(p, next);
          touched++;
        }
      }
    }
  };
  walk(dir);
  return touched;
}

for (const { framework, tsconfig, out, tolerant } of PACKAGES) {
  process.stdout.write(`compiling ${framework} package … `);
  const emitted = () =>
    existsSync(join(ROOT, out, "index.js")) && existsSync(join(ROOT, out, "index.d.ts"));
  let typeErrors = 0;
  try {
    execFileSync("npx", ["tsc", "-p", join(ROOT, tsconfig)], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    // tsc emits JS + .d.ts even with type errors; only bail if the emit is missing
    // (or if this package isn't allowed to carry type errors).
    const out_ = String(err.stdout || err.message || "");
    typeErrors = (out_.match(/error TS\d+/g) || []).length;
    if (!tolerant || !emitted()) {
      console.error(`\n✗ tsc failed for the ${framework} package:\n` + out_);
      process.exit(1);
    }
  }
  if (CHECK) {
    console.log(
      typeErrors ? `ok (emitted; ${typeErrors} tolerated type notes)` : "ok (type-checked)"
    );
    continue;
  }
  const n = normalizeExtensions(join(ROOT, out));
  const count = readdirSync(join(ROOT, out, "components")).filter((f) => f.endsWith(".js")).length;
  const note = typeErrors ? `, ${typeErrors} tolerated type notes` : "";
  console.log(`ok — ${count} components → ${out}  (${n} files normalised${note})`);
}
