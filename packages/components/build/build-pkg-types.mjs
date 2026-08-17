// Generate TypeScript declarations for the non-TSX framework targets.
//
// React and Qwik are TSX, so tsc emits real .d.ts for them (see build-pkg.mjs).
// Vue/Svelte/Solid/Angular ship as compiled framework source (.vue/.svelte/.jsx/.js)
// with no declarations — a consumer gets zero types. But every target shares the
// SAME prop interfaces (plain, framework-agnostic TS authored in the .lite.tsx
// sources). This copies those interfaces into a per-target `index.d.ts` and
// declares each component with a framework-appropriate value type, so consumers of
// any target get `import { CrButton, type CrButtonProps }` with real checking.
//
// The prop types are the portable, high-value part; the component value type is a
// best-effort per-framework shim (Vue DefineComponent, Solid render fn, Svelte
// component constructor, Angular class). dist/frameworks/** is git-ignored and
// regenerated every build:components; --check fails on drift.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COMPONENTS = join(ROOT, "components");
const FRAMEWORKS = join(ROOT, "dist", "frameworks");
const CHECK = process.argv.includes("--check");

// target → { ext, value(name) → the `export declare …` for the component value }
const TARGETS = {
  vue: {
    ext: "vue",
    value: (n, hasProps) =>
      `export declare const ${n}: import("vue").DefineComponent<${hasProps ? n + "Props" : "Record<string, any>"}>;`,
  },
  svelte: {
    ext: "svelte",
    value: (n, hasProps) =>
      `export declare const ${n}: import("svelte").ComponentType<import("svelte").SvelteComponentTyped<${hasProps ? n + "Props" : "Record<string, any>"}>>;`,
  },
  solid: {
    ext: "jsx",
    value: (n, hasProps) =>
      `export declare function ${n}(props: ${hasProps ? n + "Props" : "Record<string, any>"}): import("solid-js").JSX.Element;`,
  },
  angular: {
    ext: "js",
    // Angular emits a component class plus a NgModule; type the class loosely
    // (consumers use it via the selector in templates) and re-export the module.
    value: (n) => `export declare class ${n} {}\nexport declare class ${n}Module {}`,
  },
  qwik: {
    ext: "tsx",
    value: (n, hasProps) =>
      `export declare const ${n}: import("@builder.io/qwik").Component<${hasProps ? n + "Props" : "Record<string, any>"}>;`,
  },
};

// Pull every top-level `export interface X {…}` / `export type X = …;` block out of
// a source, verbatim (comments included). A tiny brace/`;` scanner — the prop
// types here are self-contained TS (verified: no React/JSX types), so this is
// sufficient without a full TS parser.
function extractTypeBlocks(src) {
  const blocks = [];
  const re = /^export\s+(interface|type)\s+([A-Za-z0-9_]+)/gm;
  let m;
  while ((m = re.exec(src))) {
    const kind = m[1];
    const name = m[2];
    const i = m.index;
    if (kind === "interface") {
      // advance to the first '{', then balance braces
      const j = src.indexOf("{", i);
      if (j === -1) continue;
      let depth = 0;
      let k = j;
      for (; k < src.length; k++) {
        if (src[k] === "{") depth++;
        else if (src[k] === "}") {
          depth--;
          if (depth === 0) {
            k++;
            break;
          }
        }
      }
      blocks.push({ name, text: src.slice(i, k) });
    } else {
      // `export type X = …;` — read to the terminating ';' at brace depth 0
      let depth = 0;
      let k = src.indexOf("=", i);
      if (k === -1) continue;
      for (; k < src.length; k++) {
        if (src[k] === "{" || src[k] === "(" || src[k] === "[") depth++;
        else if (src[k] === "}" || src[k] === ")" || src[k] === "]") depth--;
        else if (src[k] === ";" && depth === 0) {
          k++;
          break;
        }
      }
      blocks.push({ name, text: src.slice(i, k) });
    }
  }
  return blocks;
}

// name (kebab from source) not needed; we key off the component's exported name,
// which the barrel derives from the compiled filename. Build: sourceName → blocks.
const sources = readdirSync(COMPONENTS).filter((f) => f.endsWith(".lite.tsx"));
const typesBySource = {}; // "CrButton" → [{name,text}]
for (const f of sources) {
  const name = f.replace(/\.lite\.tsx$/, "");
  typesBySource[name] = extractTypeBlocks(readFileSync(join(COMPONENTS, f), "utf8"));
}

// Shared types the prop interfaces REFERENCE but do not declare (CrPassThrough,
// CrDesignTokens, …). Component blocks are copied verbatim per source file, so a
// type imported from lib/ would be referenced and never defined — the emitted
// .d.ts then fails with "Cannot find name 'CrPassThrough'" for every consumer of a
// non-TSX target. Inline lib/pt-types.ts once per file so the declarations are
// self-contained. `import type` lines are dropped from the component blocks below
// for the same reason: the relative specifier would not resolve from index.d.ts.
const SHARED_TYPES = extractTypeBlocks(
  readFileSync(join(ROOT, "lib", "pt-types.ts"), "utf8")
).map((b) => b.text);

const HEADER =
  "// GENERATED by build/build-pkg-types.mjs — do not edit. Re-run `npm run build:components`.\n" +
  "// Prop types are the shared, framework-agnostic source of truth; the component\n" +
  "// value types are per-target shims. See references/frameworks.md.\n";

let drift = false;

for (const [target, { ext, value }] of Object.entries(TARGETS)) {
  const dir = join(FRAMEWORKS, target);
  const compDir = join(dir, "components");
  if (!existsSync(compDir)) continue;

  const names = readdirSync(compDir)
    .filter((f) => f.endsWith("." + ext))
    // Context modules (cr.context.*) sit in the same folder but are not components:
    // they have no Props interface, and `cr.context` is not a legal class name, so
    // declaring one emits a syntax error into index.d.ts.
    .filter((f) => !f.includes(".context."))
    .map((f) => f.slice(0, -(ext.length + 1)))
    .sort();

  const typeDecls = [];
  const valueDecls = [];
  for (const name of names) {
    const blocks = typesBySource[name] || [];
    for (const b of blocks) typeDecls.push(b.text);
    const hasProps = blocks.some((b) => b.name === name + "Props");
    valueDecls.push(value(name, hasProps));
  }

  const body =
    HEADER +
    "\n" +
    SHARED_TYPES.join("\n\n") +
    "\n\n" +
    typeDecls.join("\n\n") +
    "\n\n" +
    valueDecls.join("\n") +
    "\n";

  const outFile = join(dir, "index.d.ts");
  if (CHECK) {
    const current = existsSync(outFile) ? readFileSync(outFile, "utf8") : "";
    if (current !== body) {
      drift = true;
      console.error(`  - ${target}/index.d.ts: stale (run 'npm run build:components')`);
    }
  } else {
    writeFileSync(outFile, body);
    console.log(`wrote dist/frameworks/${target}/index.d.ts  (${names.length} components typed)`);
  }
}

if (CHECK) {
  if (drift) {
    console.error("\n✗ package type declarations are stale");
    process.exit(1);
  }
  console.log("✓ package type declarations are in sync");
}
