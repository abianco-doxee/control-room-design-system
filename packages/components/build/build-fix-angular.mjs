// Post-process the Mitosis Angular output.
//
// Mitosis's Angular generator serializes JSX spreads (`{...ptAttrs(props.pt,
// "root")}`) into a `setAttributes(el, ptAttrs(this.pt, "root"))` call inside the
// component class (ngAfterViewInit / ngOnChanges). While doing so it HTML-escapes
// the string arguments — `"root"` becomes `&quot;root&quot;` — which is valid
// inside a template but is a genuine syntax error in the class body (`Unexpected
// "&"`). esbuild/ngc then can't compile the component.
//
// The escaping only ever lands on the generated `setAttributes(...)` lines (real
// JS), never in the `template:` HTML, so we unescape those lines and leave the
// template untouched. dist/frameworks/angular is git-ignored and regenerated on
// every build:components.
//
//   node build/build-fix-angular.mjs           patch dist/frameworks/angular
//   node build/build-fix-angular.mjs --check   fail if any file needs patching
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "dist", "frameworks", "angular", "components");
const CHECK = process.argv.includes("--check");

// Entity → char. Scoped to lines that are JS spread-handler calls (see header);
// those lines never carry template markup, so a plain unescape is safe there.
const ENTITIES = [
  [/&quot;/g, '"'],
  [/&#39;/g, "'"],
  [/&amp;/g, "&"],
];

// A generated spread handler line. Mitosis names the helper `setAttributes`; the
// escaped string args live only in these calls (and the matching changes[...] key
// on the same line).
const isSpreadLine = (line) => line.includes("setAttributes(");

if (!existsSync(DIR)) {
  console.error("angular fixup: " + DIR + " not found (run mitosis build first)");
  process.exit(1);
}

const files = readdirSync(DIR).filter((f) => f.endsWith(".js"));
let touched = 0;

// Nested components: the generator lists a child's NgModule in the @NgModule
// `imports: [CommonModule, CrIconModule]` but never imports the symbol, so the
// module reference is a bare undefined identifier — `ReferenceError:
// CrIconModule is not defined` the moment the module is evaluated. Pre-existing
// for CrInput→CrIcon; adding CrCheckbox to CrTable/CrDataGrid surfaced it. Add the
// missing import for every Cr*Module the file references but does not import.
// Mitosis emits `@Component({...})` with no `standalone` key, plus an
// `@NgModule({ declarations: [Cmp] })`. That pairing was correct while Angular
// defaulted standalone to FALSE. Angular 19 flipped the default to true, so the
// module now throws at bootstrap:
//
//   Unexpected "CrButton" found in the "declarations" array of the
//   "CrButtonModule" NgModule, "CrButton" is marked as standalone
//
// which breaks every component for consumers on Angular >= 19 — all 81 of them.
// The generator's own shape is the NgModule one, so the component is pinned back
// to `standalone: false` rather than the modules being rewritten.
// The generator emits the injected renderer WITHOUT a type:
//
//   constructor(public cr : CrContext, private renderer) {}
//
// Angular's DI reads constructor parameter types to know what to inject, so a
// bare parameter fails at bootstrap with "NG0202: This constructor is not
// compatible with Angular Dependency Injection". Renderer2 is already imported
// (the generator uses it for the pt handler wiring), only the annotation is
// missing. Invisible to the instantiate gate, which `new`s the class directly and
// never involves DI — it only shows up in a real Angular application.
// Components on the pt/locale cascade inject the context:
//
//   constructor(public cr : CrContext, …)
//
// but the generator never imports it, so `CrContext` is an undefined identifier
// and Angular DI fails with NG0202 at index 0 before it ever reaches the
// renderer. The emitted module is components/cr.context.js, whose default export
// is named `crContext` (lowercase) — so the import has to be aliased. Like the
// missing Cr*Module imports above, this only shows up when Angular actually
// resolves the constructor, which the instantiate gate never does.
// Angular's JIT DI reads constructor parameter TYPES, which TypeScript normally
// supplies as `design:paramtypes` under emitDecoratorMetadata. Nothing available
// here emits it: esbuild does not implement it (documented), and TypeScript 7
// dropped the transpileModule API that could. Without it a browser bootstrap dies
// with NG0202 before rendering anything.
//
// Angular also accepts an explicit `static ctorParameters` — the same shape its
// own compiler emits for downlevelled libraries — and that needs no metadata. The
// annotations are already in the emitted constructor, so derive it:
//   constructor(public cr: CrContext, private renderer: Renderer2)
//     → static ctorParameters = () => [{ type: CrContext }, { type: Renderer2 }]
//
// Verified in a browser: DI resolves both the injectable context and Renderer2
// from this alone. Inert for AOT consumers, which read the real types instead.
function addCtorParameters(code) {
  if (/static ctorParameters/.test(code)) return code;
  const ctor = /constructor\(\s*([^)]*?)\s*\)\s*\{\s*\}/s.exec(code);
  if (!ctor) return code;
  if (!ctor[1].trim()) {
    // No-arg constructor (the injectable context): Angular still needs to know
    // there are no deps, or JIT cannot synthesise a factory for it.
    return code.replace(ctor[0], ctor[0] + "\n  static ctorParameters() { return []; }\n");
  }
  const types = ctor[1]
    .split(",")
    .map((p) => /:\s*([A-Za-z_$][\w$]*)/.exec(p))
    .map((m) => (m ? m[1] : null));
  if (types.some((t) => !t)) return code; // an untyped param — leave it alone
  // A static METHOD, not a field: with useDefineForClassFields:false a field
  // initializer is evaluated at class-definition time, before Angular has an
  // injector, and the bootstrap fails with NG0203 instead. A method body is only
  // called when Angular asks for the metadata.
  const meta = `\n  static ctorParameters() { return [${types.map((t) => `{ type: ${t} }`).join(", ")}]; }\n`;
  return code.replace(ctor[0], `${ctor[0]}${meta}`);
}

function importContext(code) {
  if (!/\bCrContext\b/.test(code)) return code;
  if (/import\s+CrContext\b/.test(code)) return code;
  return `import CrContext from "./cr.context";\n${code}`;
}

function typeRenderer(code) {
  return code.replace(/(\bprivate\s+renderer)(\s*\))/g, "$1: Renderer2$2");
}

function addStandaloneFalse(code) {
  if (!/@NgModule\(/.test(code)) return code; // no module — leave it standalone
  return code.replace(/@Component\(\{\n/g, (m) =>
    /standalone/.test(code.slice(code.indexOf(m), code.indexOf(m) + 400))
      ? m
      : `${m}  standalone: false,\n`
  );
}

function addMissingModuleImports(code, file) {
  const referenced = [
    ...new Set([...code.matchAll(/\b(Cr[A-Za-z0-9]+)Module\b/g)].map((m) => m[1])),
  ];
  const self = file.replace(/\.js$/, "");
  const missing = referenced.filter(
    (n) => n !== self && !new RegExp(`import\\s*\\{[^}]*\\b${n}Module\\b`).test(code)
  );
  if (!missing.length) return code;
  const lines = missing.map((n) => `import { ${n}Module } from "./${n}";`).join("\n");
  return lines + "\n" + code;
}

for (const f of files) {
  const path = join(DIR, f);
  const src = readFileSync(path, "utf8");
  // Track the @Component template block: a bare `cr` is CORRECT inside it
  // (Angular resolves it against the instance) and a ReferenceError outside it.
  // The template is the backtick literal that follows `template:`.
  let inTemplate = false;
  const out = src
    .split("\n")
    .map((line) => {
      // Track the template by counting backticks, not by "does this line have
      // one": the opener is `selector: '…', template: \`` and the closer is a
      // lone backtick many lines later, while lines in between can contain their
      // own. Getting this wrong silently skips the entire class body — which is
      // how a whole component kept its raw &quot; entities and bare `cr`.
      // The template opens at `template: \`` and closes at the line that begins
      // the next @Component field — the generator always emits `\`,styles: [...]`
      // or `\`,` — so the closer is matched explicitly. Backtick PARITY does not
      // work: that closing line carries three of them (one ending the template,
      // two around the styles string). Getting this wrong skips the whole class
      // body, which is how one component kept its raw &quot; entities and bare `cr`.
      const opensTemplate = !inTemplate && /template:\s*`/.test(line);
      if (opensTemplate) {
        inTemplate = true;
        return line;
      }
      if (inTemplate) {
        if (/^\s*`\s*,/.test(line)) inTemplate = false;
        return line;
      }

      // Outside the template, qualify `cr` wherever it appears in executable code
      // — not only on the setAttributes() spread lines. The generator also copies
      // it verbatim into the lifecycle hooks (`ptHooks(ptResolve(cr, …))`), which
      // the narrower check missed: 71 of the 81 components shipped a bare `cr`
      // there, and it throws the moment the hook runs. Angular's AOT compiler is
      // what surfaced it — tsc sees an undefined identifier, while the
      // instantiate gate never executes those hooks.
      if (!isSpreadLine(line) && !/ptResolve\(cr[,)]/.test(line)) return line;
      let fixed = line;
      for (const [re, ch] of ENTITIES) fixed = fixed.replace(re, ch);
      // Same class of bug, second symptom. A component that reads the app-level
      // context (`const cr = useContext(CrContext)`) becomes a constructor
      // parameter — `constructor(public cr: CrContext, …)` — so inside the class
      // body it is `this.cr`. But the generator copies the JSX expression
      // verbatim into these synthesized calls, emitting a BARE `cr`
      // (`ptAttrs(this.ptOf(cr), "root")`), which throws "cr is not defined" at
      // runtime. In the template a bare `cr` is correct (Angular resolves it
      // against the instance), which is why only these lines need qualifying.
      fixed = fixed.replace(/(?<![.\w$])cr(?![\w$])/g, "this.cr");
      return fixed;
    })
    .join("\n");
  // A prop typed `(value) => string` is an INPUT that returns a value, not an
  // event. Mitosis classifies anything function-shaped as an @Output, so
  // CrLineChart's `xFormat` escape hatch became an EventEmitter: calling it is a
  // type error, and the generator's own `.emit(...)` rewrite returns void, so the
  // custom tick label silently rendered as undefined. Every other target treats it
  // as a plain prop. Detected by shape — an @Output whose value is READ rather
  // than only emitted — so a genuine event output is untouched.
  const valueReturningInputs = (code) => {
    let out = code;
    for (const m of code.matchAll(/@Output\(\)\s*(\w+)\s*=\s*new EventEmitter<[^>]*>\(\)/g)) {
      const name = m[1];
      // Two shapes give a value-returning prop away, and neither is an event:
      //   const xf = this.xFormat;              read into a local, then called
      //   Promise.resolve(this.validate.emit(…) || {})   its result is USED
      // A real event output is only ever emitted, and its result discarded.
      const readBack = new RegExp(`const \\w+ = this\\.${name};`).test(code);
      const resultUsed = new RegExp(`this\\.${name}\\.emit\\([^;]*\\)\\s*(\\|\\||\\?|\\.)`).test(
        code
      );
      if (!readBack && !resultUsed) continue; // a real event output
      out = out
        .replace(m[0], `@Input() ${name}: any`)
        .replace(new RegExp(`this\\.${name}\\.emit\\(`, "g"), `this.${name}(`);
    }
    return out;
  };

  // EventEmitter.emit() takes exactly ONE argument, but the generator forwards
  // however many the source prop declared: `onSortChange: (key, dir) => void`
  // becomes `this.onSortChange.emit(this.sortKey, this.sortDir)`, and the second
  // argument is silently dropped — the consumer only ever sees the key. Angular's
  // convention for multi-value events is a single payload object, so they are
  // packed into one.
  // DOM lookups come back untyped, and Angular's AOT compiler type-checks them.
  //
  //   const nodes = Array.from(root.querySelectorAll(…));  → unknown[]
  //   const el = root.querySelector(…);                    → Element
  //
  // then `.focus()` / `.value` / `.setAttribute()` on those is a TS2339 error.
  // The code is correct at runtime — these really are HTMLElements — so the fix
  // is the annotation, not the logic. Annotating the .lite source does NOT work:
  // Mitosis strips type annotations from its Angular output (React keeps them),
  // so it has to be applied here.
  const typeDomQueries = (code) =>
    code
      .replace(/(\b(?:const|let)\s+\w+)(\s*=\s*Array\.from\([^;]*querySelectorAll)/g, "$1: any[]$2")
      .replace(/(\b(?:const|let)\s+\w+)(\s*=\s*[\w.]*\.querySelector\()/g, "$1: any$2")
      .replace(/(\b(?:const|let)\s+\w+)(\s*=\s*\w+\s*\?\s*[\w.]*\.querySelector\()/g, "$1: any$2");

  // The test-only render counter.
  // `window.__CR_ROW_RENDERS__`, the per-row render counter the React memo
  //    test reads. It is a deliberate test hook rather than a DOM API, so it is
  //    reached through a cast instead of being declared globally.
  // A method whose body is a DOM query returns unknown[] once Mitosis strips the
  // source's `: any[]` return type, so `.focus()` / `.value` on a result fails.
  // Matched by NAME: two earlier pattern-based attempts reached into the
  // @Component template above and rewrote it, which made every template
  // expression resolve against the class instead — a worse break than the fix.
  const DOM_METHODS = ["inputs", "barItems"];
  const typeDomMethods = (code) =>
    DOM_METHODS.reduce(
      (acc, name) => acc.replace(new RegExp(`^${name}\\(\\) \\{$`, "m"), `${name}(): any[] {`),
      code
    );

  // Inside an Angular event binding the event object is `$event`. Mitosis
  // rewrites the FIRST occurrence in a handler body and leaves any later one as a
  // bare `event`, which Angular resolves against the component — "Property
  // 'event' does not exist" under AOT, and undefined at runtime. Affects any
  // handler that touches the event twice (CrSlider, CrTabs).
  const dollarEvent = (code) =>
    code.replace(
      /\((?:input|click|change|keydown|keyup|blur|focus|mousedown|mousemove|pointerdown)\)="([\s\S]*?)"/g,
      (m, body) => m.replace(body, body.replace(/(?<![.\w$])event(?![\w])/g, "$event"))
    );

  // `children` is a React/Vue/Svelte concept. Angular projects content with
  // <ng-content> and has no `children` property, so the generator's
  // `*ngIf="children"` is "Property 'children' does not exist" under AOT — and at
  // runtime it is always falsy, so CrField/CrInputGroup silently render their
  // FALLBACK branch even when the consumer projected content.
  //
  // Angular's own way to ask "was anything projected?" is @ContentChild with a
  // static read of the host's child nodes. A declared field backed by that check
  // keeps the emitted template untouched.
  const declareChildren = (code) => {
    if (!/\*ngIf="!?\(?children\)?"/.test(code)) return code;
    if (/get children\b/.test(code)) return code;
    // Insert the accessor right after the ctorParameters metadata, which every
    // component in this set has by the time this pass runs.
    return code.replace(
      /^(\s*static ctorParameters\(\)[^\n]*\n)/m,
      `$1
  /** Whether the consumer projected any content. Angular has no \`children\`; this
   *  reads the host element's child nodes once the view exists, which is what the
   *  generator's \`*ngIf="children"\` is actually asking. */
  get children(): boolean {
    const host = this.elRef0?.nativeElement ?? null;
    return !!host && host.childNodes.length > 0;
  }
`
    );
  };

  // The test-only render counter: a deliberate hook the React memo test reads,
  // not a DOM API, so it is reached through a cast rather than declared globally.
  const typeWindowHook = (code) =>
    code
      .replace(/\bwindow\.__CR_ROW_RENDERS__/g, "(window as any).__CR_ROW_RENDERS__")
      .replace(/\bconst w = window;/g, "const w = window as any;");

  const packMultiArgEmit = (code) =>
    code.replace(/this\.(\w+)\.emit\(([^;]*?)\);/g, (m, name, args) => {
      const parts = args.split(",").map((a) => a.trim());
      if (parts.length < 2) return m;
      return `this.${name}.emit([${parts.join(", ")}]);`;
    });

  const optionalChanges = (code) =>
    // `setAttributes(el, value, changes)` is called BOTH ways by the generator:
    // with the third argument from ngOnChanges, and without it from ngAfterViewInit.
    // Under AOT that is "An argument for 'changes' was not provided"; JS never
    // noticed. Marking it optional matches how it is actually called.
    code.replace(/setAttributes\(el, value, changes\) \{/, "setAttributes(el, value, changes?) {");

  // Each pass is independent and order-insensitive; a flat pipeline keeps it
  // readable as the list grows.
  const withImports = [
    (c) => addMissingModuleImports(c, f),
    addStandaloneFalse,
    typeRenderer,
    importContext,
    addCtorParameters,
    optionalChanges,
    valueReturningInputs,
    packMultiArgEmit,
    typeDomQueries,
    typeDomMethods,
    typeWindowHook,
    dollarEvent,
    declareChildren,
  ].reduce((code, pass) => pass(code), out);

  if (withImports !== src) {
    touched++;
    if (!CHECK) writeFileSync(path, withImports);
  }
}

if (CHECK && touched) {
  console.error("angular fixup: " + touched + " file(s) need patching (run build:components)");
  process.exit(1);
}

console.log(
  "angular fixup: normalized " +
    files.length +
    " file(s)" +
    (touched ? " (" + touched + " changed)" : "")
);
