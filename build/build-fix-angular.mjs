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
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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

for (const f of files) {
  const path = join(DIR, f);
  const src = readFileSync(path, "utf8");
  const out = src
    .split("\n")
    .map((line) => {
      if (!isSpreadLine(line)) return line;
      let fixed = line;
      for (const [re, ch] of ENTITIES) fixed = fixed.replace(re, ch);
      return fixed;
    })
    .join("\n");
  if (out !== src) {
    touched++;
    if (!CHECK) writeFileSync(path, out);
  }
}

if (CHECK && touched) {
  console.error("angular fixup: " + touched + " file(s) need patching (run build:components)");
  process.exit(1);
}

console.log("angular fixup: normalized " + files.length + " file(s)" + (touched ? " (" + touched + " changed)" : ""));
