// Spike guard for the pt/dt/unstyled styling contract + per-target override.
// Reads the compiled framework output (run `npm run build:components` first).

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const fw = (t, f) => readFileSync(join(ROOT, "dist", "frameworks", t, "components", f), "utf8");

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
    const file = readdirSync(join(ROOT, "dist", "frameworks", t, "components")).find((f) =>
      /^CrTabs\./.test(f)
    );
    assert.ok(file, `${t}: CrTabs output exists`);
    assert.match(fw(t, file), /data-part/, `${t}: exposes data-part`);
  }
});

// The pt/dt/unstyled contract is rolled out library-wide. Every functional
// component's source must import the shared helper and expose at least a "root"
// data-part — EXCEPT the signature/decoration set, which is deliberately excluded
// (its look is the identity, not something consumers retheme). This guards both
// directions: a new functional component that forgets the contract fails, and so
// does a decorative one that unexpectedly grows it (update the set on purpose).
test("pt/dt/unstyled contract covers every functional component", () => {
  const COMPONENTS = join(ROOT, "components");
  const DECORATIVE = new Set([
    "CrArrowRail",
    "CrAscii",
    "CrBezel",
    "CrBreach",
    "CrCat",
    "CrChrome",
    "CrDrip",
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
    const ok =
      /from "\.\.\/lib\/pt\.ts"/.test(src) &&
      /data-part="root"/.test(src) &&
      /\bunstyled\?\s*:/.test(src);
    if (!ok) missing.push(name);
  }
  assert.deepEqual(
    missing,
    [],
    `functional components missing the contract: ${missing.join(", ")}`
  );
});

// Finer per-component design tokens (PrimeVue-dt-style): what makes `dt` surgical
// is the two-sided contract — the token is DEFINED in the shipped stylesheet AND
// CONSUMED by the component CSS. If either half reverts to a coarse global token
// (e.g. .cr-tab--on { border-bottom-color: var(--sig-work) }) the per-instance
// override silently stops working, so guard both halves for the spike three.
test("Tabs/Menu/Modal expose finer component tokens (dt is surgical)", () => {
  const root = readFileSync(join(ROOT, "dist", "control-room.css"), "utf8");
  const comp = readFileSync(join(ROOT, "styles", "components.css"), "utf8");
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
  ];
  for (const v of tokens) {
    assert.match(root, new RegExp(`${v}\\s*:`), `control-room.css defines ${v}`);
    assert.match(comp, new RegExp(`var\\(${v}`), `components.css consumes ${v}`);
  }
});
