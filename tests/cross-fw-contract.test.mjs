// Cross-framework behavioral-parity gate.
//
// React islands are exercised live in the browser (showcase-islands). The other
// five targets are compiled from the SAME .lite source, so their *behavioral
// contract* — the a11y roles, state attributes, roving tabindex, and the keyboard
// handler wiring — must be present in every target's compiled output, each in that
// framework's idiom. This asserts that parity at the source level for the
// keyboard-heavy CrTabs (roving-tabindex tablist), and confirms Angular applies
// `dt` via [ngStyle] (custom props → setProperty; see references/styling-contract).
// Run after `npm run build:components`.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const fw = (rel) => readFileSync(join(ROOT, "dist", "frameworks", rel), "utf8");

// target → { file, keydown: <how a keydown handler binds in that framework> }
const TARGETS = {
  react: { file: "react/components/CrTabs.tsx", keydown: /onKeyDown=/ },
  vue: { file: "vue/components/CrTabs.vue", keydown: /@keydown|onKeydown|v-on:keydown/i },
  svelte: { file: "svelte/components/CrTabs.svelte", keydown: /on:keydown/ },
  solid: { file: "solid/components/CrTabs.jsx", keydown: /onKeyDown=/ },
  qwik: { file: "qwik/components/CrTabs.tsx", keydown: /onKeyDown\$?=/ },
  angular: { file: "angular/components/CrTabs.js", keydown: /\(keydown\)/ },
};

for (const [target, spec] of Object.entries(TARGETS)) {
  test(`${target}: CrTabs carries the full keyboard/a11y contract`, () => {
    const src = fw(spec.file);
    assert.match(src, /role="?tablist"?/, `${target}: tablist role`);
    assert.match(src, /role="?tab"?/, `${target}: tab role`);
    assert.match(src, /aria-selected/, `${target}: aria-selected state`);
    assert.match(src, /tab-?index/i, `${target}: roving tabindex`);
    assert.match(src, /data-part/, `${target}: data-part hook`);
    assert.match(src, spec.keydown, `${target}: keydown handler wired (${spec.keydown})`);
  });
}

// CrRating is the other keyboard-heavy pattern shipped in the component-coverage
// batch — a roving-tabindex radiogroup. Assert the same contract in every target.
const RATING = {
  react: { file: "react/components/CrRating.tsx", keydown: /onKeyDown=/ },
  vue: { file: "vue/components/CrRating.vue", keydown: /@keydown|onKeydown|v-on:keydown/i },
  svelte: { file: "svelte/components/CrRating.svelte", keydown: /on:keydown/ },
  solid: { file: "solid/components/CrRating.jsx", keydown: /onKeyDown=/ },
  qwik: { file: "qwik/components/CrRating.tsx", keydown: /onKeyDown\$?=/ },
  angular: { file: "angular/components/CrRating.js", keydown: /\(keydown\)/ },
};

for (const [target, spec] of Object.entries(RATING)) {
  test(`${target}: CrRating carries the radiogroup/roving contract`, () => {
    const src = fw(spec.file);
    // role is a dynamic expression here (readonly ⇒ img), so match the quoted
    // literal (single- or double-quoted per target) rather than a `role=` prefix.
    assert.match(src, /["']radiogroup["']/, `${target}: radiogroup role`);
    assert.match(src, /["']radio["']/, `${target}: radio role`);
    assert.match(src, /aria-checked/, `${target}: aria-checked state`);
    assert.match(src, /tab-?index/i, `${target}: roving tabindex`);
    assert.match(src, /data-part/, `${target}: data-part hook`);
    assert.match(src, spec.keydown, `${target}: keydown handler wired (${spec.keydown})`);
  });
}

test("angular: dt is applied via [ngStyle] (custom props reach setProperty)", () => {
  const src = fw("angular/components/CrTabs.js");
  // NgStyle._setStyle flags any key containing '-' as DashCase → renderer uses
  // el.style.setProperty(), which is the correct path for --custom properties.
  assert.match(src, /\[ngStyle\]='ptStyle\(pt, dt, "root"\)'/, "root binds dt through [ngStyle]");
});
