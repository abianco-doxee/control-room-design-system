#!/usr/bin/env node
/**
 * Build the compiled, typed framework packages (dist/pkg/<framework>).
 *
 * Today: React — the runtime-verified target. tsc compiles dist/frameworks/react
 * (TSX + typed prop interfaces) into ESM JS + .d.ts. A normalisation pass then
 * rewrites any remaining relative `.tsx`/`.ts` import specifiers to `.js` so the
 * JS and the declarations agree and resolve in both Node ESM and bundlers (tsc's
 * extension rewriting covers the .js emit but not always the .d.ts re-exports).
 *
 * The output is a real named-export package — `import { CrButton, type
 * CrButtonProps } from "@control-room/design-system/react"` — with react/react-dom
 * left external (peer deps). The package stays private; this just makes its
 * framework entry points genuinely consumable (npm pack / workspace linking).
 *
 * Run:   node build/build-pkg.mjs
 * Check: node build/build-pkg.mjs --check   (compile only; fail on type errors)
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");

const PACKAGES = [
  { framework: "react", tsconfig: "build/tsconfig.pkg.react.json", out: "dist/pkg/react" },
];

// rewrite `from "./x.tsx"` / `from './x.ts'` (and dynamic import) → `.js`
function normalizeExtensions(dir) {
  let touched = 0;
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(js|d\.ts)$/.test(e.name)) {
        const src = readFileSync(p, "utf8");
        const next = src.replace(/((?:from|import)\s*\(?\s*["'][^"']*?)\.(tsx|ts)(["'])/g, "$1.js$3");
        if (next !== src) { writeFileSync(p, next); touched++; }
      }
    }
  };
  walk(dir);
  return touched;
}

for (const { framework, tsconfig, out } of PACKAGES) {
  process.stdout.write(`compiling ${framework} package … `);
  try {
    execFileSync("npx", ["tsc", "-p", join(ROOT, tsconfig)], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
  } catch (err) {
    console.error("\n✗ tsc failed for the " + framework + " package:\n" + (err.stdout || err.message || err));
    process.exit(1);
  }
  if (CHECK) { console.log("ok (type-checked)"); continue; }
  const n = normalizeExtensions(join(ROOT, out));
  const count = readdirSync(join(ROOT, out, "components")).filter((f) => f.endsWith(".js")).length;
  console.log(`ok — ${count} components → ${out}  (${n} files normalised)`);
}
