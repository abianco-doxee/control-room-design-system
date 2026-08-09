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
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkThemeContrast,
  deriveOnColors,
  mergeTheme,
  themeCss,
  validateTheme,
} from "@control-room/utils/theme";
import { chassisFrom } from "./chassis.mjs";
import { surfaceRamp } from "./ramp.mjs";
import { fitSignals, toneSignals } from "./signals.mjs";
import { typeFrom } from "./type.mjs";

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
  /* $ramp: derive the surface ladder (ground…rail) from one base tone in OKLCH.
   * Precedence: $extends base < ramp surfaces < explicit role overrides. */
  let surfaces = {};
  if (brand.$ramp) {
    const baseTone = typeof brand.$ramp === "string" ? brand.$ramp : brand.$ramp.base;
    surfaces = surfaceRamp(baseTone, brand.$scheme || "dark");
  }
  const skip = new Set(Object.keys(overrides).map((k) => k.replace(/^--/, "")));
  /* $signalTone: re-voice the inherited/derived signal ramp (neon → muted/pastel)
   * in OKLCH, hue preserved. Explicit signal overrides are left untouched. */
  let signals = {};
  if (brand.$signalTone && brand.$signalTone !== "neon") {
    signals = toneSignals(mergeTheme(base, surfaces), brand.$signalTone, skip);
  }
  /* $fitSignals: nudge signal lightness for contrast against the surfaces (e.g.
   * a dark neon ramp reused on light surfaces). Runs after toning; skips explicit. */
  if (brand.$fitSignals) {
    const min = typeof brand.$fitSignals === "number" ? brand.$fitSignals : 3;
    const afterTone = mergeTheme(mergeTheme(base, surfaces), signals);
    signals = { ...signals, ...fitSignals(afterTone, { against: "panel", min, skip }) };
  }
  /* $shape / $weight: structural chassis (rounding, border + shadow scale). */
  const chassis = chassisFrom(brand);
  /* $fonts: brand font families. */
  const type = typeFrom(brand);
  /* precedence: $extends base < ramp surfaces < chassis < type < toned/fitted
   * signals < explicit roles (incl. any explicit chassis/type token). on-* re-derive
   * for anything whose fill changed (explicit OR signals). */
  const changed = [...Object.keys(overrides), ...Object.keys(signals)];
  const merged = mergeTheme(
    mergeTheme(mergeTheme(mergeTheme(mergeTheme(base, surfaces), chassis), type), signals),
    overrides
  );
  const vars = deriveOnColors(merged, { changed });
  return { vars, meta: brand };
}

function brandFiles() {
  const all = existsSync(BRANDS)
    ? readdirSync(BRANDS)
        .filter((f) => f.endsWith(".json"))
        .map((f) => basename(f, ".json"))
    : [];
  return only.length ? all.filter((n) => only.includes(n)) : all;
}

/* A brand may carry `$modes` — one definition emitting several themes (e.g. a
 * dark + light pair). Each mode's directives/roles override the shared top-level;
 * the FIRST mode is primary (theme name = <name>), the rest are <name>-<mode>. */
function variantsFor(name, brand) {
  if (!brand.$modes || typeof brand.$modes !== "object") return [{ themeName: name, brand }];
  const { $modes, ...shared } = brand;
  return Object.keys($modes).map((mode, i) => ({
    themeName: i === 0 ? name : `${name}-${mode}`,
    brand: { ...shared, ...$modes[mode] },
  }));
}

function render(name) {
  const file = JSON.parse(readFileSync(join(BRANDS, `${name}.json`), "utf8"));
  return variantsFor(name, file).map(({ themeName, brand }) => {
    const { vars } = resolveBrand(brand);
    const v = validateTheme(vars);
    if (!v.valid) {
      throw new Error(`Brand "${themeName}" is missing required roles: ${v.missing.join(", ")}`);
    }
    const banner = `/* Control Room brand: ${themeName}${brand.$label ? ` — ${brand.$label}` : ""} (GENERATED
 * from brands/${name}.json). Appearance layer only — pair with dist/structure.css.
 * Regenerate: npm run build:theme. */\n`;
    const css =
      banner +
      themeCss(themeName, vars, {
        selector: brand.$selector || `[data-theme="${themeName}"]`,
        scheme: brand.$scheme || "dark",
      });
    return { themeName, css, contrast: checkThemeContrast(vars), unknown: v.unknown };
  });
}

const names = brandFiles();
if (!names.length) {
  console.log(
    only.length ? `No matching brand for: ${only.join(", ")}` : "No brands/*.json to build."
  );
  process.exit(0);
}

let stale = false;
for (const name of names) {
  for (const { themeName, css, contrast, unknown } of render(name)) {
    const rel = `dist/themes/${themeName}.css`;
    const p = join(DIST, `${themeName}.css`);
    if (CHECK) {
      const cur = existsSync(p) ? readFileSync(p, "utf8") : "";
      if (cur !== css) {
        stale = true;
        console.error(`✗ ${rel} is out of date`);
      }
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
}

if (CHECK) {
  if (stale) {
    console.error("\nRun: npm run build:theme, then commit dist/themes/*.css.");
    process.exit(1);
  }
  console.log("✓ brand theme CSS is up to date with brands/*.json");
}
