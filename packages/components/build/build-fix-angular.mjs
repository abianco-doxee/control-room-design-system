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
  const out = src
    .split("\n")
    .map((line) => {
      if (!isSpreadLine(line)) return line;
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
  const withImports = importContext(
    typeRenderer(addStandaloneFalse(addMissingModuleImports(out, f)))
  );
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
