/**
 * Build a browser bundle for ONE Angular component, the way a consumer does.
 *
 * The other five targets are driven in a browser by compiling the component with
 * its own toolchain and mounting it (packages/components/build/bundle-client.mjs).
 * Angular resisted that, because a browser mount means JIT, and JIT kept failing
 * with NG0203 — the injector could not construct a generated component even
 * though every piece of metadata was present and the same context injected fine
 * into a hand-written one.
 *
 * The fix is to stop using JIT at all. `ng build` runs AOT: ngc compiles each
 * component into a `ɵcmp` definition with its factory and template instructions
 * baked in, so the browser never runs the compiler and never has to reflect over
 * a constructor. That is both the path consumers actually take AND the one that
 * works here.
 *
 * So: stage the component plus a generated host app, run ngc for real (emitting
 * this time, not just type-checking), then bundle the emitted JS with esbuild.
 * The result exposes `window.__mount(el, props)` like every other target.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const HERE = join(dirname(fileURLToPath(import.meta.url)), "..");
const WORKSPACE = join(HERE, "..", "..");
const COMPONENTS = join(HERE, "..", "components", "dist", "frameworks", "angular");
const require = createRequire(join(HERE, "package.json"));

/** kebab-case selector Mitosis gives a component: CrButton → cr-button. */
const selectorOf = (name) =>
  name
    .replace(/^Cr/, "cr-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();

/**
 * @param name    component to mount, e.g. "CrButton"
 * @param inputs  prop names to bind as @Inputs
 * @param outputs prop names to wire as @Outputs (recorded into window.__calls)
 */
export async function bundleAngular(name, inputs = [], outputs = []) {
  const work = join(HERE, `.aot-bundle-${name}`);
  rmSync(work, { recursive: true, force: true });
  mkdirSync(join(work, "src", "components"), { recursive: true });

  // Every component, not just the entry: a component may nest others, and ngc
  // needs the whole graph. Cheap enough — this runs once per mounted component.
  cpSync(join(COMPONENTS, "components"), join(work, "src", "components"), { recursive: true });
  for (const f of require("node:fs").readdirSync(join(work, "src", "components"))) {
    if (f.endsWith(".js")) {
      const p = join(work, "src", "components", f);
      cpSync(p, p.replace(/\.js$/, ".ts"));
      rmSync(p);
    }
  }
  cpSync(join(HERE, "..", "components", "lib"), join(work, "src", "lib"), { recursive: true });
  // The sources import each other with explicit `.ts` extensions, which needs
  // allowImportingTsExtensions — and that option forbids emitting. Since this
  // build MUST emit, the extensions are stripped from the staged copies instead.
  const stripTsExt = (dir) => {
    for (const f of require("node:fs").readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, f.name);
      if (f.isDirectory()) stripTsExt(p);
      else if (f.name.endsWith(".ts")) {
        writeFileSync(
          p,
          readFileSync(p, "utf8").replace(/(from\s+["'])(\.[^"']*?)\.ts(["'])/g, "$1$2$3")
        );
      }
    }
  };
  mkdirSync(join(work, "src", "lib", "icons"), { recursive: true });
  cpSync(join(HERE, "..", "icons", "pixel.ts"), join(work, "src", "lib", "icons", "pixel.ts"));
  stripTsExt(join(work, "src"));

  const selector = selectorOf(name);
  const bind = inputs.map((k) => `[${k}]="p.${k}"`).join(" ");
  const on = outputs.map((k) => `(${k})="rec('${k}', $event)"`).join(" ");

  // The host app. AOT needs a real component to compile, so the fixture is
  // generated as source rather than assembled in the browser.
  writeFileSync(
    join(work, "src", "main.ts"),
    `import { Component } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import Cmp, { ${name}Module } from "./components/${name}";

@Component({
  // Standalone host: importing BrowserModule drags in Angular internals
  // (_PlatformLocation) that are still JIT-compiled in the published package, and
  // the bundle has no compiler. A standalone component importing only the
  // component's own NgModule avoids that entirely.
  standalone: true,
  imports: [${name}Module],
  selector: "app-root",
  template: \`<${selector} ${bind} ${on}></${selector}>\`,
})
export class HostComponent {
  p: any = (window as any).__props || {};
  rec(key: string, value: any) {
    ((window as any).__calls ||= []).push([key, value]);
  }
}

(window as any).__bootstrap = () => bootstrapApplication(HostComponent);
`
  );

  writeFileSync(
    join(work, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "es2022",
          module: "esnext",
          moduleResolution: "bundler",
          experimentalDecorators: true,
          useDefineForClassFields: false,
          strict: false,
          noImplicitAny: false,
          skipLibCheck: true,
          rootDir: "./src",
          outDir: "./out",
          declaration: false,
          allowImportingTsExtensions: false,
          // EMIT this time. The compile gate type-checks with noEmit; here the
          // emitted ɵcmp definitions are the whole point.
          noEmit: false,
        },
        include: ["src/**/*.ts"],
        angularCompilerOptions: { compilationMode: "full", strictTemplates: false },
      },
      null,
      2
    )
  );

  const {
    performCompilation,
    readConfiguration,
    formatDiagnostics,
  } = require("@angular/compiler-cli");
  const config = readConfiguration(join(work, "tsconfig.json"));
  const { diagnostics } = performCompilation({
    rootNames: config.rootNames,
    options: config.options,
  });
  const fatal = diagnostics.filter((d) => d.category === 1 && d.code !== 2307);
  if (fatal.length) {
    rmSync(work, { recursive: true, force: true });
    throw new Error(`ngc failed for ${name}:\n${formatDiagnostics(fatal)}`);
  }

  const entry = join(work, "out", "main.js");
  if (!existsSync(entry)) {
    rmSync(work, { recursive: true, force: true });
    throw new Error(`ngc emitted no main.js for ${name}`);
  }

  // Angular's published packages are PARTIALLY compiled: they ship
  // `ɵɵngDeclareInjectable`-style declarations that the Angular build linker
  // expands into real definitions. Without that step the browser hits
  // "_PlatformLocation needs to be compiled using the JIT compiler", because the
  // bundle deliberately has no compiler in it. `ng build` runs this linker as a
  // babel plugin, so the fixture does too.
  const babel = await import(pathToFileURL(require.resolve("@babel/core")).href);
  const { createEs2015LinkerPlugin } = require("@angular/compiler-cli/linker/babel");
  // The plugin needs a filesystem adapter; without it it throws "Cannot read
  // properties of undefined (reading resolve)" on the first Angular file.
  const { NodeJSFileSystem } = require("@angular/compiler-cli/private/localize");
  const linkerPlugin = createEs2015LinkerPlugin({
    fileSystem: new NodeJSFileSystem(),
    linkerJitMode: false,
    logger: { debug() {}, info() {}, warn() {}, error() {} },
  });
  const linkAngular = {
    name: "angular-linker",
    setup(b) {
      b.onLoad({ filter: /[/\\]@angular[/\\].*\.mjs$/ }, async (a) => {
        const src = readFileSync(a.path, "utf8");
        const res = await babel.transformAsync(src, {
          filename: a.path,
          plugins: [linkerPlugin],
          babelrc: false,
          configFile: false,
          compact: false,
          sourceMaps: false,
        });
        return { contents: res.code, loader: "js" };
      });
    },
  };

  const built = await esbuild.build({
    plugins: [linkAngular],
    entryPoints: [entry],
    bundle: true,
    format: "iife",
    write: false,
    logLevel: "silent",
    conditions: ["browser", "import", "default"],
    define: { "process.env.NODE_ENV": '"production"' },
    // The emitted JS imports @angular/* bare; resolve from the workspace so it
    // picks up the same copies everything else uses.
    nodePaths: [join(WORKSPACE, "node_modules")],
  });

  if (!process.env.CR_KEEP) rmSync(work, { recursive: true, force: true });
  return built.outputFiles[0].text;
}
