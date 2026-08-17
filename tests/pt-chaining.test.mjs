// Handler chaining through `pt` — the behaviour PrimeVue does not guarantee.
//
// A consumer handler passed as `pt={{ tab: { onClick } }}` must run *alongside* the
// component's own handler, not replace it (and not be replaced by it). This gate
// covers both halves:
//
//   1. the mechanism  — ptHandler/ptAttrs semantics, executed for real;
//   2. the wiring     — every target keeps its NATIVE event binding in the template
//                       and routes the consumer's handler through ptHandler().
//
// Why the design looks the way it does: the component's own handler stays in JSX and
// calls ptHandler() from inside. Merging the two functions and returning the composite
// from ptAttrs would be tidier but is NOT portable — verified against svelte 4.2,
// `on:click={fn}` compiles to a real listen() call while a spread `{...{onClick: fn}}`
// compiles to set_attributes with NO listener, so the handler would become a dead DOM
// attribute and the component's own behaviour would silently vanish on Svelte.
//
// Run after `npm run build:components`.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LIB = join(ROOT, "packages", "components", "lib", "pt.ts");
const MESSAGES = join(ROOT, "packages", "components", "lib", "messages.ts");
const fw = (rel) =>
  readFileSync(join(ROOT, "packages", "components", "dist", "frameworks", rel), "utf8");

// Compile lib/pt.ts with the real tsc (it is TypeScript; a regex strip would be a
// second, wrong implementation of the thing under test) and import the output.
let pt;
{
  const dir = mkdtempSync(join(tmpdir(), "cr-pt-"));
  // pt.ts imports messages.ts (the built-in English copy), so compile both — and
  // rewrite the `.ts` specifier tsc leaves intact, which Node's ESM loader rejects.
  execFileSync(
    "npx",
    [
      "tsc",
      LIB,
      MESSAGES,
      "--target",
      "es2020",
      "--module",
      "esnext",
      // components import lib helpers with an explicit `.ts` (the package build
      // rewrites it to `.js`), so tsc needs this to accept the specifier.
      "--allowImportingTsExtensions",
      "--rewriteRelativeImportExtensions",
      "--outDir",
      dir,
    ],
    { cwd: ROOT, stdio: "pipe" }
  );
  pt = await import(join(dir, "pt.js"));
}

test("ptHandler runs the consumer handler, consumer-first", () => {
  const order = [];
  const consumerPT = { tab: { onClick: () => order.push("consumer") } };
  // what a component does: ptHandler(...) then its own work
  const ran = pt.ptHandler(consumerPT, "tab", "onClick", { type: "click" });
  order.push("component");
  assert.equal(ran, true, "reports that a consumer handler ran");
  assert.deepEqual(order, ["consumer", "component"], "consumer observes the event first");
});

test("ptHandler is a no-op (and reports false) with no consumer handler", () => {
  assert.equal(pt.ptHandler(undefined, "tab", "onClick"), false, "no pt at all");
  assert.equal(pt.ptHandler({}, "tab", "onClick"), false, "no such part");
  assert.equal(pt.ptHandler({ tab: {} }, "tab", "onClick"), false, "part without the event");
  assert.equal(
    pt.ptHandler({ tab: { onClick: "not-a-function" } }, "tab", "onClick"),
    false,
    "non-function value is ignored, not called"
  );
});

test("ptHandler passes the event through to the consumer", () => {
  let seen = null;
  const evt = { type: "click", detail: 42 };
  pt.ptHandler({ tab: { onClick: (e) => (seen = e) } }, "tab", "onClick", evt);
  assert.equal(seen, evt, "the consumer receives the same event object");
});

test("a throwing consumer handler does not break the component", () => {
  const order = [];
  const boom = {
    tab: {
      onClick: () => {
        throw new Error("consumer blew up");
      },
    },
  };
  const orig = console.error;
  console.error = () => {}; // the guard logs; keep test output clean
  try {
    assert.doesNotThrow(() => pt.ptHandler(boom, "tab", "onClick"));
  } finally {
    console.error = orig;
  }
  order.push("component");
  assert.deepEqual(order, ["component"], "component work still proceeds");
});

test("ptAttrs strips handlers so they cannot ALSO arrive via the spread", () => {
  const attrs = pt.ptAttrs(
    { tab: { onClick: () => {}, onKeyDown: () => {}, "data-testid": "t", id: "x" } },
    "tab"
  );
  assert.deepEqual(
    Object.keys(attrs).sort(),
    ["data-testid", "id"],
    "handlers removed; plain attributes kept"
  );
});

test("ptAttrs never leaks reserved keys onto the DOM", () => {
  // `hooks` is component-level lifecycle, not an attribute; spreading it would
  // emit hooks="[object Object]".
  const attrs = pt.ptAttrs({ root: { hooks: { onMounted() {} }, "data-x": "1" } }, "root");
  assert.deepEqual(Object.keys(attrs), ["data-x"], "hooks excluded from the spread");
});

test("ptAttrs still excludes class and style (applied by ptClass/ptStyle)", () => {
  const attrs = pt.ptAttrs(
    { root: { class: "c", style: { color: "red" }, "data-x": "1" } },
    "root"
  );
  assert.deepEqual(Object.keys(attrs), ["data-x"]);
});

test("lowercase on* keys are attributes, not handlers", () => {
  // `onbeforeinput` is a real (if unusual) HTML attribute spelling; only the JSX
  // convention (onX…) is treated as a handler, so this must survive the strip.
  const attrs = pt.ptAttrs({ root: { onbeforeinput: "x" } }, "root");
  assert.deepEqual(Object.keys(attrs), ["onbeforeinput"]);
});

// ── the wiring half: every target keeps a native binding AND calls ptHandler ──
//
// Vue is the hand-written per-target override (overrides/vue/components/CrTabs.vue),
// which chains through Vue's own mergeProps — a different, equally valid mechanism —
// so it is asserted separately below.
const GENERATED = {
  react: { file: "react/components/CrTabs.tsx", bind: /onClick=/ },
  svelte: { file: "svelte/components/CrTabs.svelte", bind: /on:click=/ },
  solid: { file: "solid/components/CrTabs.jsx", bind: /onClick=/ },
  qwik: { file: "qwik/components/CrTabs.tsx", bind: /onClick\$=/ },
  angular: { file: "angular/components/CrTabs.js", bind: /\(click\)=/ },
};

for (const [target, spec] of Object.entries(GENERATED)) {
  test(`${target}: keeps the native click binding and routes pt through ptHandler`, () => {
    const src = fw(spec.file);
    assert.match(src, spec.bind, `${target}: own handler bound in the framework's idiom`);
    assert.match(src, /ptHandler\(/, `${target}: consumer's pt handler invoked`);
    // The first argument is the RESOLVED pt, which each target spells differently
    // (`state.pt`, `pt()`, `this.pt`), so match on the part/event pair rather than
    // the receiver.
    assert.match(
      src,
      /ptHandler\([^;]*"tab",\s*"onClick"/,
      `${target}: chained for the tab part's onClick`
    );
  });
}

test("svelte binds on:click as a real directive (NOT a spread attribute)", () => {
  // The regression this guards: a spread `onClick` on svelte 4 compiles to
  // set_attributes with no listener, so tab selection would silently stop working.
  const src = fw("svelte/components/CrTabs.svelte");
  assert.match(src, /on:click=\{/, "directive form present");
  assert.doesNotMatch(
    src,
    /ptAttrs\(pt,\s*"tab",\s*\{/,
    "the own handler is NOT passed into ptAttrs (would become a dead attribute)"
  );
});

// Library-wide coverage. Chaining is only a real guarantee if EVERY own handler
// on a part-bearing element routes through ptHandler — one that doesn't silently
// swallows the consumer's handler, which is exactly the bug this feature exists to
// remove. Scans the sources rather than a hand-kept list so a new component (or a
// new handler on an existing one) is covered the moment it is written.
test("every own handler on a part-bearing element chains the consumer's", () => {
  const DIR = join(ROOT, "packages", "components", "components");
  // Decorative/signature components carry no styling contract at all.
  const DECORATIVE = new Set([
    "CrArrowRail",
    "CrAscii",
    "CrBezel",
    "CrBreach",
    "CrCat",
    "CrChrome",
    "CrDither",
    "CrPalette",
    "CrShape",
    "CrSigil",
  ]);
  const gaps = [];
  const partless = [];
  for (const f of readdirSync(DIR).filter((n) => n.endsWith(".lite.tsx"))) {
    const name = f.replace(/\.lite\.tsx$/, "");
    if (DECORATIVE.has(name)) continue;
    const lines = readFileSync(join(DIR, f), "utf8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^\s*(on[A-Z][a-zA-Z]*)=\{/);
      if (!m) continue;
      // A multi-line handler body puts the ptHandler call on a following line, so
      // look at the whole body, not just the opening line.
      const body = lines.slice(i, i + 8).join("\n");
      if (body.slice(0, body.indexOf("}}") + 2 || undefined).includes("ptHandler")) continue;
      // Only elements that expose a part are consumer-reachable through `pt`.
      let part = null;
      for (let j = i; j >= 0 && j > i - 25; j--) {
        const dp = lines[j].match(/data-part="([a-z-]+)"/);
        if (dp) {
          part = dp[1];
          break;
        }
        if (/^\s*<[a-zA-Z]/.test(lines[j]) && j !== i) break;
      }
      if (part) gaps.push(`${name}:${i + 1} ${m[1]} on part "${part}"`);
      else partless.push(`${name}:${i + 1} ${m[1]}`);
    }
  }
  assert.deepEqual(
    gaps,
    [],
    `handlers that would swallow a consumer's pt handler:\n${gaps.join("\n")}`
  );
  // The `if (part)` branch above is an OPT-OUT: a handler on an element with no
  // data-part within 25 lines is dropped from the audit entirely. That is the right
  // default (an unexposed element is not consumer-reachable), but it must not be
  // silent — 18 handlers were escaping it, including row-select onChange and the
  // menu scrim's close, and adding a data-part to any of them would newly FAIL the
  // gate rather than newly cover it. Pinning the count makes the escape hatch
  // visible: if it moves, either a handler gained a part (raise nothing — the gate
  // now covers it) or a new unexposed handler appeared (decide deliberately).
  assert.ok(
    partless.length <= 20,
    `handlers skipped for having no data-part grew to ${partless.length}:\n${partless.join("\n")}`
  );
});

// `CR_MESSAGES` and the `resolveMessage` call sites must match in BOTH directions.
// A key with no call site reads as an overridable string and is not (CrPalette
// shipped three such); a call site with no key renders the raw key name in the UI
// instead of English. Neither fails any existing gate.
test("every built-in message key has a call site, and vice versa", () => {
  const DIR = join(ROOT, "packages", "components", "components");
  const msgSrc = readFileSync(join(ROOT, "packages", "components", "lib", "messages.ts"), "utf8");
  // Parse the CR_MESSAGES literal by walking it: a component block opens at
  // two-space indentation and closes at the matching brace depth. A regex cannot do
  // this safely — a `[\s\S]*?` spans past the block's own `}` for the multi-line
  // entries and a `[^}]*` stops inside the first nested one, which is how an earlier
  // version attributed CrCalendar's keys to CrAlert.
  const declared = new Set();
  const body = msgSrc.slice(msgSrc.indexOf("CR_MESSAGES"));
  const lines = body.split("\n");
  let current = null;
  let depth = 0;
  for (const line of lines) {
    if (current === null) {
      const open = line.match(/^\s{2}(Cr[A-Za-z0-9]+):\s*\{(.*)$/);
      if (!open) continue;
      current = open[1];
      depth = 1;
      // A single-line block closes on the same line.
      const rest = open[2];
      for (const k of rest.matchAll(/(?:^|[\s{,])([a-zA-Z][a-zA-Z0-9]*)\s*:/g)) {
        declared.add(`${current}.${k[1]}`);
      }
      depth += (rest.match(/\{/g) || []).length - (rest.match(/\}/g) || []).length;
      if (depth <= 0) current = null;
      continue;
    }
    for (const k of line.matchAll(/^\s+([a-zA-Z][a-zA-Z0-9]*)\s*:/g)) {
      declared.add(`${current}.${k[1]}`);
    }
    depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
    if (depth <= 0) current = null;
  }
  assert.ok(declared.size > 20, `expected the whole message table, parsed ${declared.size}`);

  const used = new Set();
  for (const f of readdirSync(DIR).filter((n) => n.endsWith(".lite.tsx"))) {
    const src = readFileSync(join(DIR, f), "utf8");
    for (const m of src.matchAll(
      /resolveMessage\(\s*cr\s*,\s*[^,]*,\s*["'](Cr[A-Za-z0-9]+)["']\s*,\s*["']([a-zA-Z0-9]+)["']/g
    )) {
      used.add(`${m[1]}.${m[2]}`);
    }
  }
  assert.ok(used.size > 20, `expected many call sites, found ${used.size}`);

  const dead = [...declared].filter((k) => !used.has(k)).sort();
  const undeclaredKeys = [...used].filter((k) => !declared.has(k)).sort();
  assert.deepEqual(
    dead,
    [],
    `message keys with no call site (silently unoverridable):\n${dead.join("\n")}`
  );
  assert.deepEqual(
    undeclaredKeys,
    [],
    `resolveMessage keys with no built-in default (renders the key name):\n${undeclaredKeys.join("\n")}`
  );
});

test("vue reaches the same guarantee through its native mergeProps override", () => {
  const src = fw("vue/components/CrTabs.vue");
  assert.match(src, /mergeProps/, "uses Vue's own prop merge (chains listeners)");
  assert.match(src, /@click=/, "own handler bound in Vue's idiom");
});

// ── the parent tier + localisation ───────────────────────────────────────────

test("ptNested forwards a section as a child's pt, and never as an attribute", () => {
  const parentPt = { check: { root: { "data-testid": "row-select" } }, td: { class: "c" } };
  assert.deepEqual(
    pt.ptNested(parentPt, "check"),
    { root: { "data-testid": "row-select" } },
    "the section is handed to the child verbatim"
  );
  assert.equal(pt.ptNested(parentPt, "absent"), undefined, "no section → child sees no pt");
  // The regression this guards: spreading an object-valued section would emit
  // check="[object Object]" onto the DOM.
  assert.deepEqual(pt.ptAttrs(parentPt, "check"), {}, "nested section never spread");
  assert.deepEqual(
    pt.ptAttrs({ td: { "data-x": "1" } }, "td"),
    { "data-x": "1" },
    "plain attrs still pass"
  );
});

test("resolveMessage falls back built-in → global → per-instance", () => {
  assert.equal(pt.resolveMessage(null, null, "CrModal", "close"), "Close", "built-in English");
  assert.equal(
    pt.resolveMessage({ messages: { "CrModal.close": "Chiudi" } }, null, "CrModal", "close"),
    "Chiudi",
    "app-level messages win over the built-in"
  );
  assert.equal(
    pt.resolveMessage(
      { messages: { "CrModal.close": "Chiudi" } },
      { close: "X" },
      "CrModal",
      "close"
    ),
    "X",
    "per-instance labels win over app-level"
  );
});

test("a message may be a function, so translations control word order", () => {
  assert.equal(pt.resolveMessage(null, null, "CrPagination", "page", 3), "Page 3");
  assert.equal(
    pt.resolveMessage(null, { page: (n) => "Seite " + n }, "CrPagination", "page", 3),
    "Seite 3"
  );
  // object argument, for the multi-value cases
  assert.equal(
    pt.resolveMessage(null, null, "CrOverflow", "showMore", { count: 3, noun: "sessions" }),
    "show 3 more sessions"
  );
});

test("an unknown message key renders the key, not 'undefined'", () => {
  assert.equal(pt.resolveMessage(null, null, "CrModal", "nope"), "nope");
});

test("resolveLocale: per-instance → context → en", () => {
  assert.equal(pt.resolveLocale(undefined, undefined), "en");
  assert.equal(pt.resolveLocale(undefined, "it"), "it");
  assert.equal(pt.resolveLocale("en-GB", "it"), "en-GB", "instance wins, like pt and messages");
});

// The parent tier is only real if every nesting site actually forwards. Without
// this, a nested component is unreachable through the parent's `pt` and nothing
// fails — which is exactly how four sites (CrChoiceGroup→CrChoice,
// CrForm→CrFormRow, CrInput→CrIcon, CrKeyHints→CrKbd) were missed on the first
// pass. Scans the sources so a NEW nesting is covered the moment it is written.
test("every nested Cr* component receives a forwarded pt", () => {
  const DIR = join(ROOT, "packages", "components", "components");
  const files = readdirSync(DIR).filter((n) => n.endsWith(".lite.tsx"));
  const known = new Set(files.map((n) => n.replace(/\.lite\.tsx$/, "")));
  const gaps = [];
  for (const f of files) {
    const name = f.replace(/\.lite\.tsx$/, "");
    // Strip comments first: a doc comment may legitimately mention a component
    // in prose ("Place <CrNav/> inside"), which is not a render site.
    const src = readFileSync(join(DIR, f), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    // Each opening tag of a real component, with the props up to its close.
    for (const m of src.matchAll(/<(Cr[A-Z][A-Za-z0-9]*)\b([^>]*)>/g)) {
      const [, child, propsBlob] = m;
      if (child === name) continue; // self-reference in a doc comment
      if (!known.has(child)) continue; // a type name, not a component
      // A `pt={...}` that does not actually FORWARD is worse than none: it reads as
      // wired and silently drops the consumer's section. `pt={{}}` and any other
      // literal passed this gate when it only looked for `pt={`, so require the
      // forward to route through ptNested (optionally merged with the row's own
      // literal, as CrFormRow does for its delegation attributes).
      const forwards = /\bpt=\{[\s\S]*?ptNested\(/.test(propsBlob);
      if (forwards) continue;
      gaps.push(`${name} → ${child}`);
    }
  }
  assert.deepEqual(
    gaps,
    [],
    `nested components unreachable through the parent's pt:\n${gaps.join("\n")}`
  );
});

// The section a parent forwards must be DECLARED in that parent's part union, or
// the documented way to reach the child does not type-check — six sections shipped
// implemented-but-undeclared (CrCalendar.monthSelect/yearSelect, CrChoiceGroup.choice,
// CrDataGrid.check, CrForm.row, CrInput.iconGlyph/clearGlyph, CrKeyHints.kbd), so a
// consumer following the component's own docs got TS2353.
//
// This is the set-difference the contract gates never ran: the whole feature is a
// TYPED part surface, and nothing compared the type to the code.
test("every part used in code is declared in the component's pt union", () => {
  const DIR = join(ROOT, "packages", "components", "components");
  const files = readdirSync(DIR).filter((n) => n.endsWith(".lite.tsx"));
  const drift = [];
  let checked = 0;
  for (const f of files) {
    const name = f.replace(/\.lite\.tsx$/, "");
    const src = readFileSync(join(DIR, f), "utf8");
    const decl = src.match(/pt\?:\s*CrPassThrough<([^>]*)>/);
    if (!decl) continue; // decorative component with no styling contract
    checked++;
    const declared = new Set(
      decl[1]
        .split("|")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean)
    );
    // Drop the inner ptResolve(...) calls first: their COMPONENT-name argument sits
    // in the same position a part name does, so leaving them in makes every
    // component look like it uses a part named after itself.
    const flat = src.replace(/ptResolve\([^()]*\)/g, "PT");
    const used = new Set();
    for (const re of [
      /ptAttrs\(\s*[^,()]*,\s*["']([A-Za-z0-9_]+)["']\s*\)/g,
      /ptClass\(\s*[^,()]*,\s*[^,()]*,\s*[^,()]*,\s*["']([A-Za-z0-9_]+)["']\s*\)/g,
      /ptStyle\(\s*[^,()]*,\s*[^,()]*,\s*["']([A-Za-z0-9_]+)["']\s*\)/g,
      /ptHandler\(\s*[^,()]*,\s*["']([A-Za-z0-9_]+)["']\s*,/g,
      /ptNested\(\s*[^,()]*,\s*["']([A-Za-z0-9_]+)["']\s*\)/g,
    ]) {
      for (const m of flat.matchAll(re)) used.add(m[1]);
    }
    const undeclared = [...used].filter((p) => !declared.has(p)).sort();
    if (undeclared.length) drift.push(`${name}: uses ${undeclared.join(", ")} — not in its union`);
  }
  assert.ok(checked > 60, `expected the whole library, only checked ${checked}`);
  assert.deepEqual(drift, [], `part-name drift:\n${drift.join("\n")}`);
});
