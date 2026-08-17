/**
 * Framework render harness — compile a compiled component (from dist/frameworks/*)
 * with its real framework toolchain and SSR-render it to HTML in Node.
 *
 * This is how the "compile to six frameworks" claim gets verified at RUNTIME, not
 * just type-checked: each target's output is fed through its own compiler + server
 * renderer, so a component that renders under React but breaks under Svelte/Solid/
 * Vue can't slip through. (React is covered by react-dom/server in the pkg gate;
 * Qwik by its import gate.) Used by tests/pkg-frameworks.test.mjs.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
    if (ext === "ts") code = code.replace(/<any>/g, "").replace(/:\s*[A-Za-z<>\[\]{}, |]+(?=\s*=)/g, "");
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
    generate: "ssr", css: "injected", filename: `${name}.svelte`,
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

export const RENDERERS = { vue: renderVue, svelte: renderSvelte, solid: renderSolid };

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
