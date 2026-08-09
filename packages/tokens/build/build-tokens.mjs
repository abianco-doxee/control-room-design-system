#!/usr/bin/env node
/**
 * Control Room token build.
 *
 * Single source of truth: tokens/tokens.json.
 * Style Dictionary transforms the per-theme dictionaries and emits the CSS
 * custom-property declarations; this script assembles them into the themed
 * selectors and writes the runtime artifacts:
 *
 *   dist/control-room.css     — all four themes + global baseline
 *   dist/tw-theme.css         — Tailwind v4 @theme (colors resolve to CSS vars)
 *   dist/tokens.flat.json     — resolved cssVar -> value, per theme
 *
 * Run:   node build/build-tokens.mjs
 * Check: node build/build-tokens.mjs --check   (fails if dist/ is stale)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CHASSIS_OVERRIDABLE,
  THEME_ROLES,
  TYPE_OVERRIDABLE,
  themeCss,
} from "@control-room/utils/theme";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "tokens", "tokens.json");
const DIST = join(ROOT, "dist");
const CHECK = process.argv.includes("--check");

const src = JSON.parse(readFileSync(SRC, "utf8"));

/* ── 1. flatten tokens.json into per-theme { cssVarName: value } maps ────── */

// non-themed chassis / typography / motion → live in :root (the dark block)
function baseVars() {
  const out = {};
  const walk = (node) => {
    if (node && typeof node === "object") {
      if (typeof node.cssVar === "string" && "value" in node) {
        out[node.cssVar.replace(/^--/, "")] = node.value;
      } else {
        for (const [k, v] of Object.entries(node)) if (!k.startsWith("$")) walk(v);
      }
    }
  };
  walk(src.primitive); // global scales (spacing, type, radius, z)
  walk(src.chassis);
  walk(src.typography);
  walk(src.motion);
  walk(src.component); // component tier (var() refs, theme-independent)
  return out;
}

// a theme's color set → { name: value }; extreme also carries chassis overrides
function themeVars(themeKey) {
  const t = src.themes[themeKey];
  const out = {};
  for (const [k, v] of Object.entries(t)) {
    if (k.startsWith("$")) continue;
    out[k] = v;
  }
  if (t.$chassisOverride) for (const [k, v] of Object.entries(t.$chassisOverride)) out[k] = v;
  return out;
}

const THEMES = src.meta.themes; // ["dark","light","extreme","phosphor"]
const base = baseVars();

// dark selector carries base + dark colors; others carry only their overrides
const dictFor = (theme) =>
  theme === src.meta.defaultTheme ? { ...base, ...themeVars(theme) } : themeVars(theme);

/* ── 2. emit the variable declarations ───────────────────────────────────── */
// Token names in the flat map are already kebab cssVar names, so this is a
// plain join — no build framework needed.

function varsBody(theme) {
  return Object.entries(dictFor(theme))
    .map(([name, value]) => `  --${name}: ${value};`)
    .join("\n");
}

/* ── 3. assemble control-room.css ───────────────────────────────────────── */

// Themes select on ANY element carrying [data-theme], not just :root — so a
// container can run a different theme than the page (a light panel inside a dark
// app). [data-theme="x"] still matches <html data-theme="x">, so root theming is
// unchanged; token indirection (--cr-* → var(--sig-*)) resolves at the use-site,
// so a scoped subtree re-themes correctly. See references/theming.md#local-scope.
const SELECTOR = {
  dark: ':root, [data-theme="dark"]',
  light: '[data-theme="light"]',
  extreme: '[data-theme="extreme"]',
  phosphor: '[data-theme="phosphor"]',
};
const SCHEME = { dark: "dark", light: "light", extreme: "dark", phosphor: "dark" };

const BANNER = `/* ============================================================================
 * CONTROL ROOM — Design System Tokens  (GENERATED — do not edit by hand)
 * Source of truth: tokens/tokens.json  ·  Regenerate: npm run build:tokens
 * Themes select via html[data-theme]: dark (default) | light | extreme | phosphor
 * ==========================================================================*/\n`;

const BASELINE = `
/* ── GLOBAL BASELINE ──────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--ground);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
/* Focus is a first-class signal, not an afterthought. */
*:focus-visible { outline: var(--focus-w) solid var(--sig-work); outline-offset: var(--focus-offset); }
/* Motion is opt-out at the system level. */
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
/* Loudness dial — a product setting, not a user preference. The default look is the
   loud "showcase" profile; set data-intensity="calm" on <html> for an 8-hour
   operations profile: no non-essential animation, decorative texture toned down.
   Wire new decorative layers to var(--decoration-intensity) so they follow it. */
:root[data-intensity="calm"] { --motion-intensity: 0; --decoration-intensity: 0.4; }
:root[data-intensity="calm"] *,
:root[data-intensity="calm"] *::before,
:root[data-intensity="calm"] *::after {
  animation-duration: 0.001ms !important;
  animation-iteration-count: 1 !important;
}
`;

async function buildCss() {
  let css = BANNER;
  for (const theme of THEMES) {
    const body = await varsBody(theme);
    css += `\n${SELECTOR[theme]} {\n  color-scheme: ${SCHEME[theme]};\n${body}\n}\n`;
  }
  css += BASELINE;
  return css;
}

/* ── 3b. the feature ⇄ appearance split ──────────────────────────────────
 * The same tokens, emitted as two independent layers so a consumer can keep the
 * structure and swap only the appearance:
 *   - dist/structure.css   — brand-AGNOSTIC: primitives, chassis, type, motion,
 *     component tokens + the global baseline. Ship once; never changes with brand.
 *   - dist/themes/<t>.css  — one theme = just the semantic role values (+ any
 *     chassis override). This is the ONLY thing a brand replaces.
 * dist/control-room.css stays the all-in-one bundle (back-compat). */

const STRUCTURE_BANNER = `/* ============================================================================
 * CONTROL ROOM — Structure layer  (GENERATED — do not edit by hand)
 * The brand-agnostic FEATURE layer: spacing, borders, shadows, type, motion,
 * component tokens + global baseline. Pair with ONE theme from dist/themes/*.css
 * (or your own brand — see references/theming.md). Source: tokens/tokens.json.
 * ==========================================================================*/\n`;

function structureCss() {
  const body = Object.entries(base)
    .map(([name, value]) => `  --${name}: ${value};`)
    .join("\n");
  return `${STRUCTURE_BANNER}\n:root {\n${body}\n}\n${BASELINE}`;
}

const THEME_BANNER = (
  theme
) => `/* Control Room theme: ${theme} (GENERATED). Appearance layer only — pair with
 * dist/structure.css. Source: tokens/tokens.json → npm run build:tokens. */\n`;

// one standalone theme file: the semantic role values (dark also claims :root).
function splitThemeCss(theme) {
  const selector =
    theme === src.meta.defaultTheme ? `:root, [data-theme="${theme}"]` : `[data-theme="${theme}"]`;
  return (
    THEME_BANNER(theme) + themeCss(theme, themeVars(theme), { selector, scheme: SCHEME[theme] })
  );
}

/* ── 3c. the theme contract (machine-readable appearance surface) ─────────
 * Every semantic role a complete theme must fill — the boundary a brand author
 * writes to. Derived straight from tokens.json's semantic tier; a node test keeps
 * it in lock-step with lib/theme's THEME_ROLES. */
function themeContract() {
  const GROUPS = ["surface", "text", "line", "signal", "keyed", "texture"];
  const roles = [];
  for (const group of GROUPS) {
    for (const v of Object.values(src.semantic[group] || {})) {
      if (!v || typeof v.cssVar !== "string") continue;
      roles.push({ cssVar: v.cssVar, group, role: v.role || "", required: true });
    }
  }
  return (
    JSON.stringify(
      {
        $generated: true,
        $description:
          "Control Room theme contract — the appearance surface a theme/brand must define. " +
          "Components reference ONLY these roles, so any complete theme reskins the whole system. " +
          "See references/theming.md.",
        source: "tokens/tokens.json",
        version: src.meta.version,
        defaultTheme: src.meta.defaultTheme,
        selector: src.meta.selector,
        roles,
        chassisOverridable: CHASSIS_OVERRIDABLE,
        typeOverridable: TYPE_OVERRIDABLE,
      },
      null,
      2
    ) + "\n"
  );
}

/* Guard: the contract derived from tokens.json must match lib/theme's runtime copy
 * so the two never drift (also asserted from the test suite). */
function assertContractInSync() {
  const fromTokens = JSON.parse(themeContract()).roles.map((r) => r.cssVar);
  const fromLib = THEME_ROLES.map((r) => r.cssVar);
  const a = JSON.stringify(fromTokens);
  const b = JSON.stringify(fromLib);
  if (a !== b) {
    throw new Error(
      "Theme contract drift: tokens.json semantic roles ≠ lib/theme THEME_ROLES.\n" +
        `  tokens: ${a}\n  lib:    ${b}`
    );
  }
}

/* ── 4. flat json ────────────────────────────────────────────────────────── */

function flatJson() {
  const out = {};
  for (const theme of THEMES) {
    const merged =
      theme === src.meta.defaultTheme ? { ...base, ...themeVars(theme) } : themeVars(theme);
    out[theme] = Object.fromEntries(Object.entries(merged).map(([k, v]) => [`--${k}`, v]));
  }
  return (
    JSON.stringify({ $generated: true, source: "tokens/tokens.json", themes: out }, null, 2) + "\n"
  );
}

/* ── 5. DTCG export (Design Tokens Community Group format) ────────────────
 * Mirrors the Doxee Design-System-Hub convention: framework-agnostic tokens
 * with $type/$value/$description and a com.doxee.cssVar extension, so Control
 * Room tokens are consumable by the same tooling and the DTCG standard. */

function dtcgType(name, value) {
  if (typeof value === "number") return name.includes("weight") ? "fontWeight" : "number";
  if (/^#|^rgb|^hsl/.test(String(value))) return "color";
  if (name.includes("font-") && /sans|mono/.test(name)) return "fontFamily";
  if (/^-?\d*\.?\d+(px|rem|em)$/.test(String(value))) return "dimension";
  if (/^\d+(ms|s)$/.test(String(value))) return "duration";
  return undefined; // e.g. text-transform, gradient — left untyped, still valid
}
const tok = (name, value, desc) => {
  const t = dtcgType(name, value);
  return {
    ...(t ? { $type: t } : {}),
    $value: value,
    ...(desc ? { $description: desc } : {}),
    $extensions: { "com.doxee.cssVar": `--${name}` },
  };
};

function dtcg() {
  const out = {
    $schema: "https://www.designtokens.org/tr/2025.10/format/",
    $description:
      "Control Room design tokens — framework-agnostic (DTCG). Generated from tokens/tokens.json; do not edit by hand.",
  };
  // theme-independent groups, keyed by cssVar (minus the leading --)
  const grp = (obj) => {
    const g = {};
    const walk = (node) => {
      if (node && typeof node === "object") {
        if (typeof node.cssVar === "string" && "value" in node)
          g[node.cssVar.replace(/^--/, "")] = tok(
            node.cssVar.replace(/^--/, ""),
            node.value,
            node.use || node.role
          );
        else for (const [k, v] of Object.entries(node)) if (!k.startsWith("$")) walk(v);
      }
    };
    walk(obj);
    return g;
  };
  out.primitive = grp(src.primitive);
  out.chassis = grp(src.chassis);
  out.typography = grp(src.typography);
  out.motion = grp(src.motion);
  out.component = grp(src.component);

  // per-theme color roles, grouped by semantic role (surface/text/line/signal/keyed/texture)
  out.theme = {};
  const GROUPS = ["surface", "text", "line", "signal", "keyed", "texture"];
  for (const theme of THEMES) {
    const tvals = src.themes[theme];
    const themeOut = {};
    for (const group of GROUPS) {
      const g = {};
      for (const v of Object.values(src.semantic[group])) {
        if (!v || typeof v.cssVar !== "string") continue;
        const name = v.cssVar.replace(/^--/, "");
        if (!(name in tvals)) continue;
        g[name] = tok(name, tvals[name], v.role);
      }
      if (Object.keys(g).length) themeOut[group] = g;
    }
    if (tvals.$chassisOverride) {
      themeOut.chassis = {};
      for (const [k, val] of Object.entries(tvals.$chassisOverride))
        themeOut.chassis[k] = tok(k, val, "chassis override");
    }
    for (const extra of ["extra-purple", "extra-orange"]) {
      if (extra in tvals)
        (themeOut.extra ??= {})[extra] = tok(extra, tvals[extra], "extreme-only extension hue");
    }
    out.theme[theme] = themeOut;
  }
  return JSON.stringify(out, null, 2) + "\n";
}

/* ── 6b. Tailwind v4 @theme (generated from tokens) ──────────────────────
 * Colors reference the runtime CSS vars so utilities follow html[data-theme];
 * scales/fonts are literal. Import after "tailwindcss" (see styles/tailwind.css). */
function twTheme() {
  const colorMap = {
    ground: "--ground",
    board: "--board",
    panel: "--panel",
    "panel-2": "--panel-2",
    ink: "--ink",
    muted: "--muted",
    border: "--border",
    rail: "--rail",
    "rail-ink": "--rail-ink",
    "on-sig": "--on-sig",
    "on-err": "--on-err",
    stage: "--stage",
    drip: "--drip",
    work: "--sig-work",
    wait: "--sig-wait",
    done: "--sig-done",
    err: "--sig-err",
    idle: "--sig-idle",
    accent: "--sig-accent",
    accent2: "--sig-accent-2",
    "on-accent": "--on-accent",
    "on-idle": "--on-idle",
  };
  const L = [];
  for (const [name, v] of Object.entries(colorMap)) L.push(`  --color-${name}: var(${v});`);
  for (const [k, t] of Object.entries(src.primitive.text))
    if (t.cssVar) L.push(`  --text-${k}: ${t.value};`);
  L.push(`  --font-sans: ${src.typography.family.sans.value};`);
  L.push(`  --font-display: ${src.typography.family.display.value};`);
  L.push(`  --font-mono: ${src.typography.family.mono.value};`);
  L.push(`  --spacing: 0.25rem;`); // 4px base → p-1=4px … matches --space-*
  for (const r of ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"])
    L.push(`  --radius-${r}: 0px;`);
  return (
    `/* GENERATED from tokens.json — Tailwind v4 @theme. Do not edit.\n` +
    ` * Import after "tailwindcss"; colors follow html[data-theme] via the runtime vars\n` +
    ` * in dist/control-room.css. See references/tailwind.md. */\n@theme {\n${L.join("\n")}\n}\n`
  );
}

/* ── 6. write / check ───────────────────────────────────────────────────── */

assertContractInSync();

const css = await buildCss();
const flat = flatJson();
const dtcgJson = dtcg();
const twThemeCss = twTheme();

// [path relative to repo root, content]
const targets = [
  ["dist/control-room.css", css],
  ["dist/structure.css", structureCss()],
  ["dist/theme-contract.json", themeContract()],
  ["dist/tw-theme.css", twThemeCss],
  ["dist/tokens.flat.json", flat],
  ["design-tokens/control-room.tokens.json", dtcgJson],
  ...THEMES.map((t) => [`dist/themes/${t}.css`, splitThemeCss(t)]),
];

if (CHECK) {
  let stale = false;
  for (const [rel, content] of targets) {
    const p = join(ROOT, rel);
    const cur = existsSync(p) ? readFileSync(p, "utf8") : "";
    if (cur !== content) {
      stale = true;
      console.error(`✗ ${rel} is out of date`);
    }
  }
  if (stale) {
    console.error("\nRun: npm run build:tokens, then commit the generated files.");
    process.exit(1);
  }
  console.log("✓ generated token artifacts are up to date with tokens/tokens.json");
  process.exit(0);
}

for (const [rel, content] of targets) {
  mkdirSync(dirname(join(ROOT, rel)), { recursive: true });
  writeFileSync(join(ROOT, rel), content);
  console.log(`wrote ${rel}  (${content.length} bytes)`);
}
