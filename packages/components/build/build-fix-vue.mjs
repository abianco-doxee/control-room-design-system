// Post-process the Mitosis Vue output.
//
// Mitosis rewrites a store getter to a `computed()` ref and every READ of it to
// `x.value` — except when the read is a bare alias assignment:
//
//     const view = computed(() => { … return [y, m - 1]; });
//     …
//     const v = view;            // ← .value dropped
//     return fmt.format(new Date(Date.UTC(v[0], v[1], 1)));
//
// `v` is then the ref OBJECT, so `v[0]` is undefined and the expression silently
// produces garbage — `Date.UTC(undefined, …)` is NaN, and CrCalendar dies with
// "Invalid time value" on every Vue render. Nothing catches it upstream: the SFC
// compiles perfectly, and the same source is correct on the five other targets.
//
// Only the `const <local> = <computedRef>;` shape is rewritten, and only when the
// right-hand side is a ref declared by `computed()` in the same file. Reads that
// Mitosis already got right are untouched.
//
// A generator quirk, not a source problem, so we patch the artifact.
// dist/frameworks/** is git-ignored and regenerated on every `build:components`.
//
//   node build/build-fix-vue.mjs           patch dist/frameworks/vue
//   node build/build-fix-vue.mjs --check   fail if any bare alias remains
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VUE = join(ROOT, "dist", "frameworks", "vue", "components");
const CHECK = process.argv.includes("--check");

/** `const <name> = computed(` at the top level of the <script>. */
const COMPUTED = /^const ([A-Za-z_]\w*) = computed\(/gm;
/** A whole-line `const <local> = <name>;` alias — nothing else on the line. */
const ALIAS = /^(\s*)const (\w+) = (\w+);\s*$/gm;

if (!existsSync(VUE)) {
  if (CHECK) {
    console.log("✓ vue fixup: nothing compiled yet");
    process.exit(0);
  }
  console.warn("⚠ vue fixup: no dist/frameworks/vue/components — run mitosis build first");
  process.exit(0);
}

let patched = 0;
let unpatched = 0;

for (const file of readdirSync(VUE).filter((f) => f.endsWith(".vue"))) {
  const p = join(VUE, file);
  const src = readFileSync(p, "utf8");

  const refs = new Set();
  for (const m of src.matchAll(COMPUTED)) refs.add(m[1]);
  if (!refs.size) continue;

  const out = src.replace(ALIAS, (match, indent, local, rhs) =>
    refs.has(rhs) ? `${indent}const ${local} = ${rhs}.value;` : match
  );

  if (out !== src) {
    if (CHECK) {
      unpatched++;
      console.error(`✗ ${file} aliases a computed ref without .value`);
      continue;
    }
    writeFileSync(p, out);
    patched++;
  }
}

if (CHECK) {
  if (unpatched) {
    console.error("\nRun: npm run build:components (regenerates + patches).");
    process.exit(1);
  }
  console.log("✓ vue fixup: every computed alias reads .value");
  process.exit(0);
}

console.log(`vue fixup: added .value to computed aliases in ${patched} component(s)`);
