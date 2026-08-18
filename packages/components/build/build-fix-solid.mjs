// Post-process the Mitosis Solid output.
//
// Mitosis emits the context read AFTER the store block:
//
//     function CrCalendar(props) {
//       const monthLabel = createMemo(() => {
//         … resolveLocale(props.locale, cr && cr.locale) …   // ← reads `cr`
//       });
//       …
//       const cr = useContext(CrContext);                     // ← declared here
//
// On the CLIENT build that is harmless: createMemo is lazy, so the body does not
// run until something reads the memo, long after setup finishes. On the SERVER
// build it is fatal — solid-js/dist/server.js runs a memo's function EAGERLY at
// creation, so the body executes during setup and hits `cr` in its temporal dead
// zone: "Cannot access 'cr' before initialization". CrCalendar throws on every
// SSR render for that reason; nine other components share the ordering and only
// escape because their first-created memo happens not to touch `cr`.
//
// The fix is ordering, not semantics: hoist `const cr = useContext(CrContext);`
// to the top of the component body, above the first statement. useContext has no
// dependency on anything the store declares, so moving it earlier is safe, and it
// makes the client and server builds agree.
//
// A generator quirk, not a source problem — the .lite.tsx declares the context
// first already — so we patch the artifact. dist/frameworks/** is git-ignored and
// regenerated on every `build:components`, so this runs each compile.
//
//   node build/build-fix-solid.mjs           patch dist/frameworks/solid
//   node build/build-fix-solid.mjs --check   fail if any component still reads
//                                            `cr` before it is declared
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOLID = join(ROOT, "dist", "frameworks", "solid", "components");
const CHECK = process.argv.includes("--check");

const DECL = /^(\s*)const cr = useContext\(CrContext\);\n/m;

/* The component function's opening line: `function CrX(props) {`. The context
 * declaration goes immediately after it. */
const FN_OPEN = /^(function Cr[A-Za-z0-9]+\(props\)\s*\{\n)/m;

if (!existsSync(SOLID)) {
  if (CHECK) {
    console.log("✓ solid fixup: nothing compiled yet");
    process.exit(0);
  }
  console.warn("⚠ solid fixup: no dist/frameworks/solid/components — run mitosis build first");
  process.exit(0);
}

let patched = 0;
let unpatched = 0;

for (const file of readdirSync(SOLID).filter((f) => f.endsWith(".jsx"))) {
  const p = join(SOLID, file);
  const src = readFileSync(p, "utf8");

  const decl = DECL.exec(src);
  if (!decl) continue; // component does not join the cascade

  const declIdx = decl.index;
  const open = FN_OPEN.exec(src);
  if (!open) continue;
  const bodyStart = open.index + open[0].length;

  // Already first in the body? Nothing to do.
  if (src.slice(bodyStart, declIdx).trim() === "") continue;

  // Does anything before the declaration actually reference `cr`? If not the
  // ordering is latent rather than broken, but hoist anyway so it cannot become
  // broken later — the whole point is that client and server agree.
  const out = `${src.slice(0, bodyStart)}  const cr = useContext(CrContext);\n\n${src
    .slice(bodyStart)
    .replace(DECL, "")}`;

  if (out !== src) {
    if (CHECK) {
      unpatched++;
      console.error(`✗ ${file} declares \`cr\` after the store block (server-build TDZ)`);
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
  console.log("✓ solid fixup: every `cr` is declared before use");
  process.exit(0);
}

console.log(`solid fixup: hoisted the context read in ${patched} component(s)`);
