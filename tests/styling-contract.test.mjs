// Spike guard for the pt/dt/unstyled styling contract + per-target override.
// Reads the compiled framework output (run `npm run build:components` first).

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const fw = (t, f) =>
  readFileSync(
    join(ROOT, "packages", "components", "dist", "frameworks", t, "components", f),
    "utf8"
  );

test("Vue CrTabs is the hand-written per-target override (full native pt)", () => {
  const vue = fw("vue", "CrTabs.vue");
  assert.match(vue, /crGlobalPT/, "override wired global pt via inject");
  assert.match(vue, /mergeProps/, "override uses Vue mergeProps (listener chaining)");
});

test("the other targets are generated from the single .lite source (portable pt)", () => {
  // React keeps the portable pt spread + data-part; no override leakage.
  const react = fw("react", "CrTabs.tsx");
  assert.doesNotMatch(react, /crGlobalPT/, "override did NOT leak into React");
  assert.match(react, /data-part/, "generated output exposes data-part hooks");
  assert.match(
    react,
    /\.\.\.ptAttrs\(/,
    "generated output has the portable pt spread (shared lib/pt helper)"
  );
});

test("every target exposes the data-part styling hook on CrTabs", () => {
  for (const t of ["react", "vue", "svelte", "solid", "qwik", "angular"]) {
    const file = readdirSync(
      join(ROOT, "packages", "components", "dist", "frameworks", t, "components")
    ).find((f) => /^CrTabs\./.test(f));
    assert.ok(file, `${t}: CrTabs output exists`);
    assert.match(fw(t, file), /data-part/, `${t}: exposes data-part`);
  }
});

// The pt/dt/unstyled contract is rolled out library-wide. Every functional
// component's source must import the shared helper, expose at least a "root"
// data-part, and DECLARE all three props — EXCEPT the signature/decoration set,
// which is deliberately excluded (its look is the identity, not something
// consumers retheme). This guards both directions: a new functional component
// that forgets the contract fails, and so does a decorative one that unexpectedly
// grows it (update the set on purpose).
//
// `dt?:` is asserted alongside `pt?:`/`unstyled?:` because a component that
// declares only two of the three is silently half-themeable: `dt` accepts nothing
// and per-instance token overrides no-op. That gap went unnoticed on five
// components until an audit caught it, which is exactly what this test exists to
// prevent.
test("pt/dt/unstyled contract covers every functional component", () => {
  const COMPONENTS = join(ROOT, "packages", "components", "components");
  // Purely decorative/signature components: no consumer-facing styling contract.
  // CrDrip is NOT here — it carries the full contract (root/title/sub parts), so
  // it is guarded like any other functional component.
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
  const sources = readdirSync(COMPONENTS).filter((f) => f.endsWith(".lite.tsx"));
  const missing = [];
  for (const f of sources) {
    const name = f.replace(/\.lite\.tsx$/, "");
    if (DECORATIVE.has(name)) continue;
    const src = readFileSync(join(COMPONENTS, f), "utf8");
    const gaps = [];
    if (!/from "\.\.\/lib\/pt\.ts"/.test(src)) gaps.push("pt.ts import");
    if (!/data-part="root"/.test(src)) gaps.push('data-part="root"');
    if (!/\bunstyled\?\s*:/.test(src)) gaps.push("unstyled?:");
    if (!/\bpt\?\s*:/.test(src)) gaps.push("pt?:");
    if (!/\bdt\?\s*:/.test(src)) gaps.push("dt?:");
    // Declaring the props is not enough — the helpers must actually be wired to
    // the root, or pt/dt/unstyled are inert props that silently do nothing.
    // The first argument is either `props.pt` or, once a component joins the
    // global→component cascade, an inline `ptResolve(cr, props.pt, "<Name>")`.
    // (It must be inlined rather than held in a `state.` field: Mitosis mishandles
    // a `state.` receiver inside a JSX spread — see references/styling-contract.md.)
    if (!/ptStyle\((props\.pt|ptResolve\([^)]*\)),\s*props\.dt,\s*"root"\)/.test(src))
      gaps.push('ptStyle(pt, dt, "root")');
    if (gaps.length) missing.push(`${name} (${gaps.join(", ")})`);
  }
  assert.deepEqual(
    missing,
    [],
    `functional components missing the contract: ${missing.join("; ")}`
  );
});

// The decorative set is an opt-OUT, so it must stay honest in the other direction
// too: a name listed there that actually ships the contract means the exclusion is
// stale and the component is going unguarded.
test("the decorative exclusion set contains no contract-bearing components", () => {
  const COMPONENTS = join(ROOT, "packages", "components", "components");
  const DECORATIVE = [
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
  ];
  const stale = DECORATIVE.filter((name) => {
    const p = join(COMPONENTS, `${name}.lite.tsx`);
    if (!existsSync(p)) return false;
    const src = readFileSync(p, "utf8");
    return /data-part="root"/.test(src) && /\bunstyled\?\s*:/.test(src);
  });
  assert.deepEqual(
    stale,
    [],
    `listed decorative but ship the styling contract (remove from the set): ${stale.join(", ")}`
  );
});

// Finer per-component design tokens (PrimeVue-dt-style): what makes `dt` surgical
// is the two-sided contract — the token is DEFINED in the shipped stylesheet AND
// CONSUMED by the component CSS. If either half reverts to a coarse global token
// (e.g. .cr-tab--on { border-bottom-color: var(--sig-work) }) the per-instance
// override silently stops working, so guard both halves for the spike three.
test("Tabs/Menu/Modal expose finer component tokens (dt is surgical)", () => {
  const root = readFileSync(join(ROOT, "packages", "tokens", "dist", "control-room.css"), "utf8");
  const comp = readFileSync(join(ROOT, "packages", "styles", "styles", "components.css"), "utf8");
  const tokens = [
    // spike three
    "--cr-tabs-indicator",
    "--cr-tabs-tab-active-fg",
    "--cr-menu-item-hover-bg",
    "--cr-menu-panel-bg",
    "--cr-modal-bg",
    "--cr-modal-backdrop",
    // rollout: form controls (shared field group + per-control)
    "--cr-field-bg",
    "--cr-field-focus",
    "--cr-switch-track-on",
    "--cr-slider-thumb",
    // rollout: overlays
    "--cr-popover-bg",
    "--cr-drawer-backdrop",
    "--cr-tooltip-bg",
    // rollout: data display (accent knobs)
    "--cr-table-accent",
    "--cr-segmented-accent-bg",
    "--cr-stepper-accent-bg",
    "--cr-avatar-bg",
    // rollout: feedback + nav
    "--cr-nav-active-bg",
    "--cr-spinner-accent",
    "--cr-skeleton-bg",
    // component-coverage additions (Rating/Timeline/Toolbar/FileUpload/Carousel/Calendar)
    "--cr-rating-on",
    "--cr-timeline-rail",
    "--cr-toolbar-bg",
    "--cr-fileupload-active-border",
    "--cr-carousel-dot-active",
    "--cr-calendar-selected-bg",
    // Overflow ("+N more") — the disclosure's rest/hover colours.
    "--cr-overflow-fg",
    "--cr-overflow-hover-fg",
  ];
  for (const v of tokens) {
    assert.match(root, new RegExp(`${v}\\s*:`), `control-room.css defines ${v}`);
    assert.match(comp, new RegExp(`var\\(${v}`), `components.css consumes ${v}`);
  }
});

// The list above is a curated sample; this is the exhaustive half. EVERY token in
// the component tier must be both emitted and consumed — otherwise a token that
// exists only in tokens.json reads as a supported `dt` knob in the docs while
// overriding it does nothing. Derived from the source so new groups are covered
// the moment they are authored, with no list to keep in sync.
test("every component-tier token is emitted and consumed", () => {
  const tokens = JSON.parse(
    readFileSync(join(ROOT, "packages", "tokens", "tokens", "tokens.json"), "utf8")
  );
  const root = readFileSync(join(ROOT, "packages", "tokens", "dist", "control-room.css"), "utf8");
  const comp = readFileSync(join(ROOT, "packages", "styles", "styles", "components.css"), "utf8");

  const vars = [];
  for (const [group, entries] of Object.entries(tokens.component || {})) {
    if (group.startsWith("$")) continue;
    for (const [name, def] of Object.entries(entries)) {
      if (name.startsWith("$")) continue;
      if (def && typeof def === "object" && def.cssVar) vars.push(def.cssVar);
    }
  }
  assert.ok(vars.length > 100, `expected the full component tier, got ${vars.length}`);

  const undefined_ = vars.filter((v) => !new RegExp(`${v}\\s*:`).test(root));
  const unconsumed = vars.filter((v) => !comp.includes(`var(${v}`));
  assert.deepEqual(undefined_, [], `declared in tokens.json but never emitted to CSS`);
  assert.deepEqual(unconsumed, [], `emitted but never consumed by components.css (dt would no-op)`);
});
