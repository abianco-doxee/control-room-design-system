#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
/**
 * Incremental Mitosis compiler — a drop-in replacement for `mitosis build` that
 * only re-generates the components whose source (or the shared build key) changed.
 *
 * Why: the CLI parses each .lite once but re-runs all six generators over every
 * component on every build (~40s cold for 80×6). Most edits touch one component;
 * this caches per-component output keyed by a content hash and regenerates just
 * the dirty ones (~1-2s), while producing BYTE-IDENTICAL output to the CLI —
 * it reuses Mitosis's own parseJsx + generator map + renameComponentFile +
 * checkShouldOutputTypeScript, and the CLI's transformImports + getOverrideFile.
 *
 * Cache lives in .mitosis-cache/manifest.json (git-ignored). Pass --no-cache to
 * force a full rebuild (used by the parity check).
 */
import { createRequire } from "node:module";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const NO_CACHE = process.argv.includes("--no-cache");

// Resolve the Mitosis package root from its (exported) main entry, so the version
// read below works regardless of workspace hoisting and the package's exports map
// (which does not expose ./package.json).
const MITOSIS_MAIN = require.resolve("@builder.io/mitosis");
const MITOSIS_PKG = MITOSIS_MAIN.slice(
  0,
  MITOSIS_MAIN.lastIndexOf("@builder.io/mitosis") + "@builder.io/mitosis".length
);
const mitosis = require("@builder.io/mitosis");
const { parseJsx, targets: GENERATORS, renameComponentFile, checkShouldOutputTypeScript } = mitosis;
// Context modules (`*.context.lite.ts`) are NOT components: they parse with
// parseContext and render through a per-target contextTo<Target> generator. The
// component parser chokes on one (`JSON5: invalid character`), so they are
// discovered and emitted separately below.
const { parseContext } = mitosis;
const CONTEXT_GENERATORS = {
  react: mitosis.contextToReact,
  vue: mitosis.contextToVue,
  svelte: mitosis.contextToSvelte,
  angular: mitosis.contextToAngular,
  solid: mitosis.contextToSolid,
  qwik: mitosis.contextToQwik,
};
const { transformImports } = require("@builder.io/mitosis-cli/dist/build/helpers/transpile.js");
const { getOverrideFile } = require("@builder.io/mitosis-cli/dist/build/helpers/overrides.js");

const config = require(join(ROOT, "mitosis.config.cjs"));
const DEST = join(ROOT, config.dest);
const OVERRIDES_DIR = join(ROOT, config.overridesDir || "overrides");
const TARGET_LIST = config.targets;
const CACHE_DIR = join(ROOT, ".mitosis-cache");
const MANIFEST = join(CACHE_DIR, "manifest.json");

// Per-target options, mirroring the CLI's normalizeConfig (commonOptions + the
// per-target block + a plugins array). We use no commonOptions/plugins.
const optionsFor = (target) => ({ ...(config.options?.[target] || {}), plugins: [] });

// Discover the component sources (components/**/*.lite.tsx).
const componentPaths = readdirSync(join(ROOT, "components"))
  .filter((f) => f.endsWith(".lite.tsx"))
  .map((f) => join("components", f))
  .sort();

// Context sources (components/**/*.context.lite.ts) — the app-level `pt` / locale
// / messages tier. Kept in components/ because mitosis.config globs `components/**`;
// a context anywhere else compiles silently and is never emitted, leaving consumers
// with an unresolvable import.
const contextPaths = readdirSync(join(ROOT, "components"))
  .filter((f) => f.endsWith(".context.lite.ts"))
  .map((f) => join("components", f))
  .sort();

const sha = (s) => createHash("sha1").update(s).digest("hex").slice(0, 16);

// Global key: any change here invalidates the whole cache (config, overrides,
// Mitosis version, this driver). Folds every override file's content in.
function globalKey() {
  const parts = [
    "v1",
    JSON.stringify({ targets: TARGET_LIST, options: config.options, dest: config.dest }),
    JSON.parse(readFileSync(join(MITOSIS_PKG, "package.json"), "utf8")).version,
    readFileSync(fileURLToPath(import.meta.url), "utf8"),
  ];
  if (existsSync(OVERRIDES_DIR)) {
    const walk = (dir) => {
      for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
        a.name.localeCompare(b.name)
      )) {
        const p = join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else parts.push(relative(ROOT, p) + ":" + sha(readFileSync(p, "utf8")));
      }
    };
    walk(OVERRIDES_DIR);
  }
  return sha(parts.join("\n"));
}

// Generate all six target files for one component from a single parse.
function generateComponent(path) {
  const file = readFileSync(join(ROOT, path), "utf8");
  // Parse once per language variant (TS targets vs JS targets), like the CLI.
  const tsJson = parseJsx(file, { filePath: path, typescript: true });
  const jsJson = parseJsx(file, { filePath: path, typescript: false });
  const outputs = [];
  for (const target of TARGET_LIST) {
    const options = { ...config, options: { ...config.options, [target]: optionsFor(target) } };
    const outputFilePath = renameComponentFile({ target, path, options });
    const ts = checkShouldOutputTypeScript({ options, target });
    const component = JSON.parse(JSON.stringify(ts ? tsJson : jsJson)); // clone: generators may mutate
    component.pluginData = { outputFilePath, outputDir: join(DEST, target), path, target };
    // Actual codegen + per-target override resolution happens in emit().
    outputs.push({ target, outputFilePath, component, options });
  }
  return outputs;
}

async function emit(path) {
  const outs = generateComponent(path);
  const written = [];
  for (const o of outs) {
    const overrideFilePath = join(OVERRIDES_DIR, o.target);
    const override = await getOverrideFile({
      filename: o.outputFilePath,
      path: overrideFilePath,
      target: o.target,
    });
    let code = override ?? undefined;
    if (code === undefined) {
      const genOpts = o.options.options[o.target];
      try {
        code = GENERATORS[o.target](genOpts)({ path, component: o.component });
      } catch (err) {
        // Angular-only: the generator HTML-escapes the string args of the
        // `setAttributes(el, ptAttrs(this.pt, "root"))` calls it synthesizes from
        // a JSX spread (`&quot;root&quot;`), then runs prettier over the result,
        // which throws on the stray `&` — before build-fix-angular.mjs can
        // unescape it. Retry that one component unformatted so the fixer gets its
        // chance. Every other target (and every other Angular component) keeps the
        // generator's formatting, so this cannot silently degrade the output.
        if (o.target !== "angular") throw err;
        code = GENERATORS[o.target]({ ...genOpts, prettier: false })({
          path,
          component: o.component,
        });
      }
    }
    code = transformImports({ target: o.target, options: o.options })(code);
    const dest = join(DEST, o.target, o.outputFilePath);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, code);
    written.push(relative(ROOT, dest));
  }
  return written;
}

// Emit one context module to every target, in that framework's own idiom (React
// createContext, Vue InjectionKey, Svelte context key, Angular injectable, …).
function emitContext(path) {
  const source = readFileSync(join(ROOT, path), "utf8");
  const parsed = parseContext(source, { name: basename(path).replace(/\.context\.lite\.ts$/, "") });
  if (!parsed) throw new Error(`${path}: parseContext returned nothing`);
  const written = [];
  for (const target of TARGET_LIST) {
    const gen = CONTEXT_GENERATORS[target];
    if (!gen) continue;
    const options = { ...config, options: { ...config.options, [target]: optionsFor(target) } };
    const ts = checkShouldOutputTypeScript({ options, target });
    let code = gen({ contextOptions: {} })({ context: parsed, options: optionsFor(target) });
    code = transformImports({ target, options })(code);
    const out = path.replace(/\.lite\.ts$/, ts ? ".ts" : ".js");
    const dest = join(DEST, target, out);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, code);
    written.push(relative(ROOT, dest));
  }
  return written;
}

// Remove a component's stale outputs across all targets (source deleted).
function removeOutputs(path) {
  for (const target of TARGET_LIST) {
    const options = { ...config, options: { ...config.options, [target]: optionsFor(target) } };
    const dest = join(DEST, target, renameComponentFile({ target, path, options }));
    if (existsSync(dest)) rmSync(dest);
  }
}

function outputsExist(path) {
  return TARGET_LIST.every((target) => {
    const options = { ...config, options: { ...config.options, [target]: optionsFor(target) } };
    return existsSync(join(DEST, target, renameComponentFile({ target, path, options })));
  });
}

async function main() {
  const t0 = process.hrtime.bigint();
  const gkey = globalKey();
  let manifest = { globalKey: null, files: {} };
  if (!NO_CACHE && existsSync(MANIFEST)) {
    try {
      manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
    } catch {}
  }
  const cacheUsable = !NO_CACHE && manifest.globalKey === gkey;

  const current = {};
  for (const p of componentPaths) current[p] = sha(readFileSync(join(ROOT, p), "utf8"));
  for (const p of contextPaths) current[p] = sha(readFileSync(join(ROOT, p), "utf8"));

  // Drop outputs for components that no longer exist (the CLI's clean()).
  for (const p of Object.keys(manifest.files)) if (!current[p]) removeOutputs(p);

  let built = 0;
  let cached = 0;
  for (const p of componentPaths) {
    const hit = cacheUsable && manifest.files[p] === current[p] && outputsExist(p);
    if (hit) {
      cached++;
      continue;
    }
    await emit(p);
    built++;
  }

  // Contexts are few and cheap; emit unconditionally so a stale one can never
  // survive a cache hit on the components that consume it.
  for (const p of contextPaths) emitContext(p);

  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(MANIFEST, JSON.stringify({ globalKey: gkey, files: current }, null, 0));

  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  console.log(
    `mitosis(incremental): ${built} generated, ${cached} cached, ${componentPaths.length} components × ${TARGET_LIST.length} targets in ${ms.toFixed(0)}ms` +
      (cacheUsable ? "" : " (cold — cache miss on build key)")
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
