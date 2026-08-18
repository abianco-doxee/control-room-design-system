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
/** Build ONE bundle hosting MANY components, exposing
 *  `window.__mountByName(name, el, props)`.
 *
 *  Angular's host template is generated at build time, so unlike the other
 *  targets a registry needs one host component per entry — but they all compile
 *  in a single ngc run, which is what matters: ngc costs ~3s per invocation, so
 *  81 separate builds would be four and a half minutes. */
export async function bundleAngularAll(entries) {
  return buildAngular(entries, "registry");
}

export async function bundleAngular(name, inputs = [], outputs = []) {
  return buildAngular([{ name, inputs, outputs }], name);
}

async function buildAngular(entries, tag) {
  // Unique per build: Playwright runs specs in parallel workers, and a shared
  // work directory means two ngc runs racing on the same files (ENOTEMPTY, then
  // "emitted no main.js").
  const work = join(
    HERE,
    `.aot-bundle-${tag}-${process.pid}-${Math.random().toString(36).slice(2, 8)}`
  );
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

  const hosts = entries.map(({ name, inputs = [], outputs = [] }, i) => {
    const selector = selectorOf(name);
    const bind = inputs.map((k) => `[${k}]="p.${k}"`).join(" ");
    const on = outputs.map((k) => `(${k})="rec('${k}', $event)"`).join(" ");
    return {
      name,
      cls: `Host${i}`,
      src: `@Component({
  standalone: true,
  imports: [${name}Module],
  selector: "app-host-${i}",
  template: \`<${selector} ${bind} ${on}></${selector}>\`,
})
export class Host${i} {
  p: any = (window as any).__props || {};
  rec(key: string, value: any) {
    ((window as any).__calls ||= []).push([key, value]);
  }
}`,
    };
  });

  // The host app. AOT needs real components to compile, so the fixtures are
  // generated as source rather than assembled in the browser.
  writeFileSync(
    join(work, "src", "main.ts"),
    `import { Component } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
${entries.map(({ name }) => `import { ${name}Module } from "./components/${name}";`).join("\n")}

${hosts.map((h) => h.src).join("\n\n")}

const REGISTRY: any = { ${hosts.map((h) => `"${h.name}": ${h.cls}`).join(", ")} };

(window as any).__mountByName = (name: string, el: any, props: any) => {
  (window as any).__props = props;
  const tag = "app-host-" + Object.keys(REGISTRY).indexOf(name);
  el.appendChild(document.createElement(tag));
  return bootstrapApplication(REGISTRY[name]);
};
(window as any).__bootstrap = () => (window as any).__mountByName(
  ${JSON.stringify(entries[0]?.name ?? "")},
  document.querySelector("#app"),
  (window as any).__props || {}
);
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
    throw new Error(`ngc failed for ${tag}:\n${formatDiagnostics(fatal)}`);
  }

  const entry = join(work, "out", "main.js");
  if (!existsSync(entry)) {
    rmSync(work, { recursive: true, force: true });
    throw new Error(`ngc emitted no main.js for ${tag}`);
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
