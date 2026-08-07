// Unit tests for the theme / brand core (node:test). Run: npm run test:theme
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  THEME_ROLES,
  CHASSIS_OVERRIDABLE,
  validateTheme,
  mergeTheme,
  themeCss,
  defineTheme,
  contrastRatio,
  checkThemeContrast,
} from "../lib/theme/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const tokens = read("tokens/tokens.json");
const contract = read("dist/theme-contract.json");

// The appearance surface, three ways: it must be identical across tokens.json's
// semantic tier, lib/theme's runtime copy, and the generated contract — or a
// brand written to one wouldn't match the others.
test("theme contract is in lock-step (tokens.json ≡ lib ≡ dist/theme-contract.json)", () => {
  const GROUPS = ["surface", "text", "line", "signal", "keyed", "texture"];
  const fromTokens = [];
  for (const g of GROUPS) for (const v of Object.values(tokens.semantic[g])) if (v && v.cssVar) fromTokens.push(v.cssVar);
  const fromLib = THEME_ROLES.map((r) => r.cssVar);
  const fromContract = contract.roles.map((r) => r.cssVar);
  assert.deepEqual(fromLib, fromTokens, "lib THEME_ROLES == tokens.json semantic roles");
  assert.deepEqual(fromContract, fromTokens, "generated contract == tokens.json semantic roles");
});

test("every built-in theme satisfies the contract", () => {
  for (const name of tokens.meta.themes) {
    const t = tokens.themes[name];
    const vars = {};
    for (const [k, v] of Object.entries(t)) if (!k.startsWith("$")) vars[k] = v;
    const r = validateTheme(vars);
    assert.equal(r.valid, true, `${name} missing: ${r.missing.join(", ")}`);
  }
});

test("validateTheme flags missing roles and tolerates extra vars", () => {
  const partial = { ground: "#000", ink: "#fff" };
  const r = validateTheme(partial);
  assert.equal(r.valid, false);
  assert.ok(r.missing.includes("panel"), "missing required role reported");

  // a full theme + a brand extension var: valid, extra reported but not fatal
  const full = {};
  for (const role of THEME_ROLES) full[role.cssVar] = "#123456";
  full["brand-logo-tint"] = "#abcdef";
  const r2 = validateTheme(full);
  assert.equal(r2.valid, true);
  assert.deepEqual(r2.unknown, ["brand-logo-tint"]);
});

test("mergeTheme: overrides win, keys normalise (--x or x)", () => {
  const merged = mergeTheme({ "--ground": "#000", ink: "#fff" }, { ground: "#111" });
  assert.equal(merged.ground, "#111", "override wins");
  assert.equal(merged.ink, "#fff", "inherited value kept");
});

test("themeCss emits a scoped block with role + chassis + extra vars", () => {
  const css = themeCss("acme", { ground: "#0e1116", "brd-heavy": "4px", "brand-x": "#f00" }, {
    selector: ':root[data-theme="acme"]',
    scheme: "dark",
  });
  assert.match(css, /:root\[data-theme="acme"\] \{/);
  assert.match(css, /color-scheme: dark;/);
  assert.match(css, /--ground: #0e1116;/);
  assert.match(css, /--brd-heavy: 4px;/); // chassis override passes through
  assert.match(css, /--brand-x: #f00;/); // brand extension var passes through
});

test("contrastRatio: known pairs; gradients are unscored (null)", () => {
  assert.ok(Math.abs(contrastRatio("#000000", "#ffffff") - 21) < 0.01, "black/white ≈ 21");
  assert.equal(contrastRatio("#777", "#777"), 1, "same colour = 1");
  assert.equal(contrastRatio("#fff", "radial-gradient(...)"), null, "non-flat colour → null");
});

test("defineTheme: extends dark, validates, renders, contrast-checks", () => {
  const dark = tokens.themes.dark;
  const base = {};
  for (const [k, v] of Object.entries(dark)) if (!k.startsWith("$")) base[k] = v;

  const brand = defineTheme("acme", { $extends: base, ink: "#f5f5f5", ground: "#101014" });
  assert.equal(brand.validation.valid, true, "merged theme is complete");
  assert.match(brand.css, /--ink: #f5f5f5;/);
  assert.match(brand.css, /--sig-work: #00d3fb;/); // inherited from dark
  assert.equal(brand.contrast.ok, true, `contrast failures: ${JSON.stringify(brand.contrast.failures)}`);

  // strict by default: missing roles throw
  assert.throws(() => defineTheme("bad", { ground: "#000" }), /missing required roles/);
});

test("the worked brand (brands/slate.json) is valid, complete, and legible", () => {
  const slate = read("brands/slate.json");
  const base = {};
  const dark = tokens.themes.slate ? null : tokens.themes[slate.$extends];
  for (const [k, v] of Object.entries(dark)) if (!k.startsWith("$")) base[k] = v;
  const overrides = Object.fromEntries(Object.entries(slate).filter(([k]) => !k.startsWith("$")));
  const vars = mergeTheme(base, overrides);

  const v = validateTheme(vars);
  assert.equal(v.valid, true, `slate missing: ${v.missing.join(", ")}`);
  const c = checkThemeContrast(vars);
  assert.equal(c.ok, true, `slate contrast failures: ${JSON.stringify(c.failures)}`);
});

test("generated dist/themes/slate.css carries every merged role (build not stale)", () => {
  const slate = read("brands/slate.json");
  const dark = tokens.themes[slate.$extends];
  const base = {};
  for (const [k, v] of Object.entries(dark)) if (!k.startsWith("$")) base[k] = v;
  const overrides = Object.fromEntries(Object.entries(slate).filter(([k]) => !k.startsWith("$")));
  const vars = mergeTheme(base, overrides);

  const onDisk = readFileSync(join(ROOT, "dist/themes/slate.css"), "utf8");
  assert.match(onDisk, /:root\[data-theme="slate"\]/);
  for (const role of THEME_ROLES) {
    assert.ok(onDisk.includes(`${role.cssVar}: ${vars[role.cssVar.replace(/^--/, "")]};`),
      `slate.css should carry ${role.cssVar} from the merge`);
  }
  assert.ok(onDisk.includes("--sig-accent: #6d7cff;"), "slate's own accent override is present");
});
