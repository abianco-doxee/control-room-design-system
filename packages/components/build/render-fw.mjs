/**
 * Framework render harness — compile a compiled component (from dist/frameworks/*)
 * with its real framework toolchain and SSR-render it to HTML in Node.
 *
 * This is how the "compile to six frameworks" claim gets verified at RUNTIME, not
 * just type-checked: each target's output is fed through its own compiler + server
 * renderer, so a component that renders under React but breaks under Svelte/Solid/
 * Vue can't slip through. (React is covered by react-dom/server in the pkg gate.)
 * Used by tests/pkg-frameworks.test.mjs.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (fw, name, ext) =>
  readFileSync(join(ROOT, "dist", "frameworks", fw, "components", `${name}.${ext}`), "utf8");

/** Copy a target's compiled context module into `dir` as `cr.context.mjs` (+ a
 *  `.js` alias), matching the extensionless `./cr.context` specifier the Mitosis
 *  context generators emit. Silently skipped when the target has no context file. */
function stageContext(dir, fw) {
  for (const ext of ["ts", "js"]) {
    const from = join(ROOT, "dist", "frameworks", fw, "components", `cr.context.${ext}`);
    if (!existsSync(from)) continue;
    let code = readFileSync(from, "utf8");
    // The TS variants only carry type annotations we can drop for a runtime import.
    if (ext === "ts")
      code = code.replace(/<any>/g, "").replace(/:\s*[A-Za-z<>[\]{}, |]+(?=\s*=)/g, "");
    writeFileSync(join(dir, "cr.context.mjs"), code);
    return true;
  }
  return false;
}

/* One compile step per target, shared by the entry component and every nested
 * dependency staged beside it. */
async function compileSvelte(name) {
  const { compile } = await import("svelte/compiler");
  return compile(src("svelte", name, "svelte"), {
    generate: "ssr",
    css: "injected",
    filename: `${name}.svelte`,
  }).js.code;
}
async function compileSolid(name) {
  const babel = await import("@babel/core");
  const { code } = await babel.transformAsync(src("solid", name, "jsx"), {
    presets: [["babel-preset-solid", { generate: "ssr", hydratable: false }]],
    filename: `${name}.jsx`,
  });
  return code;
}
async function compileVue(name) {
  const sfc = await import("@vue/compiler-sfc");
  const esbuild = await import("esbuild");
  const { descriptor } = sfc.parse(src("vue", name, "vue"), { filename: `${name}.vue` });
  const compiled = sfc.compileScript(descriptor, { id: name, inlineTemplate: true });
  return (await esbuild.transform(compiled.content, { loader: "ts", format: "esm" })).code;
}

/** Stage every Cr* component the code imports as a sibling, COMPILED, recursively.
 *
 *  A component that NESTS another (CrDataGrid → CrCheckbox, CrInput → CrIcon)
 *  compiles to `import CrCheckbox from "./CrCheckbox"`, but the temp dir holds only
 *  the component under test, so the dynamic import fails to resolve. Staging the
 *  raw source is not enough either — Node cannot import a `.vue`/`.svelte` file, so
 *  each dependency has to go through the same compile step as the entry and be
 *  written as a plain `.mjs` that the (rewritten) specifier points at.
 *
 *  KNOWN LIMIT: only sibling `./Cr*` imports are staged. A component that also
 *  imports from `../lib/` (CrIcon pulls in the pixel icon pack) still cannot be
 *  rendered here, because that would mean staging a parent directory too. Affects
 *  CrIcon and anything nesting it (CrInput) — pre-existing, and a harness gap
 *  rather than a product one: those components build and ship correctly. */
/** Point a `../lib/…` specifier at the target's real compiled lib file.
 *
 *  The temp module sits in packages/components/, one level ABOVE components/, so
 *  a relative `../lib/…` would resolve outside the package and fail. Rewriting it
 *  to an absolute file URL is what makes CrIcon (and CrInput, which nests it)
 *  renderable — they used to be the one documented hole in this harness. */
function absolutiseLib(code, fw) {
  if (!fw) return code;
  const libDir = join(ROOT, "dist", "frameworks", fw, "lib");
  return code.replace(/(["'])\.\.\/lib\/([A-Za-z0-9/_.-]+?)\1/g, (m, _q, rel) => {
    const file = join(libDir, rel);
    return existsSync(file) ? JSON.stringify(pathToFileURL(file).href) : m;
  });
}

async function stageDeps(dir, fw, code, compileOne, seen) {
  let out = code;
  for (const m of [...code.matchAll(/from\s+["']\.\/(Cr[A-Za-z0-9]+)(?:\.[a-z]+)?["']/g)]) {
    const dep = m[1];
    out = out.split(m[0]).join(`from "./${dep}.mjs"`);
    if (seen.has(dep)) continue;
    seen.add(dep);
    let compiled;
    try {
      compiled = await compileOne(dep);
    } catch {
      continue; // not a component of this target (or has no output) — leave it
    }
    let rewritten = await stageDeps(dir, fw, compiled, compileOne, seen);
    // a dependency in the cascade imports the context as a sibling too
    rewritten = rewritten.replace(/(["'])\.\/cr\.context\1/g, '"./cr.context.mjs"');
    // …and may reach into ../lib/ (CrInput nests CrIcon, which pulls the icon pack)
    rewritten = absolutiseLib(rewritten, fw);
    writeFileSync(join(dir, `${dep}.mjs`), rewritten);
  }
  return out;
}

/** write `code` to a fresh temp module inside the repo (so it resolves node_modules)
 *  and dynamic-import it; the temp dir is removed after. */
async function loadTemp(code, filename, fw, compileOne) {
  const dir = mkdtempSync(join(ROOT, ".fwtmp-"));
  try {
    const p = join(dir, filename);
    // Components that join the pt/locale cascade import the context as a sibling.
    // Mitosis emits it EXTENSIONLESS (`from "./cr.context"`), which Node's ESM
    // resolver rejects, and the temp dir holds only the component under test — so
    // stage the context beside it and point the specifier at the explicit file.
    if (fw && stageContext(dir, fw)) {
      code = code.replace(/(["'])\.\/cr\.context\1/g, '"./cr.context.mjs"');
    }
    // Nested components are imported as siblings; stage the whole tree.
    if (compileOne) code = await stageDeps(dir, fw, code, compileOne, new Set());
    // `../lib/…` is relative to components/, but the temp dir sits one level
    // higher (in packages/components/), so the specifier would resolve outside
    // the package. Point it at the real file instead of staging a parent dir —
    // that is what used to make CrIcon (and CrInput, which nests it) unrenderable.
    code = absolutiseLib(code, fw);
    writeFileSync(p, code);
    return {
      mod: await import(pathToFileURL(p).href),
      cleanup: () => rmSync(dir, { recursive: true, force: true }),
    };
  } catch (e) {
    rmSync(dir, { recursive: true, force: true });
    throw e;
  }
}

export async function renderSvelte(name, props = {}) {
  const { compile } = await import("svelte/compiler");
  const { js } = compile(src("svelte", name, "svelte"), {
    generate: "ssr",
    css: "injected",
    filename: `${name}.svelte`,
  });
  const { mod, cleanup } = await loadTemp(js.code, `${name}.mjs`, "svelte", compileSvelte);
  try {
    return mod.default.render(props).html;
  } finally {
    cleanup();
  }
}

export async function renderSolid(name, props = {}) {
  const babel = await import("@babel/core");
  const { code } = await babel.transformAsync(src("solid", name, "jsx"), {
    presets: [["babel-preset-solid", { generate: "ssr", hydratable: false }]],
    filename: `${name}.jsx`,
  });
  const { mod, cleanup } = await loadTemp(code, `${name}.mjs`, "solid", compileSolid);
  try {
    const web = await import("solid-js/web");
    return web.renderToString(() => mod.default(props));
  } finally {
    cleanup();
  }
}

export async function renderVue(name, props = {}) {
  const sfc = await import("@vue/compiler-sfc");
  const esbuild = await import("esbuild");
  const vue = await import("vue");
  const { renderToString } = await import("@vue/server-renderer");
  const { descriptor } = sfc.parse(src("vue", name, "vue"), { filename: `${name}.vue` });
  const compiled = sfc.compileScript(descriptor, { id: name, inlineTemplate: true });
  const js = (await esbuild.transform(compiled.content, { loader: "ts", format: "esm" })).code;
  const { mod, cleanup } = await loadTemp(js, `${name}.mjs`, "vue", compileVue);
  try {
    return await renderToString(vue.createSSRApp(mod.default, props));
  } finally {
    cleanup();
  }
}

/**
 * Qwik SSR, without a Vite build.
 *
 * The obstacle was never the renderer — it is that `component$` is a marker the
 * OPTIMIZER lowers into `componentQrl(inlinedQrl(...))`. Render the untransformed
 * source and Qwik resumes an empty container: no error, no markup, which is what
 * made this look unreachable. The optimizer is available standalone as
 * `createOptimizer().transformModulesSync`, so the Vite/rollup pipeline (and its
 * chunk-naming and manifest requirements) can be skipped entirely:
 *
 *   entryStrategy "inline"  keeps every QRL in the one module, so there are no
 *                           lazy chunks to resolve and no manifest to supply
 *   mode "prod"             actually lowers component$ (mode "lib" preserves it)
 *
 * The server runtime is loaded through `createRequire`, i.e. the CJS build: the
 * ESM one reads `import.meta.env.BASE_URL`, which only exists under Vite, while
 * the CJS build has that inlined at publish time. `@qwik-client-manifest` is a
 * bare specifier Qwik's server imports; there is no manifest without a client
 * build, so it is stubbed to `undefined`, which is the "no manifest" path.
 */
export async function renderQwik(name, props = {}) {
  const { createOptimizer } = await import("@builder.io/qwik/optimizer");
  const optimizer = await createOptimizer();
  const srcDir = join(ROOT, "dist", "frameworks", "qwik", "components");

  const transform = (file, code) => {
    const res = optimizer.transformModulesSync({
      srcDir,
      input: [{ path: file, code }],
      entryStrategy: { type: "inline" },
      minify: "none",
      sourceMaps: false,
      transpileTs: true,
      transpileJsx: true,
      mode: "prod",
    });
    const fatal = res.diagnostics.filter((d) => d.category === "error");
    if (fatal.length) throw new Error(`${file}: ${fatal[0].message}`);
    return res.modules.find((m) => m.path.endsWith(".js")).code;
  };

  const dir = mkdtempSync(join(ROOT, ".fwtmp-"));
  let cleanupGlobalPath = () => {};
  try {
    stageContext(dir, "qwik");
    const staged = new Set();
    const stage = (dep) => {
      if (staged.has(dep)) return;
      staged.add(dep);
      let code;
      try {
        code = transform(`${dep}.tsx`, src("qwik", dep, "tsx"));
      } catch {
        return; // not a component of this target
      }
      for (const m of code.matchAll(/from\s+["']\.\/(Cr[A-Za-z0-9]+)(?:\.tsx)?["']/g)) stage(m[1]);
      writeFileSync(join(dir, `${dep}.mjs`), rewrite(code));
    };
    const rewrite = (code) =>
      absolutiseLib(code, "qwik")
        .replace(/(["'])\.\/cr\.context\1/g, '"./cr.context.mjs"')
        .replace(/from\s+(["'])\.\/(Cr[A-Za-z0-9]+)(?:\.tsx)?\1/g, 'from "./$2.mjs"');

    const entry = rewrite(transform(`${name}.tsx`, src("qwik", name, "tsx")));
    for (const m of entry.matchAll(/from\s+["']\.\/(Cr[A-Za-z0-9]+)\.mjs["']/g)) stage(m[1]);
    const p = join(dir, `${name}.mjs`);
    writeFileSync(p, entry);

    // The component module and the server runtime MUST come from the same Qwik
    // instance: mixing the ESM component with the CJS server loads two copies of
    // the runtime, and the render then resumes an EMPTY container with no error —
    // exactly the dead end that made this harness look unreachable. Both sides are
    // ESM here; @qwik-client-manifest is stubbed so the ESM server never reaches
    // the import.meta.env branch that only exists under Vite.
    // Everything must run on ONE Qwik instance, and that instance has to be the
    // CJS build: the ESM server statically imports "@qwik-client-manifest", a bare
    // specifier with no package behind it, which Node rejects outright unless a
    // resolver hook is installed (not something a plain `node --test` can do). The
    // CJS server has no such import. So the component is transpiled to CJS as well
    // and required from the same graph — mixing the two loads two runtimes, and the
    // render then resumes an EMPTY container with no error at all, which is exactly
    // what made this harness look unreachable.
    const esbuild = await import("esbuild");
    // require() cannot resolve a file:// specifier, and absolutiseLib emits those
    // for the ../lib/ imports — convert them back to plain absolute paths.
    const forRequire = readFileSync(p, "utf8").replace(
      /(["'])file:\/\/([^"']+)\1/g,
      (_m, q, path) => `${q}${decodeURIComponent(path)}${q}`
    );
    const cjs = (await esbuild.transform(forRequire, { loader: "js", format: "cjs" })).code;
    const cp = join(dir, `${name}.cjs`);
    writeFileSync(cp, cjs);
    // qwik/server requires "@qwik-client-manifest" — the module its CLIENT build
    // emits. There is no client build here, and the specifier is a bare scope with
    // no package name, so it cannot be vendored into node_modules (npm rejects the
    // name, and a fresh install would drop it anyway). Instead stand a throwaway
    // package up inside the temp dir: require() walks node_modules upward from the
    // requiring file, so one beside the module under test is found first, and it
    // disappears with the rest of the temp dir.
    const stub = join(dir, "node_modules", "@qwik-client-manifest");
    mkdirSync(stub, { recursive: true });
    writeFileSync(
      join(stub, "package.json"),
      '{"name":"qcm","version":"0.0.0","main":"index.cjs"}'
    );
    writeFileSync(join(stub, "index.cjs"), "module.exports = { manifest: undefined };\n");

    // Resolution has to work for qwik/server.cjs, which lives in the real
    // node_modules — an upward walk from THERE never reaches the temp dir. Rather
    // than fight the resolver, satisfy the lookup directly: seed require.cache with
    // a module registered under the id the resolver would have produced, so the
    // server's require() is a cache hit and never resolves at all.
    const { Module } = await import("node:module");
    const stubId = join(stub, "index.cjs");
    const stubModule = new Module(stubId, null);
    stubModule.filename = stubId;
    stubModule.loaded = true;
    stubModule.exports = { manifest: undefined };
    Module._cache[stubId] = stubModule;
    const origResolve = Module._resolveFilename;
    Module._resolveFilename = function (request, ...rest) {
      if (request === "@qwik-client-manifest") return stubId;
      return origResolve.call(this, request, ...rest);
    };
    cleanupGlobalPath = () => {
      Module._resolveFilename = origResolve;
      delete Module._cache[stubId];
    };

    const require = createRequire(cp);
    const mod = require(cp);
    const { renderToString } = require("@builder.io/qwik/server");
    const { jsx } = require("@builder.io/qwik");
    // With entryStrategy "inline" every QRL lives in this one module, but the
    // renderer still asks a symbol mapper where each symbol came from and throws
    // Code(31) ("QRLs can not be dynamically resolved") when nothing answers.
    // There are no chunks to look up, so map every symbol to this module.
    const symbolMapper = (symbolName) => [symbolName, `./${name}.cjs`];
    const { html } = await renderToString(jsx(mod.default, props), {
      containerTagName: "div",
      qwikLoader: { include: "never" },
      symbolMapper,
    });
    return html;
  } finally {
    cleanupGlobalPath();
    rmSync(dir, { recursive: true, force: true });
  }
}

export const RENDERERS = {
  vue: renderVue,
  svelte: renderSvelte,
  solid: renderSolid,
  qwik: renderQwik,
};

/**
 * Angular can't be SSR-rendered in plain Node (its distributed packages are
 * partially-compiled and need the Angular build linker), so instead we execute the
 * component's LOGIC on the real @angular/core: transpile it (esbuild, legacy
 * decorators), stub the metadata-only @angular/common import, `new` it, apply
 * @Input props, and return the instance + source so tests can assert the
 * @Input-driven getters, the @Output EventEmitter, and the @Component template.
 * A genuine runtime step beyond a build-only check.
 */
export async function instantiateAngular(name, props = {}) {
  const esbuild = await import("esbuild");
  const dir = mkdtempSync(join(ROOT, ".fwtmp-"));
  try {
    const stub = join(dir, "ng-common-stub.js");
    writeFileSync(stub, "export class CommonModule {}\n");
    const entry = join(ROOT, "dist", "frameworks", "angular", "components", `${name}.js`);
    const source = readFileSync(entry, "utf8");
    const out = join(dir, `${name}.mjs`);
    await esbuild.build({
      entryPoints: [entry],
      bundle: true,
      platform: "node",
      format: "esm",
      outfile: out,
      external: ["@angular/core", "rxjs", "rxjs/*", "tslib"],
      alias: { "@angular/common": stub },
      loader: { ".js": "ts" },
      tsconfigRaw: '{"compilerOptions":{"experimentalDecorators":true}}',
      logLevel: "silent",
    });
    const mod = await import(pathToFileURL(out).href);
    const instance = new mod.default();
    for (const [k, v] of Object.entries(props)) instance[k] = v;
    return { instance, source, module: mod };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
