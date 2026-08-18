/**
 * Browser bundles, one per target — the client-side half of the runtime proof.
 *
 * Everything else in this repo verifies components on the SERVER: render-fw.mjs
 * SSR-renders five targets and instantiates Angular, and that is where ~25 real
 * defects were caught. But SSR only proves a component produces the right markup
 * once. It says nothing about whether an event handler fires, whether state
 * updates re-render, or whether a lifecycle hook runs — the entire reason these
 * are components rather than templates. React's islands suite is the only place
 * that was ever checked, and only for React.
 *
 * This bundles a component (plus a mount function) for a real browser, per
 * target, so a Playwright spec can click it and assert what happened. Each target
 * gets the toolchain a consumer would use:
 *
 *   react    esbuild alone — the output is already TSX
 *   solid    babel-preset-solid, then esbuild
 *   vue      @vue/compiler-sfc (inlineTemplate), then esbuild
 *   svelte   svelte/compiler generate:"client", then esbuild
 *   qwik     the optimizer (entryStrategy inline, mode prod) — component$ is a
 *            marker it must lower, exactly as in the SSR harness
 *   angular  esbuild with decorators + the JIT compiler, bootstrapped through
 *            platform-browser. ~3MB because JIT ships the compiler; acceptable
 *            for a test bundle, and the only way to run Angular without the AOT
 *            build pipeline.
 *
 * Two resolution details that are easy to get wrong and produce confusing errors:
 *
 *   - A plugin returning `contents` must also return `resolveDir`, or the
 *     component's own `./cr.context` and `../lib/pt.ts` imports resolve against
 *     the wrong directory.
 *   - `svelte/*` has to resolve against THIS package, not the component's
 *     directory, so it gets its own onResolve hook. Without it the compiled
 *     output fails on `svelte/internal/client`.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const fw = (target) => join(ROOT, "dist", "frameworks", target);

/** Resolve a bare specifier against the WORKSPACE ROOT.
 *
 *  Not against this package: packages/components declares `svelte` as a peer with
 *  range ">=4 <6", so pnpm installs a nested svelte@4 beside it. Resolving from
 *  here picks up that copy, and bundling svelte@5-compiled output against the v4
 *  runtime fails with "No matching export in svelte/src/runtime/ssr.js". The
 *  compiler that produced the output is the root one, so the runtime must be too. */
const WORKSPACE = join(ROOT, "..", "..");
const rootRequire = createRequire(pathToFileURL(join(WORKSPACE, "package.json")).href);
/** Resolve against the workspace root's node_modules, explicitly.
 *
 *  `import.meta.resolve(spec, base)` is NOT enough: it still resolves relative to
 *  the importing module, so from here it finds the nested copy anyway. createRequire
 *  bound to the root package.json walks the root's node_modules chain instead. */
const resolveFromRoot = (spec) => rootRequire.resolve(spec);

const COMMON = {
  bundle: true,
  format: "iife",
  write: false,
  logLevel: "silent",
  conditions: ["browser", "import", "default"],
  define: { "process.env.NODE_ENV": '"production"' },
};

/* Each builder returns the entry source that defines window.__mount(el, props).
 * The spec calls it, then interacts with whatever it rendered. */
const ENTRIES = {
  react: (dir, name) => `
    import { createElement } from "react";
    import { createRoot } from "react-dom/client";
    import Cmp from "${join(dir, "components", `${name}.tsx`)}";
    window.__mount = (el, props) => createRoot(el).render(createElement(Cmp, props));
  `,
  solid: (dir, name) => `
    import { render } from "solid-js/web";
    import Cmp from "${join(dir, "components", `${name}.jsx`)}";
    window.__mount = (el, props) => render(() => Cmp(props), el);
  `,
  vue: (dir, name) => `
    import { createApp, h } from "vue";
    import Cmp from "${join(dir, "components", `${name}.vue`)}";
    window.__mount = (el, props) => createApp({ render: () => h(Cmp, props) }).mount(el);
  `,
  svelte: (dir, name) => `
    import { mount } from "svelte";
    import Cmp from "${join(dir, "components", `${name}.svelte`)}";
    window.__mount = (el, props) => mount(Cmp, { target: el, props });
  `,
  qwik: (dir, name) => `
    import { render } from "@builder.io/qwik";
    import { jsx } from "@builder.io/qwik/jsx-runtime";
    import Cmp from "${join(dir, "components", `${name}.tsx`)}";
    window.__mount = (el, props) => render(el, jsx(Cmp, props));
  `,
  // Angular has no "render this component with these props" call — a component
  // is instantiated by a host template that binds its @Inputs. So the host is
  // built at mount time from the prop names, binding each through a component
  // field, and outputs are wired by name so a click can be observed.
  angular: (dir, name) => `
    import "@angular/compiler";
    import { Component } from "@angular/core";
    import { bootstrapApplication } from "@angular/platform-browser";
    import Cmp, { ${name}Module } from "${join(dir, "components", `${name}.js`)}";
    window.__mount = (el, props) => {
      const selector = (Cmp["\u0275cmp"] && Cmp["\u0275cmp"].selectors?.[0]?.[0]) ||
        Reflect.get(Cmp, "__selector") || "${name
          .replace(/^Cr/, "cr-")
          .replace(/([a-z])([A-Z])/g, "$1-$2")
          .toLowerCase()}";
      const inputs = Object.keys(props).filter((k) => typeof props[k] !== "function");
      const outputs = Object.keys(props).filter((k) => typeof props[k] === "function");
      const bind = inputs.map((k) => \`[\${k}]="p.\${k}"\`).join(" ");
      const on = outputs.map((k) => \`(\${k})="h('\${k}', $event)"\`).join(" ");
      @Component({
        standalone: true,
        selector: "app-root",
        imports: [${name}Module],
        template: \`<\${selector} \${bind} \${on}></\${selector}>\`,
      })
      class Root {
        p = props;
        h(key, value) { props[key](value); }
      }
      const host = document.createElement("app-root");
      el.appendChild(host);
      return bootstrapApplication(Root);
    };
  `,
};

function sveltePkgPlugin() {
  // Redirect every `svelte*` specifier to the WORKSPACE ROOT copy.
  //
  // packages/components declares svelte as a peer `>=4 <6`, so pnpm installs a
  // nested svelte@4 beside it — and the compiled component sits in that package,
  // so esbuild's own resolution finds v4 first. Bundling v5-compiled output
  // against the v4 runtime fails with "No matching export in
  // svelte/src/runtime/ssr.js", which reads like a compiler bug and is not one.
  //
  // Resolution is handed back to esbuild against the root package directory
  // rather than resolved here, because import.meta.resolve does not apply the
  // `browser` condition — it would hand back index-server.js for a browser bundle.
  const sveltePkgDir = dirname(resolveFromRoot("svelte/package.json"));
  const pkg = JSON.parse(readFileSync(join(sveltePkgDir, "package.json"), "utf8"));

  /** Walk svelte's own exports map, preferring the browser/import conditions. */
  const fromExports = (subpath) => {
    const entry = pkg.exports?.[subpath === "svelte" ? "." : `.${subpath.slice(6)}`];
    if (!entry) return null;
    const pick = (e) =>
      typeof e === "string" ? e : pick(e.browser ?? e.import ?? e.default ?? Object.values(e)[0]);
    const rel = pick(entry);
    return rel ? join(sveltePkgDir, rel) : null;
  };

  return {
    name: "svelte-pkg",
    setup(b) {
      b.onResolve({ filter: /^svelte($|\/)/ }, (a) => {
        const hit = fromExports(a.path);
        return hit ? { path: hit } : null;
      });
    },
  };
}

async function pluginsFor(target) {
  switch (target) {
    case "solid": {
      const babel = await import("@babel/core");
      return [
        {
          name: "solid",
          setup(b) {
            b.onLoad({ filter: /frameworks[/\\]solid[/\\].*\.jsx$/ }, async (a) => {
              const res = await babel.transformAsync(readFileSync(a.path, "utf8"), {
                presets: [["babel-preset-solid", {}]],
                filename: a.path,
                babelrc: false,
                configFile: false,
              });
              return { contents: res.code, loader: "js", resolveDir: dirname(a.path) };
            });
          },
        },
      ];
    }
    case "vue": {
      const sfc = await import("@vue/compiler-sfc");
      return [
        {
          name: "vue",
          setup(b) {
            b.onLoad({ filter: /\.vue$/ }, (a) => {
              const { descriptor } = sfc.parse(readFileSync(a.path, "utf8"), { filename: a.path });
              const compiled = sfc.compileScript(descriptor, { id: a.path, inlineTemplate: true });
              return { contents: compiled.content, loader: "ts", resolveDir: dirname(a.path) };
            });
          },
        },
      ];
    }
    case "svelte": {
      // The COMPILER must come from the workspace root too. Imported bare it
      // resolves to the nested svelte@4 that packages/components' `>=4 <6` peer
      // pulls in, which emits v4 output — then the v5 runtime cannot link it.
      const svelteCompiler = await import(pathToFileURL(resolveFromRoot("svelte/compiler")).href);
      const compile = svelteCompiler.compile ?? svelteCompiler.default?.compile;
      return [
        sveltePkgPlugin(),
        {
          name: "svelte",
          setup(b) {
            b.onLoad({ filter: /\.svelte$/ }, (a) => {
              const { js } = compile(readFileSync(a.path, "utf8"), {
                filename: a.path,
                generate: "client",
              });
              return { contents: js.code, loader: "js", resolveDir: dirname(a.path) };
            });
          },
        },
      ];
    }
    case "qwik": {
      const { createOptimizer } = await import("@builder.io/qwik/optimizer");
      const optimizer = await createOptimizer();
      return [
        {
          name: "qwik",
          setup(b) {
            b.onLoad({ filter: /frameworks[/\\]qwik[/\\].*\.tsx$/ }, (a) => {
              const res = optimizer.transformModulesSync({
                srcDir: dirname(a.path),
                input: [{ path: a.path.split(/[/\\]/).pop(), code: readFileSync(a.path, "utf8") }],
                entryStrategy: { type: "inline" },
                minify: "none",
                sourceMaps: false,
                transpileTs: true,
                transpileJsx: true,
                mode: "prod",
              });
              const fatal = res.diagnostics.filter((d) => d.category === "error");
              if (fatal.length) throw new Error(`${a.path}: ${fatal[0].message}`);
              const mod = res.modules.find((m) => m.path.endsWith(".js"));
              return { contents: mod.code, loader: "js", resolveDir: dirname(a.path) };
            });
          },
        },
      ];
    }
    default:
      return [];
  }
}

/** Build a browser IIFE that exposes `window.__mount(el, props)` for `name`. */
export async function bundleClient(target, name) {
  const dir = fw(target);
  const entry = ENTRIES[target];
  if (!entry) throw new Error(`no client entry for target ${target}`);

  const opts = {
    ...COMMON,
    // resolveDir is the WORKSPACE root, not this package: the entry imports the
    // framework runtimes (svelte, vue, react…), and packages/components has a
    // nested svelte@4 from its peer range that would win from here.
    stdin: { contents: entry(dir, name), resolveDir: WORKSPACE, loader: "ts" },
    plugins: await pluginsFor(target),
  };
  if (target === "react") opts.loader = { ".ts": "tsx", ".tsx": "tsx" };
  if (target === "angular") {
    // Decorators are the whole Angular authoring model, and useDefineForClassFields
    // must stay off or @Input fields are redefined as own properties and the
    // decorator metadata is lost.
    opts.tsconfigRaw =
      '{"compilerOptions":{"experimentalDecorators":true,"useDefineForClassFields":false}}';
    opts.loader = { ".js": "ts" };
  }

  const out = await esbuild.build(opts);
  return out.outputFiles[0].text;
}

export const CLIENT_TARGETS = Object.keys(ENTRIES);
