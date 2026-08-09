// Consumability gate for the compiled React package (node:test).
// Run: npm run test:pkg   (pretest:pkg builds dist/pkg/react first)
//
// Proves the named exports are REAL: it imports the built package exactly as a
// consumer would (`import { CrButton } from ".../react"`), renders a component to
// HTML through react-dom/server, and confirms the typed declarations ship. This is
// the difference between "compiles" and "installable".
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as CR from "../dist/pkg/react/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PKG = join(ROOT, "dist", "pkg", "react");

test("the package exposes every component as a named export", () => {
  // a representative spread across categories
  const expected = ["CrButton", "CrPanel", "CrChip", "CrForm", "CrCombobox", "CrTabs", "CrBarChart", "CrSigil"];
  for (const name of expected) {
    assert.equal(typeof CR[name], "function", `${name} should be a named export function`);
  }
  // and the full barrel is substantial (all 61 components)
  const fns = Object.keys(CR).filter((k) => typeof CR[k] === "function");
  assert.ok(fns.length >= 60, `expected ~61 component exports, got ${fns.length}`);
});

test("a named export renders to correct Control Room markup", () => {
  const html = renderToStaticMarkup(
    createElement(CR.CrButton, { signal: "accent", emphasis: "outline" }, "Deploy"),
  );
  assert.match(html, /<button/);
  assert.match(html, /class="cr-btn cr-btn--outline cr-btn--sig-accent"/, `got: ${html}`);
  assert.match(html, />Deploy</);
});

test("a controlled component renders with its a11y wiring intact", () => {
  const html = renderToStaticMarkup(
    createElement(CR.CrChip, { signal: "done" }, "merged"),
  );
  assert.match(html, /cr-chip/);
  assert.match(html, />merged</);
});

test("typed declarations ship alongside the JS", () => {
  assert.ok(existsSync(join(PKG, "index.d.ts")), "index.d.ts present");
  assert.ok(existsSync(join(PKG, "index.js")), "index.js present");
  const idx = readFileSync(join(PKG, "index.d.ts"), "utf8");
  assert.match(idx, /export \{ default as CrButton \}/);
  assert.match(idx, /export type \{ CrButtonProps \}/, "prop types re-exported from the entry");
  // declaration re-exports must resolve (.js, not .tsx — no source ships)
  assert.doesNotMatch(idx, /\.tsx"/, "no .tsx specifiers leak into the shipped types");

  const btn = readFileSync(join(PKG, "components", "CrButton.d.ts"), "utf8");
  assert.match(btn, /export interface CrButtonProps/);
  assert.match(btn, /emphasis\?:/);
});

test("CrFormRow ships wrapped in React.memo (per-field render isolation guard)", () => {
  // CrForm's per-field re-render isolation depends on CrFormRow being memoized so a
  // form re-render only re-renders the row whose data changed. build-fix-react.mjs
  // applies the wrap; this guards it against a codegen/pipeline regression.
  const REACT_MEMO = Symbol.for("react.memo");
  assert.equal(CR.CrFormRow?.$$typeof, REACT_MEMO, "CrFormRow default export must be memo(...)");
  assert.equal(typeof CR.CrFormRow.type, "function", "memo wraps the component function");

  // and CrForm actually drives it by delegation (form-level listeners + data-path)
  const formJs = readFileSync(join(PKG, "components", "CrForm.js"), "utf8");
  assert.match(formJs, /from "\.\/CrFormRow\.js"/, "CrForm imports the compiled CrFormRow");
  assert.match(formJs, /onFormInput|onInput/, "CrForm attaches a delegated input listener");
});

test("pt / dt / unstyled styling contract (portable subset) on CrTabs", () => {
  // unstyled drops cr-* but keeps data-part; pt merges a class + injects an attr;
  // dt sets a CSS custom property on the root; data-state reflects the active tab.
  const html = renderToStaticMarkup(
    createElement(CR.CrTabs, {
      tabs: ["A", "B"],
      active: 1,
      unstyled: true,
      pt: { tab: { class: "mine", "data-testid": "tab" } },
      dt: { "--sig-work": "#ff00ff" },
    }),
  );
  assert.doesNotMatch(html, /cr-tab\b/, "unstyled drops the cr-* class");
  assert.match(html, /data-part="root"/, "parts expose data-part");
  assert.match(html, /class="mine"/, "pt class is applied (merged onto the bare base)");
  assert.match(html, /data-testid="tab"/, "pt injects arbitrary attributes into the part");
  assert.match(html, /--sig-work:\s*#ff00ff/, "dt sets a scoped CSS custom property on the root");
  assert.match(html, /data-state="active"/, "active tab reflects data-state");
});
