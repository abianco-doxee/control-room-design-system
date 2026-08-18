// Typed `pt` / `dt` — the second half of the edge over PrimeVue.
//
// PrimeVue types its pass-through sections (and `hooks`) as `any`, so a mistyped
// part name or handler is silent; their docs note an IDE extension is "being
// planned" to cover it. Every Control Room component enumerates its own parts, so
// the part names live in the type: a typo is a compile error with a "did you mean"
// suggestion, and `hooks` is checked.
//
// This gate compiles REAL TypeScript against the generated declarations rather than
// asserting on source text, because the thing under test is whether tsc accepts or
// rejects a given usage.
//
// Run after `npm run build:components`.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FRAMEWORKS = join(ROOT, "packages", "components", "dist", "frameworks");
const DTS = (t) => join(FRAMEWORKS, t, "index.d.ts");

// Targets that ship a generated index.d.ts (React gets real .d.ts from tsc).
const TARGETS = ["vue", "svelte", "solid", "angular", "qwik"];

/** Type-check a snippet against a target's declarations; return tsc's errors that
 *  originate in the snippet itself (library-internal noise is filtered out). */
function check(source, target = "svelte") {
  const dir = mkdtempSync(join(tmpdir(), "cr-tt-"));
  const file = join(dir, "probe.ts");
  writeFileSync(file, source.replace("__DTS__", DTS(target).replace(/\\/g, "/")));
  let out = "";
  try {
    execFileSync("npx", ["tsc", "--noEmit", "--skipLibCheck", "--strict", file], {
      cwd: ROOT,
      stdio: "pipe",
    });
  } catch (err) {
    out = String(err.stdout || "") + String(err.stderr || "");
  }
  return out
    .split("\n")
    .filter((l) => l.includes("probe.ts") && l.includes("error TS"))
    .map((l) => l.slice(l.indexOf("error TS")));
}

test("every target's index.d.ts declares the shared pt types (no dangling refs)", () => {
  // The regression this guards: component prop blocks are copied verbatim per
  // source file, so a type imported from lib/ would be REFERENCED but never
  // DECLARED — every consumer of a non-TSX target would then get
  // "Cannot find name 'CrPassThrough'". The builder inlines lib/pt-types.ts.
  for (const t of TARGETS) {
    assert.ok(existsSync(DTS(t)), `${t}: index.d.ts exists`);
    const src = readFileSync(DTS(t), "utf8");
    if (!src.includes("CrPassThrough<")) continue; // target has no typed component yet
    assert.match(src, /export type CrPassThrough</, `${t}: CrPassThrough declared`);
    assert.match(src, /export interface CrDesignTokens/, `${t}: CrDesignTokens declared`);
    assert.match(src, /export interface CrHooks/, `${t}: CrHooks declared`);
  }
});

test("a generated index.d.ts has no errors of its own", () => {
  for (const t of TARGETS) {
    let out = "";
    try {
      execFileSync("npx", ["tsc", "--noEmit", "--skipLibCheck", DTS(t)], {
        cwd: ROOT,
        stdio: "pipe",
      });
    } catch (err) {
      out = String(err.stdout || "") + String(err.stderr || "");
    }
    const own = out
      .split("\n")
      .filter((l) => l.includes(`frameworks/${t}/index.d.ts`) && l.includes("error TS"));
    assert.deepEqual(own, [], `${t}: declarations type-check cleanly`);
  }
});

test("valid pt/dt usage compiles", () => {
  const errors = check(`
    import type { CrTabsProps } from "__DTS__";
    export const ok: CrTabsProps = {
      tabs: ["A", "B"],
      pt: {
        root: { class: "px-2", "data-testid": "tabs" },
        tab: { class: "font-bold", onClick: (e: any) => void e },
        hooks: { onMounted: () => {}, onUnmounted: () => {} },
      },
      dt: { "--cr-tabs-indicator": "oklch(0.7 0.2 320)" },
    };
  `);
  assert.deepEqual(errors, [], "class merge, attrs, chained handler, hooks and dt all accepted");
});

test("an unknown part name is a compile error (PrimeVue types this as any)", () => {
  const errors = check(`
    import type { CrTabsProps } from "__DTS__";
    export const typo: CrTabsProps = { tabs: ["A"], pt: { tabb: { class: "x" } } };
  `);
  assert.equal(errors.length, 1, `expected exactly one error, got: ${errors.join(" | ")}`);
  assert.match(errors[0], /'tabb' does not exist in type/, "names the offending part");
  assert.match(errors[0], /Did you mean to write 'tab'/, "suggests the real part name");
});

test("a malformed hook is a compile error", () => {
  const errors = check(`
    import type { CrTabsProps } from "__DTS__";
    export const bad: CrTabsProps = { tabs: ["A"], pt: { hooks: { onMounted: "nope" } } };
  `);
  assert.equal(errors.length, 1, `expected exactly one error, got: ${errors.join(" | ")}`);
  assert.match(errors[0], /not assignable to type '\(\) => void'/, "hooks are checked");
});

test("the part union is per component, not a shared loose type", () => {
  // CrTabs has root+tab; "th" belongs to CrTable. If the types were widened to a
  // shared string index this would wrongly compile.
  const errors = check(`
    import type { CrTabsProps } from "__DTS__";
    export const wrong: CrTabsProps = { tabs: ["A"], pt: { th: { class: "x" } } };
  `);
  assert.equal(errors.length, 1, "another component's part is rejected");
});
