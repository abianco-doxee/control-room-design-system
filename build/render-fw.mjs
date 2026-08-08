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
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (fw, name, ext) => readFileSync(join(ROOT, "dist", "frameworks", fw, "components", `${name}.${ext}`), "utf8");

/** write `code` to a fresh temp module inside the repo (so it resolves node_modules)
 *  and dynamic-import it; the temp dir is removed after. */
async function loadTemp(code, filename) {
  const dir = mkdtempSync(join(ROOT, ".fwtmp-"));
  try {
    const p = join(dir, filename);
    writeFileSync(p, code);
    return { mod: await import(pathToFileURL(p).href), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
  } catch (e) {
    rmSync(dir, { recursive: true, force: true });
    throw e;
  }
}

export async function renderSvelte(name, props = {}) {
  const { compile } = await import("svelte/compiler");
  const { js } = compile(src("svelte", name, "svelte"), { generate: "ssr", css: "injected", filename: `${name}.svelte` });
  const { mod, cleanup } = await loadTemp(js.code, `${name}.mjs`);
  try { return mod.default.render(props).html; } finally { cleanup(); }
}

export async function renderSolid(name, props = {}) {
  const babel = await import("@babel/core");
  const { code } = await babel.transformAsync(src("solid", name, "jsx"), {
    presets: [["babel-preset-solid", { generate: "ssr", hydratable: false }]],
    filename: `${name}.jsx`,
  });
  const { mod, cleanup } = await loadTemp(code, `${name}.mjs`);
  try {
    const web = await import("solid-js/web");
    return web.renderToString(() => mod.default(props));
  } finally { cleanup(); }
}

export async function renderVue(name, props = {}) {
  const sfc = await import("@vue/compiler-sfc");
  const esbuild = await import("esbuild");
  const vue = await import("vue");
  const { renderToString } = await import("@vue/server-renderer");
  const { descriptor } = sfc.parse(src("vue", name, "vue"), { filename: `${name}.vue` });
  const compiled = sfc.compileScript(descriptor, { id: name, inlineTemplate: true });
  const js = (await esbuild.transform(compiled.content, { loader: "ts", format: "esm" })).code;
  const { mod, cleanup } = await loadTemp(js, `${name}.mjs`);
  try { return await renderToString(vue.createSSRApp(mod.default, props)); } finally { cleanup(); }
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
