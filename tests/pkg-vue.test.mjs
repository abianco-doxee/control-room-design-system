// Consumability gate for the Vue entry (node:test).
// Run: npm run test:pkg:vue
//
// Vue is distributed as SFC source (the idiomatic Vue-library model): the
// consumer's bundler compiles the .vue files and Volar types them from the SFC.
// So this gate is structural — the barrel exports every component and each SFC is
// well-formed — rather than a Node render (SFCs need a Vue compiler to run).

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VUE = join(ROOT, "dist", "frameworks", "vue");

test("the vue barrel exports every component", () => {
  const index = readFileSync(join(VUE, "index.ts"), "utf8");
  const exported = [
    ...index.matchAll(/export \{ default as (\w+) \} from "\.\/components\/\1\.vue";/g),
  ].map((m) => m[1]);
  assert.ok(exported.includes("CrButton"), "CrButton exported");
  assert.ok(exported.length >= 60, `expected ~61 component exports, got ${exported.length}`);
  // every referenced SFC actually exists on disk
  for (const name of exported) {
    assert.ok(existsSync(join(VUE, "components", `${name}.vue`)), `${name}.vue should exist`);
  }
});

test("every SFC is a well-formed single-file component", () => {
  const files = readdirSync(join(VUE, "components")).filter((f) => f.endsWith(".vue"));
  assert.ok(files.length >= 60);
  for (const f of files) {
    const src = readFileSync(join(VUE, "components", f), "utf8");
    assert.match(src, /<template>/, `${f} has a <template>`);
    assert.match(src, /<script setup/, `${f} has a <script setup>`);
  }
});

test("CrButton SFC carries its typed props + Control Room class", () => {
  const src = readFileSync(join(VUE, "components", "CrButton.vue"), "utf8");
  assert.match(src, /export interface CrButtonProps/);
  assert.match(src, /cr-btn/);
});
