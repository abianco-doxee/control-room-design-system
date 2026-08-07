#!/usr/bin/env node
/**
 * Control Room brand build.
 *
 * Turns author-written brand files (brands/*.json) into ready-to-ship theme CSS
 * (dist/themes/<name>.css) — the "author a brand without forking" path. A brand
 * file is just appearance: role overrides plus optional metadata
 *   $extends  — a built-in theme name (or another brand name) to inherit from, so
 *               the brand only states what differs;
 *   $label / $description / $scheme / $selector — optional.
 *
 * Every brand is validated against the theme contract (all required roles present
 * once merged) and contrast-checked before it's written. Rendering goes through
 * lib/theme's themeCss — the SAME renderer the built-in themes use.
 *
 * Run:   node build/build-theme.mjs            (all brands/*.json)
 *        node build/build-theme.mjs slate      (one brand)
 * Check: node build/build-theme.mjs --check    (fails if any dist/themes/*.css is stale)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";
import { themeCss, mergeTheme, validateTheme, checkThemeContrast } from "../lib/theme/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BRANDS = join(ROOT, "brands");
const DIST = join(ROOT, "dist", "themes");
const TOKENS = join(ROOT, "tokens", "tokens.json");

const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const only = args.filter((a) => !a.startsWith("--"));

/* Built-in themes for $extends — read their APPEARANCE ONLY (semantic role values
 * plus any explicit chassis override) straight from tokens.json, never the flat
 * bundle (which folds the whole structure layer into the default theme). Inheriting
 * a theme must inherit appearance, not structure — that's the whole point. */
const tokensSrc = existsSync(TOKENS) ? JSON.parse(readFileSync(TOKENS, "utf8")) : { themes: {} };
function builtInAppearance(name) {
  const t = tokensSrc.themes[name];
  if (!t) return null;
  const out = {};
  for (const [k, v] of Object.entries(t)) if (!k.startsWith("$")) out[k] = v;
  if (t.$chassisOverride) for (const [k, v] of Object.entries(t.$chassisOverride)) out[k] = v;
  return out;
}

/** Resolve a $extends reference (a built-in theme name, or another brand file). */
function resolveBase(ref, seen) {
  if (!ref) return {};
  const builtIn = builtInAppearance(ref);
  if (builtIn) return builtIn;
  const p = join(BRANDS, `${ref}.json`);
  if (existsSync(p)) {
    if (seen.has(ref)) throw new Error(`Cyclic $extends via "${ref}"`);
    seen.add(ref);
    return resolveBrand(JSON.parse(readFileSync(p, "utf8")), seen).vars;
  }
  throw new Error(`$extends: "${ref}" is neither a built-in theme nor a brands/*.json`);
}

function resolveBrand(brand, seen = new Set()) {
  const base = resolveBase(brand.$extends, seen);
  const overrides = Object.fromEntries(Object.entries(brand).filter(([k]) => !k.startsWith("$")));
  return { vars: mergeTheme(base, overrides), meta: brand };
}

function brandFiles() {
  const all = existsSync(BRANDS)
    ? readdirSync(BRANDS).filter((f) => f.endsWith(".json")).map((f) => basename(f, ".json"))
    : [];
  return only.length ? all.filter((n) => only.includes(n)) : all;
}

function render(name) {
  const brand = JSON.parse(readFileSync(join(BRANDS, `${name}.json`), "utf8"));
  const { vars } = resolveBrand(brand);
  const v = validateTheme(vars);
  if (!v.valid) {
    throw new Error(`Brand "${name}" is missing required roles: ${v.missing.join(", ")}`);
  }
  const banner = `/* Control Room brand: ${name}${brand.$label ? ` — ${brand.$label}` : ""} (GENERATED
 * from brands/${name}.json). Appearance layer only — pair with dist/structure.css.
 * Regenerate: npm run build:theme. */\n`;
  const css = banner + themeCss(name, vars, {
    selector: brand.$selector || `:root[data-theme="${name}"]`,
    scheme: brand.$scheme || "dark",
  });
  const contrast = checkThemeContrast(vars);
  return { css, contrast, unknown: v.unknown };
}

const names = brandFiles();
if (!names.length) {
  console.log(only.length ? `No matching brand for: ${only.join(", ")}` : "No brands/*.json to build.");
  process.exit(0);
}

let stale = false;
for (const name of names) {
  const { css, contrast, unknown } = render(name);
  const rel = `dist/themes/${name}.css`;
  const p = join(DIST, `${name}.css`);
  if (CHECK) {
    const cur = existsSync(p) ? readFileSync(p, "utf8") : "";
    if (cur !== css) { stale = true; console.error(`✗ ${rel} is out of date`); }
    continue;
  }
  mkdirSync(DIST, { recursive: true });
  writeFileSync(p, css);
  let msg = `wrote ${rel}  (${css.length} bytes)`;
  if (contrast.failures.length) {
    msg += `  ⚠ contrast: ${contrast.failures.map((f) => `${f.label} ${f.ratio}<${f.min}`).join("; ")}`;
  }
  if (unknown.length) msg += `  · extra vars: ${unknown.join(", ")}`;
  console.log(msg);
}

if (CHECK) {
  if (stale) { console.error("\nRun: npm run build:theme, then commit dist/themes/*.css."); process.exit(1); }
  console.log("✓ brand theme CSS is up to date with brands/*.json");
}
