// Post-process the Mitosis React output.
//
// The React target runs with `prettier: false` (see mitosis.config.cjs) because
// Mitosis's bundled prettier (2.8.8) has two quirks that combine into invalid
// code:
//   1. it collapses a whole component onto one line when the props interface has
//      several JSDoc-commented members, and
//   2. it emits `const [x, setX] = useState(() => (...))` with NO trailing
//      semicolon.
// Collapsed onto one line, `useState(...) const …` is a genuine parse error and
// the build throws before writing anything. So we skip its formatter, add the
// missing hook semicolons here, and re-format with the project's prettier 3.
// dist/frameworks/react is git-ignored and regenerated every build:components.
//
//   node build/build-fix-react.mjs           patch dist/frameworks/react
//   node build/build-fix-react.mjs --check   fail if any file needs patching
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import prettier from "prettier";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "dist", "frameworks", "react", "components");
const CHECK = process.argv.includes("--check");

// A useState initializer is emitted as `() => (VALUE)`; VALUE never contains a
// bare `)` in our components (false / 0 / "" / props.x || 0 / [] / {}), so the
// closing `))` is unambiguous. Add `;` when one isn't already there.
const NEEDS_SEMI = /(=\s*useState\(\(\)\s*=>\s*\([^)]*\)\))(?!\s*;)/g;

if (!existsSync(DIR)) {
  console.error("react fixup: " + DIR + " not found (run mitosis build first)");
  process.exit(1);
}

const files = readdirSync(DIR).filter((f) => f.endsWith(".tsx"));
let touched = 0;
const problems = [];

for (const f of files) {
  const path = join(DIR, f);
  const src = readFileSync(path, "utf8");
  const patched = src.replace(NEEDS_SEMI, "$1;");
  let formatted;
  try {
    formatted = await prettier.format(patched, { parser: "typescript" });
  } catch (err) {
    problems.push(f + ": " + (err && err.message ? err.message.split("\n")[0] : String(err)));
    continue;
  }
  if (formatted !== src) {
    touched++;
    if (!CHECK) writeFileSync(path, formatted);
  }
}

if (problems.length) {
  console.error("react fixup: could not format " + problems.length + " file(s):");
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}

if (CHECK && touched) {
  console.error("react fixup: " + touched + " file(s) need formatting (run build:components)");
  process.exit(1);
}

console.log("react fixup: normalized " + files.length + " file(s)" + (touched ? " (" + touched + " changed)" : ""));
