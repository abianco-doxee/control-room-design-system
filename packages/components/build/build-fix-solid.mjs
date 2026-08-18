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
/* Both targets flatten the context read to a plain `const` in the component body
 * and can emit it AFTER code that reads it. Solid hits the TDZ because its server
 * build runs createMemo eagerly; Qwik because the optimizer hoists the component's
 * inner functions above the declaration. Same defect, same fix. */
const TARGETS = [
  { fw: "solid", ext: ".jsx", open: /^(function Cr[A-Za-z0-9]+\(props\)\s*\{\n)/m },
  {
    fw: "qwik",
    ext: ".tsx",
    open: /^(export const Cr[A-Za-z0-9]+ = component\$\(\([^)]*\) => \{\n)/m,
  },
];
const CHECK = process.argv.includes("--check");

const DECL = /^(\s*)const cr = useContext\(CrContext(?:,\s*[A-Za-z]+)?\);\n/m;

let patched = 0;
let unpatched = 0;

for (const { fw, ext, open: FN_OPEN } of TARGETS) {
  const dir = join(ROOT, "dist", "frameworks", fw, "components");
  if (!existsSync(dir)) continue;

  for (const file of readdirSync(dir).filter((f) => f.endsWith(ext))) {
    const p = join(dir, file);
    const src = readFileSync(p, "utf8");

    const decl = DECL.exec(src);
    if (!decl) continue; // component does not join the cascade

    const open = FN_OPEN.exec(src);
    if (!open) continue;
    const bodyStart = open.index + open[0].length;
    const declIdx = decl.index;

    // Already first in the body? Nothing to do.
    if (src.slice(bodyStart, declIdx).trim() === "") continue;

    // Hoist even when nothing before it reads `cr` yet: the ordering is latent
    // rather than broken in that case, and the point is that it cannot silently
    // become broken later.
    const out = `${src.slice(0, bodyStart)}  ${decl[0].trim()}\n\n${src
      .slice(bodyStart)
      .replace(DECL, "")}`;

    if (out !== src) {
      if (CHECK) {
        unpatched++;
        console.error(`✗ ${fw}/${file} declares \`cr\` after code that reads it (TDZ)`);
        continue;
      }
      writeFileSync(p, out);
      patched++;
    }
  }
}

if (CHECK) {
  if (unpatched) {
    console.error("\nRun: npm run build:components (regenerates + patches).");
    process.exit(1);
  }
  console.log("✓ context fixup: every `cr` is declared before use");
  process.exit(0);
}

console.log(`context fixup: hoisted the context read in ${patched} component(s)`);
