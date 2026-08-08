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
  autoOnColor,
  deriveOnColors,
  ON_PAIRS,
} from "../lib/theme/index.js";
import { surfaceRamp } from "../build/ramp.mjs";
import { toneSignals, fitSignals, SIGNAL_KEYS } from "../build/signals.mjs";
import { oklch } from "culori";

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

test("autoOnColor picks the more legible ink for a fill", () => {
  assert.equal(autoOnColor("#f9ad00"), "#06050c", "dark ink on a light amber fill");
  assert.equal(autoOnColor("#4338ca"), "#ffffff", "white ink on a deep indigo fill");
});

test("deriveOnColors: fills missing, re-derives changed fills, keeps hand-set", () => {
  const base = { "sig-accent": "#4338ca", "on-accent": "#ffffff", "sig-wait": "#f9ad00", "on-sig": "#06050c" };

  // (a) missing on-colour is filled
  const filled = deriveOnColors({ ...base, "on-sig": undefined });
  assert.equal(filled["on-sig"], "#06050c");

  // (b) inherited on-colour is re-derived when the brand changed its fill
  const rederived = deriveOnColors(
    { ...base, "sig-accent": "#fff2cc" }, // brand recoloured the accent to a pale fill
    { changed: ["sig-accent"] },
  );
  assert.equal(rederived["on-accent"], "#06050c", "stale white flipped to dark for the pale fill");

  // (c) a hand-set on-colour is never touched, even if its fill changed
  const kept = deriveOnColors(
    { ...base, "sig-accent": "#fff2cc", "on-accent": "#123456" },
    { changed: ["sig-accent", "on-accent"] },
  );
  assert.equal(kept["on-accent"], "#123456", "author-set on-colour preserved");
});

test("surfaceRamp derives a coherent, correctly-ordered surface ladder", () => {
  const dark = surfaceRamp("#141013", "dark");
  const roles = ["ground", "board", "panel", "panel-2", "rail"];
  for (const r of roles) assert.match(dark[r], /^#[0-9a-f]{6}$/i, `${r} is a hex colour`);
  // lightness (proxy: contrast against black — higher = lighter) climbs
  // ground < board < panel < panel-2 for a dark scheme
  const L = (hex) => contrastRatio(hex, "#000000");
  assert.ok(L(dark.ground) < L(dark.board), "board lifts above ground");
  assert.ok(L(dark.board) < L(dark.panel), "panel lifts above board");
  assert.ok(L(dark.panel) < L(dark["panel-2"]), "panel-2 lifts above panel");
  assert.ok(L(dark.rail) <= L(dark.ground), "rail is the deepest tone");

  // a light scheme inverts: surfaces are bright, rail stays deep
  const light = surfaceRamp("#f4f5f7", "light");
  assert.ok(L(light.panel) > L(light.ground), "light panel is brighter than ground");
  assert.ok(L(light.rail) < L(light.ground), "rail stays a deep tone even on light");
});

test("ember brand ($ramp + accent, extends dark) is complete + legible", () => {
  const ember = read("brands/ember.json");
  const dark = tokens.themes.dark;
  const base = {};
  for (const [k, v] of Object.entries(dark)) if (!k.startsWith("$")) base[k] = v;
  const surfaces = surfaceRamp(ember.$ramp, ember.$scheme || "dark");
  const overrides = Object.fromEntries(Object.entries(ember).filter(([k]) => !k.startsWith("$")));
  const vars = deriveOnColors(mergeTheme(mergeTheme(base, surfaces), overrides), { changed: Object.keys(overrides) });

  // surfaces really came from the ramp (not the inherited dark values)
  assert.equal(vars.ground, surfaces.ground);
  assert.notEqual(vars.ground, base.ground);
  const v = validateTheme(vars);
  assert.equal(v.valid, true, `ember missing: ${v.missing.join(", ")}`);
  const c = checkThemeContrast(vars);
  assert.equal(c.ok, true, `ember contrast failures: ${JSON.stringify(c.failures)}`);
});

test("toneSignals lowers chroma while preserving hue (state semantics)", () => {
  const neonDark = {};
  for (const [k, v] of Object.entries(tokens.themes.dark)) if (!k.startsWith("$")) neonDark[k] = v;

  assert.deepEqual(toneSignals(neonDark, "neon"), {}, "neon is identity (no changes)");

  const muted = toneSignals(neonDark, "muted");
  for (const k of ["sig-work", "sig-err", "sig-done"]) {
    const before = oklch(neonDark[k]);
    const after = oklch(muted[k]);
    assert.ok(after.c < before.c, `${k}: chroma should drop when muted`);
    const dh = Math.abs((after.h || 0) - (before.h || 0));
    assert.ok(dh < 8 || dh > 352, `${k}: hue preserved (Δ=${dh.toFixed(1)}°)`);
  }

  // a hand-set signal is skipped
  const skipped = toneSignals(neonDark, "muted", new Set(["sig-err"]));
  assert.equal(skipped["sig-err"], undefined, "skipped role is not toned");
  assert.ok(skipped["sig-work"], "non-skipped role still toned");
});

test("harbor brand ($ramp + muted signals, extends dark) is complete + legible", () => {
  const harbor = read("brands/harbor.json");
  const dark = tokens.themes.dark;
  const base = {};
  for (const [k, v] of Object.entries(dark)) if (!k.startsWith("$")) base[k] = v;
  const surfaces = surfaceRamp(harbor.$ramp, "dark");
  const overrides = Object.fromEntries(Object.entries(harbor).filter(([k]) => !k.startsWith("$")));
  const signals = toneSignals(mergeTheme(base, surfaces), harbor.$signalTone, new Set(Object.keys(overrides)));
  const changed = [...Object.keys(overrides), ...Object.keys(signals)];
  const vars = deriveOnColors(mergeTheme(mergeTheme(mergeTheme(base, surfaces), signals), overrides), { changed });

  assert.notEqual(vars["sig-work"], base["sig-work"], "inherited signal was re-voiced");
  assert.equal(vars["sig-accent"], "#3aa0b0", "explicit accent kept (not toned)");
  const v = validateTheme(vars);
  assert.equal(v.valid, true, `harbor missing: ${v.missing.join(", ")}`);
  const c = checkThemeContrast(vars);
  assert.equal(c.ok, true, `harbor contrast failures: ${JSON.stringify(c.failures)}`);
});

test("fitSignals nudges only the signals that fail contrast on the surface", () => {
  const vars = { panel: "#ffffff", "sig-work": "#00d3fb", "sig-accent": "#4338ca" };
  const fitted = fitSignals(vars, { against: "panel", min: 3 });
  assert.ok(fitted["sig-work"], "low-contrast cyan on white got fitted");
  assert.ok(contrastRatio(fitted["sig-work"], "#ffffff") >= 3, "fitted signal clears 3:1");
  assert.equal(fitted["sig-accent"], undefined, "already-legible indigo is left alone");
});

test("$modes emits a dark + light pair (aurora); the light mode fits its signals", () => {
  const dark = readFileSync(join(ROOT, "dist/themes/aurora.css"), "utf8");
  const light = readFileSync(join(ROOT, "dist/themes/aurora-light.css"), "utf8");
  const pick = (css, k) => (css.match(new RegExp(`--${k}: (#[0-9a-f]{6})`)) || [])[1];

  assert.match(dark, /:root\[data-theme="aurora"\]/);
  assert.match(light, /:root\[data-theme="aurora-light"\]/);

  const lPanel = pick(light, "panel");
  const lWork = pick(light, "sig-work");
  assert.ok(lPanel && lWork, "light mode has panel + sig-work");
  assert.notEqual(lWork, pick(dark, "sig-work"), "light mode re-fit the neon signal");
  assert.ok(contrastRatio(lWork, lPanel) >= 3, "fitted signal clears 3:1 on the light panel");
  // shared brand identity carries across modes (explicit accent untouched)
  assert.equal(pick(light, "sig-accent"), pick(dark, "sig-accent"), "brand accent shared across modes");
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

test("porcelain brand (extends light, on-colours auto-derived) is complete + legible", () => {
  const porcelain = read("brands/porcelain.json");
  assert.equal(porcelain.$extends, "light");
  // the brand file declares NO on-* — they're derived by the build
  for (const on of Object.keys(ON_PAIRS)) assert.equal(on in porcelain, false, `${on} should be omitted, not authored`);

  const light = tokens.themes.light;
  const base = {};
  for (const [k, v] of Object.entries(light)) if (!k.startsWith("$")) base[k] = v;
  const overrides = Object.fromEntries(Object.entries(porcelain).filter(([k]) => !k.startsWith("$")));
  const vars = deriveOnColors(mergeTheme(base, overrides), { changed: Object.keys(overrides) });

  const v = validateTheme(vars);
  assert.equal(v.valid, true, `porcelain missing: ${v.missing.join(", ")}`);
  const c = checkThemeContrast(vars);
  assert.equal(c.ok, true, `porcelain contrast failures: ${JSON.stringify(c.failures)}`);
  // every derived on-colour clears AA-large (3:1) against its own fill
  for (const [on, fill] of Object.entries(ON_PAIRS)) {
    const r = contrastRatio(vars[on], vars[fill]);
    if (r != null) assert.ok(r >= 3, `${on} on ${fill} = ${r.toFixed(2)} (< 3)`);
  }
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
