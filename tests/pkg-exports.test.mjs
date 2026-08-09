// Consumability gate: every framework target must be installable AND typed.
// Guards the package.json exports map + peer deps + the generated declarations,
// so a consumer of any of the six targets gets resolvable code and real types.
// Run after `npm run build:components`. (node:test — no browser needed.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

const TARGETS = ["react", "vue", "svelte", "angular", "solid", "qwik"];
// resolve a subpath export to its `types` and runtime (import/default) files
const cond = (entry, k) => (typeof entry === "string" ? entry : entry && entry[k]);

test("every framework target has a resolvable types + runtime entry", () => {
  for (const t of TARGETS) {
    const entry = pkg.exports[`./${t}`];
    assert.ok(entry, `exports["./${t}"] is declared`);
    const types = cond(entry, "types");
    const runtime = cond(entry, "import") || cond(entry, "default") || (typeof entry === "string" ? entry : null);
    assert.ok(types, `./${t} declares a "types" condition`);
    assert.ok(existsSync(join(ROOT, types)), `./${t} types file exists: ${types}`);
    assert.ok(runtime && existsSync(join(ROOT, runtime)), `./${t} runtime entry exists: ${runtime}`);
  }
});

test("each target's declarations expose a component value + its Props type", () => {
  for (const t of TARGETS) {
    const types = cond(pkg.exports[`./${t}`], "types");
    const dts = readFileSync(join(ROOT, types), "utf8");
    // CrButton is present in every target; both the value and its Props must be typed
    assert.match(dts, /\bCrButton\b/, `${t}: declares CrButton`);
    assert.match(dts, /CrButtonProps/, `${t}: exposes CrButtonProps`);
    // spot-check a second, prop-rich component so it's not just the one export
    assert.match(dts, /CrTabsProps/, `${t}: exposes CrTabsProps`);
  }
});

test("all six framework peers are declared and optional", () => {
  const peers = pkg.peerDependencies || {};
  const meta = pkg.peerDependenciesMeta || {};
  for (const dep of ["react", "react-dom", "vue", "svelte", "solid-js", "@angular/core", "@builder.io/qwik"]) {
    assert.ok(peers[dep], `peerDependencies includes ${dep}`);
    assert.equal(meta[dep] && meta[dep].optional, true, `${dep} is marked optional (one target shouldn't force the rest)`);
  }
});
