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
import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "dist", "frameworks", "react", "components");
const CHECK = process.argv.includes("--check");

// A useState initializer is emitted as `() => (VALUE)`; VALUE never contains a
// bare `)` in our components (false / 0 / "" / props.x || 0 / [] / {}), so the
// closing `))` is unambiguous. Add `;` when one isn't already there.
const NEEDS_SEMI = /(=\s*useState\(\(\)\s*=>\s*\([^)]*\)\))(?!\s*;)/g;

// Same missing-semicolon family, for a deps-less effect (Mitosis `onUpdate` with
// no deps → `useEffect(() => {...}, )`). Collapsed onto one line it runs straight
// into whatever follows — `return`, another `useEffect`, a `const` — and ASI can't
// insert the separator, so prettier throws "';' expected". The `}, )` close is the
// distinctive deps-less-hook shape; add the semicolon whenever a statement (rather
// than an existing `;`) follows.
const NEEDS_SEMI_EFFECT = /(\},\s*\))(?!\s*[;,)\]}])/g;

// A WITH-deps effect (`useEffect(() => {...}, [a, b])`) has the same missing
// semicolon and the same collapsed-onto-one-line consequence.
//
// Anchored on the effect's OWN closing `}, [deps])` rather than scanning forward
// from `useEffect(`: a lazy `[\s\S]*?` span would stop at the FIRST `}, [...])`
// after the keyword, which for a body containing a nested `useCallback`/`reduce`
// is the inner hook's close, not the effect's — putting the semicolon in the wrong
// place and leaving the real parse error. Matching the close alone has no such
// ambiguity, and the negative lookahead is what keeps it idempotent.
//
// The deps list is matched as a balanced-free `[^\]]*` on purpose: a nested `]`
// (`[props.items[0]]`) would not match and is left alone rather than mis-cut.
// Mitosis does not emit such deps today; if it ever does, prettier fails loudly
// here rather than this silently corrupting the file.
const NEEDS_SEMI_EFFECT_DEPS = /(\},\s*\[[^\]]*\]\))(?!\s*[;,)\]}])/g;

// Presentational children wrapped in React.memo so a parent re-render only
// re-renders the child whose props actually changed. Safe ONLY for components
// with pure data props (no function props) — CrFormRow is delegation-driven and
// takes exactly that, which is what makes CrForm's per-field render isolation
// work (see components/CrFormRow.lite.tsx + references/forms.md). A node test
// (tests/forms-isolation.test.mjs) guards that the wrap survives future codegen.
const MEMOIZE = new Set(["CrFormRow.tsx"]);

// Add `memo` to the component's react import and wrap its default export.
function wrapInMemo(src, base) {
  const name = base.replace(/\.tsx$/, "");
  const exportRe = new RegExp("export default " + name + ";");
  if (!exportRe.test(src)) return src; // shape changed — leave it; the guard test will fail loudly
  let out = src;
  if (!/import\s*\{[^}]*\bmemo\b[^}]*\}\s*from\s*["']react["']/.test(out)) {
    out = 'import { memo } from "react";\n' + out;
  }
  return out.replace(exportRe, "export default memo(" + name + ");");
}

if (!existsSync(DIR)) {
  console.error("react fixup: " + DIR + " not found (run mitosis build first)");
  process.exit(1);
}

// Drop the React JSX type augmentation (onFocusOut/onFocusIn — see the source
// file's header) into the compiled tree so both the frameworks type-check and the
// package build pick it up via their existing dist/frameworks/react globs. It's a
// .d.ts (not emitted), scoped to the compile — consumers never see it.
if (!CHECK) {
  const AUG = join(dirname(fileURLToPath(import.meta.url)), "react-jsx-augment.d.ts");
  if (existsSync(AUG)) copyFileSync(AUG, join(DIR, "cr-jsx-augment.d.ts"));
}

const files = readdirSync(DIR).filter((f) => f.endsWith(".tsx"));
let touched = 0;
const problems = [];

for (const f of files) {
  const path = join(DIR, f);
  const src = readFileSync(path, "utf8");
  // Give bare relative sibling-component imports the `.tsx` source extension the
  // barrel already uses (Mitosis emits `from "./CrFormRow"` with none). build-pkg
  // then rewrites .tsx → .js for the ESM package, and the bundler/type-check
  // resolve .tsx directly. Without this, the emitted package can't resolve the
  // cross-component import at runtime.
  let patched = src
    .replace(NEEDS_SEMI, "$1;")
    // Deps variant FIRST: its `}, [x])` close ends in `)`, which the deps-less
    // pattern's `}, )` shape does not match, so the two are disjoint — but running
    // the narrower one first keeps that independence obvious rather than incidental.
    .replace(NEEDS_SEMI_EFFECT_DEPS, "$1;")
    .replace(NEEDS_SEMI_EFFECT, "$1;")
    .replace(/from (["'])(\.\/Cr[A-Za-z0-9]+)\1/g, "from $1$2.tsx$1");
  if (MEMOIZE.has(f)) patched = wrapInMemo(patched, f);
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

console.log(
  "react fixup: normalized " +
    files.length +
    " file(s)" +
    (touched ? " (" + touched + " changed)" : "")
);
