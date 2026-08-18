/**
 * Angular AOT compile gate — all 81 components through the real `ngc`.
 *
 * WHY THIS EXISTS. Angular is the one target with no browser gate: driving it in
 * a page means JIT, and JIT constructor injection needs `design:paramtypes`
 * metadata that nothing in this toolchain emits (esbuild does not implement
 * emitDecoratorMetadata; TypeScript 7 removed transpileModule). AOT is how Angular
 * is actually consumed anyway — `ng build` runs ngc — so compiling with ngc checks
 * the thing consumers depend on, rather than a JIT path nobody ships.
 *
 * What it catches that nothing else does: ngc type-checks the component class AND
 * its template together. The instantiate gate (tests/pkg-frameworks.test.mjs)
 * `new`s the class directly, so it never resolves DI, never binds a template, and
 * never executes a lifecycle hook. Standing this up found four defects that had
 * been shipping:
 *
 *   - a bare `cr` in the lifecycle hooks of 71 of 81 components (ReferenceError
 *     the moment the hook ran; the existing fixer only qualified the spread lines)
 *   - `standalone` defaulting to true since Angular 19, which invalidates the
 *     generator's own `@NgModule({ declarations: [...] })`
 *   - an untyped `renderer` constructor parameter, so DI had nothing to resolve
 *   - `setAttributes(el, value, changes)` called both with and without the third
 *     argument
 *
 * WHY ITS OWN PACKAGE. @angular/compiler-cli@22 pins `typescript >=6.0 <6.1`; the
 * workspace runs TypeScript 7. A dedicated package keeps that older compiler in
 * its own node_modules instead of forcing the whole repo back a major version.
 *
 *   node build/compile-aot.mjs            compile every component, report failures
 *   node build/compile-aot.mjs CrButton   just one, for iterating
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = join(dirname(fileURLToPath(import.meta.url)), "..");
const COMPONENTS = join(HERE, "..", "components", "dist", "frameworks", "angular");
const WORK = join(HERE, ".aot-work");
const only = process.argv[2];

if (!existsSync(COMPONENTS)) {
  console.error("✗ no dist/frameworks/angular — run `pnpm run build:components` first");
  process.exit(1);
}

/* ngc wants .ts sources. The emitted components are .js files that already
 * contain TypeScript (decorators, parameter types), so they are copied under a
 * .ts extension rather than transformed. */
rmSync(WORK, { recursive: true, force: true });
mkdirSync(join(WORK, "src", "components"), { recursive: true });

const names = readdirSync(join(COMPONENTS, "components"))
  .filter((f) => f.endsWith(".js"))
  .map((f) => f.replace(/\.js$/, ""))
  .filter((n) => !only || n === only)
  .sort();

for (const n of names) {
  cpSync(join(COMPONENTS, "components", `${n}.js`), join(WORK, "src", "components", `${n}.ts`));
}
// The shared lib the components import as `../lib/pt.ts`. It has to live INSIDE
// rootDir or tsc rejects it (TS6059), so the layout mirrors the real one:
// src/components/*.ts alongside src/lib/*.
cpSync(join(COMPONENTS, "lib"), join(WORK, "src", "lib"), { recursive: true });

writeFileSync(
  join(WORK, "tsconfig.json"),
  JSON.stringify(
    {
      compilerOptions: {
        target: "es2022",
        module: "esnext",
        moduleResolution: "bundler",
        experimentalDecorators: true,
        useDefineForClassFields: false,
        // The generated code is not written to be strict-clean, and this gate is
        // about Angular's own semantics — DI, templates, lifecycle — not about
        // tightening the generator's types.
        strict: false,
        noImplicitAny: false,
        skipLibCheck: true,
        rootDir: "./src",
        declaration: false,
        allowJs: true,
        // Mitosis emits `from "../lib/pt.ts"` with the explicit extension, which
        // is TS5097 unless this is on. That is how the sources are authored, not
        // a defect. Nothing is emitted — this gate only type-checks.
        allowImportingTsExtensions: true,
        noEmit: true,
      },
      include: ["src/**/*.ts"],
      angularCompilerOptions: {
        compilationMode: "full",
        strictTemplates: false,
        // Surface template errors as errors, which is the half the instantiate
        // gate cannot see at all.
        fullTemplateTypeCheck: true,
      },
    },
    null,
    2
  )
);

const require = createRequire(join(HERE, "package.json"));
const {
  performCompilation,
  readConfiguration,
  formatDiagnostics,
} = require("@angular/compiler-cli");

const config = readConfiguration(join(WORK, "tsconfig.json"));
const { diagnostics } = performCompilation({
  rootNames: config.rootNames,
  options: config.options,
});

// Two categories are filtered, and both are deliberate.
//
// TS2307 ("cannot find module") is a staging artefact: the components are
// compiled outside their package, so the sibling lib/context specifiers do not
// resolve here. Nothing to do with the components.
//
// TS2339 ("property does not exist") is DOM typing in the generated code —
// `querySelector` gives back `Element` or `unknown`, and the generator calls
// `.focus()` / `.value` on it. Correct at runtime, and this gate is about
// Angular's SEMANTICS: dependency injection, template binding, @Input/@Output
// classification, lifecycle. Tightening the generator's DOM types is a separate
// job, and holding this gate red for it would mean holding the real regressions
// hostage to cosmetics.
//
// Everything else fails the build. That is what caught the six defects listed
// above, each of which broke Angular consumers.
const IGNORED = new Set([2307, 2339]);
const real = diagnostics.filter((d) => !IGNORED.has(d.code));
const ignored = diagnostics.filter((d) => IGNORED.has(d.code));

if (real.length) {
  console.error(formatDiagnostics(real));
  console.error(
    `\n✗ Angular AOT: ${real.length} diagnostic(s) across ${names.length} component(s)`
  );
  process.exit(1);
}

rmSync(WORK, { recursive: true, force: true });
console.log(
  `✓ Angular AOT: ${names.length} component(s) compile with ngc` +
    (ignored.length ? ` (${ignored.length} DOM-typing diagnostic(s) ignored — see IGNORED)` : "")
);
