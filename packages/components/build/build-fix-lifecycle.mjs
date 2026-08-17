// Restore the PT `onUnmounted` lifecycle hook on Solid and Qwik.
//
// Mitosis's Solid and Qwik generators DROP `onUnMount(...)` entirely — the other
// four targets emit it (React `useEffect` cleanup, Vue `onUnmounted`, Svelte
// `onDestroy`, Angular `ngOnDestroy`), so `pt.hooks.onUnmounted` silently never
// fires on exactly two of six targets. A consumer's unmount cleanup leaks there
// with no error, which is worse than the hook not existing at all.
//
// Both frameworks DO support cleanup, just not through the primitive Mitosis maps
// `onUnMount` onto:
//
//   Solid — `onCleanup(fn)` from solid-js, callable inside the component body.
//   Qwik  — the `useVisibleTask$` callback may return a cleanup function, and also
//           receives a `cleanup()` registrar; returning is the simpler shape and
//           does not depend on the destructured argument being present.
//
// So the mount effect the generator DID emit is the anchor: we append the cleanup
// next to it, reusing the `ptHooks(ptResolve(cr, props.pt, "<Name>"))` expression
// the source already establishes. That keeps this a mechanical restoration of a
// dropped statement rather than new behaviour invented in the build.
//
// This is the fix the cascade plan prescribed as "two small files of override" —
// implemented as one artifact fixer instead, because dist/frameworks/** is
// git-ignored and regenerated on every compile, so a source-level per-target
// override would have to be maintained for all 71 components.
//
//   node build/build-fix-lifecycle.mjs           patch solid + qwik
//   node build/build-fix-lifecycle.mjs --check   fail if any component lacks it
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");

// The mount hook the generator emits, in either the old (`props.pt.hooks`) or the
// resolved (`ptHooks(ptResolve(...))`) form. Capturing the component name lets the
// injected cleanup resolve `pt` exactly as the mount hook does.
const MOUNT_RESOLVED = /if \(h && h\.onMounted\) h\.onMounted\(\);/;

/** The `ptHooks(ptResolve(cr, props.pt, "<Name>"))` receiver used by this file. */
function receiverFor(src) {
  const m = src.match(/const h = ptHooks\(ptResolve\(cr, props\.pt, "([A-Za-z0-9]+)"\)\);/);
  return m ? m[1] : null;
}

/** Add a named import to an existing `from "<mod>"` specifier list. */
function addImport(src, name, mod) {
  const re = new RegExp(`import \\{([^}]*)\\} from ("|')${mod.replace(/[/$.]/g, "\\$&")}\\2;`);
  const m = src.match(re);
  if (!m) return null;
  const names = m[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (names.includes(name)) return src;
  names.push(name);
  return src.replace(m[0], `import { ${names.join(", ")} } from "${mod}";`);
}

// ── Solid ────────────────────────────────────────────────────────────────────
// `onMount(() => { const h = …; if (h && h.onMounted) h.onMounted(); });`
// gains a sibling `onCleanup(…)` for onUnmounted and a `createEffect(…)` for
// onUpdated. Solid emits a `createEffect(on(…))` only for an onUpdate with TRACKED
// deps; the deps-less lifecycle one is dropped like onUnMount, so both are restored
// here from the mount effect as the anchor.
function fixSolid(src, comp) {
  let out = src;
  const re = new RegExp(
    `onMount\\(\\(\\) => \\{[\\s\\S]*?if \\(h && h\\.onMounted\\) h\\.onMounted\\(\\);[\\s\\S]*?\\}\\);`
  );
  const m = out.match(re);
  if (!m) return null;
  // Guard on the hook NAME rather than the receiver, so the fixer always sees its
  // own previous work and stays idempotent (see the note in fixQwik).
  let added = m[0];
  if (!out.includes("onUnmounted")) {
    added +=
      `\n  onCleanup(() => {\n` +
      `    const h = ptHooks(ptResolve(cr, props.pt, "${comp}"));\n` +
      `    if (h && h.onUnmounted) h.onUnmounted();\n` +
      `  });`;
  }
  if (!out.includes("onUpdated")) {
    // A bare createEffect re-runs whenever any signal it reads changes, which for
    // this body is `cr` and `props.pt` — the closest Solid analogue to "after an
    // update" without inventing a dependency the source never declared.
    added +=
      `\n  createEffect(() => {\n` +
      `    const h = ptHooks(ptResolve(cr, props.pt, "${comp}"));\n` +
      `    if (h && h.onUpdated) h.onUpdated();\n` +
      `  });`;
  }
  if (added === m[0]) return out;
  out = out.replace(m[0], added);
  out = addImport(out, "onCleanup", "solid-js");
  if (out === null) return null;
  return addImport(out, "createEffect", "solid-js");
}

// ── Qwik ─────────────────────────────────────────────────────────────────────
// The `useVisibleTask$` mount callback returns a cleanup function. Qwik requires
// the returned function be sync; ours is.
function fixQwik(src, comp) {
  // Guard on the hook NAME, not the receiver: the injected cleanup binds `u` (a
  // distinct name so it cannot shadow the enclosing `h`), so a guard looking for
  // `h.onUnmounted` would never see its own work and would re-inject on every run.
  if (src.includes("onUnmounted")) return src;
  const re = new RegExp(
    `(useVisibleTask\\$\\(\\(\\) => \\{[\\s\\S]*?if \\(h && h\\.onMounted\\) h\\.onMounted\\(\\);)([\\s\\S]*?)(\\n\\s*\\}\\);)`
  );
  const m = src.match(re);
  if (!m) return null;
  const ret =
    `\n    return () => {\n` +
    `      const u = ptHooks(ptResolve(cr, props.pt, "${comp}"));\n` +
    `      if (u && u.onUnmounted) u.onUnmounted();\n` +
    `    };`;
  return src.replace(re, `$1${ret}$2$3`);
}

const TARGETS = {
  solid: { ext: "jsx", fix: fixSolid },
  qwik: { ext: "tsx", fix: fixQwik },
};

let patched = 0;
const failures = [];

for (const [target, { ext, fix }] of Object.entries(TARGETS)) {
  const dir = join(ROOT, "dist", "frameworks", target, "components");
  if (!existsSync(dir)) {
    if (!CHECK) console.warn(`⚠ lifecycle fixup: no dist/frameworks/${target}/components`);
    continue;
  }
  for (const file of readdirSync(dir).filter((f) => f.endsWith("." + ext))) {
    if (file.includes(".context.")) continue;
    const p = join(dir, file);
    const src = readFileSync(p, "utf8");
    // Only components that actually author the hook are in scope.
    if (!MOUNT_RESOLVED.test(src)) continue;
    const comp = receiverFor(src);
    if (!comp) {
      failures.push(`${target}/${file}: could not read the ptResolve receiver`);
      continue;
    }
    const out = fix(src, comp);
    if (out === null) {
      failures.push(`${target}/${file}: mount effect not found — generator shape changed`);
      continue;
    }
    if (out === src) continue;
    if (CHECK) {
      const miss = ["onUnmounted", "onUpdated"].filter((h) => !src.includes(h));
      failures.push(`${target}/${file}: missing pt.hooks.${miss.join(" + ")}`);
      continue;
    }
    writeFileSync(p, out);
    patched++;
  }
}

if (failures.length) {
  for (const f of failures) console.error(`✗ ${f}`);
  console.error(
    CHECK
      ? "\n✗ lifecycle fixup is stale — run: npm run build:components"
      : "\n✗ lifecycle fixup could not patch every component"
  );
  process.exit(1);
}
console.log(
  CHECK
    ? "✓ lifecycle fixup: pt.hooks.onUnmounted present on solid + qwik"
    : `lifecycle fixup: patched ${patched} component(s) across solid + qwik`
);
