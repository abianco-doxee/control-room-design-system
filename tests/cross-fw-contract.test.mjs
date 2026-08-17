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
const fw = (rel) =>
  readFileSync(join(ROOT, "packages", "components", "dist", "frameworks", rel), "utf8");

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
  // The first argument is the effective pt — `pt` on its own, or
  // `ptResolve(cr, pt, "…")` once the component joins the global→component cascade.
  // What matters here is that `dt` reaches [ngStyle] at all.
  assert.match(
    src,
    /\[ngStyle\]='ptStyle\((pt|ptResolve\([^)]*\)), dt, "root"\)'/,
    "root binds dt through [ngStyle]"
  );
});

// CrToastRegion packs consecutive same-message/same-signal toasts into one row
// with an aria-hidden ×N counter. The no-re-announce guarantee depends on every
// target reconciling that list POSITIONALLY, so the row's DOM node survives a
// count bump instead of remounting and refiring its live region.
//
// CrToastGroup carries TWO ids for this reason: `id` is the OLDEST member's
// (stable while the run grows) and `newestId` is the dismiss target (changes on
// every duplicate). Mitosis auto-derives React/Qwik `key={g.id}` from the field
// named `id`, so keying on `id` is CORRECT and expected; keying on `newestId`
// would remount the row on each repeat, and for `err` toasts (role=alert,
// assertive) that spams a screen reader. A source comment guards the .lite.tsx,
// but the invariant lives in the compiled output of six targets and a codegen
// upgrade could re-point the key without anyone touching the source. This is
// the gate for that.
//
// Regression origin: the first implementation reassigned `id` to the newest
// member, and Mitosis silently emitted `key={g.id}` for React and Qwik — a
// live-region remount on every duplicate that shipped and was caught here.
const TOAST_REGION = {
  react: "react/components/CrToastRegion.tsx",
  vue: "vue/components/CrToastRegion.vue",
  svelte: "svelte/components/CrToastRegion.svelte",
  solid: "solid/components/CrToastRegion.jsx",
  qwik: "qwik/components/CrToastRegion.tsx",
  angular: "angular/components/CrToastRegion.js",
};

for (const [target, file] of Object.entries(TOAST_REGION)) {
  test(`${target}: CrToastRegion never keys the group loop on the dismiss target`, () => {
    // Strip comments first: the component's own doc comment DISCUSSES keying and
    // names `newestId`, and it propagates into every target's output, so matching
    // raw source would flag the documentation instead of the code. Cover every
    // comment syntax these six targets emit — Vue, Svelte and Angular templates
    // all use <!-- -->, which the JS-only forms below would miss. Order matters:
    // the {/* */} form must go before the bare /* */ one, or the leftover braces
    // survive.
    const src = fw(file)
      .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "") // {/* jsx */}
      .replace(/\/\*[\s\S]*?\*\//g, "") //           /* block */
      .replace(/<!--[\s\S]*?-->/g, "") //            <!-- vue/svelte/angular -->
      .replace(/^[ \t]*\/\/.*$/gm, ""); //           // line
    // The row must be keyed on the STABLE identity (`id`, the oldest member's),
    // never on the dismiss target (`newestId`, which changes on every duplicate).
    // React/Solid/Qwik `key={…}`, Vue `:key="…"`, Svelte `(…)` each-key, Angular
    // `trackBy` — any of these bound to newestId breaks the guarantee.
    assert.doesNotMatch(src, /key=\{[^}]*newestId[^}]*\}/, `${target}: no key bound to newestId`);
    assert.doesNotMatch(
      src,
      /:key\s*=\s*["'][^"']*newestId/,
      `${target}: no :key bound to newestId`
    );
    assert.doesNotMatch(
      src,
      /\{#each[^}]*\([^)]*newestId[^)]*\)/,
      `${target}: no each-key on newestId`
    );
    assert.doesNotMatch(src, /trackBy/, `${target}: no trackBy on the group loop`);
    // newestId must still reach the dismiss handler. Without this, a "fix" that
    // stabilises the key by deleting the field would pass every assertion above
    // while silently dismissing the wrong toast.
    assert.match(src, /newestId/, `${target}: still dismisses the newest member's id`);
    // The counter must stay out of the accessibility tree — that is what makes
    // its insertion at the 1→2 transition safe inside a live region.
    assert.match(src, /aria-hidden/, `${target}: the ×N counter is aria-hidden`);
  });
}
