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
 *   dist/tailwind-preset.cjs  — Tailwind colors/spacing mapped to the CSS vars
 *   dist/tokens.flat.json     — resolved cssVar -> value, per theme
 *
 * Run:   node build/build-tokens.mjs
 * Check: node build/build-tokens.mjs --check   (fails if dist/ is stale)
 */
import StyleDictionary from "style-dictionary";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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
  walk(src.chassis);
  walk(src.typography);
  walk(src.motion);
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

/* ── 2. use Style Dictionary to emit the variable declarations ───────────── */

StyleDictionary.registerFormat({
  name: "cr/vars-body",
  format: ({ dictionary }) =>
    dictionary.allTokens.map((t) => `  --${t.name}: ${t.value};`).join("\n"),
});

async function varsBody(theme) {
  // wrap each flat value as a Style Dictionary token: { name: { value } }
  const tokens = Object.fromEntries(
    Object.entries(dictFor(theme)).map(([name, value]) => [name, { value }]),
  );
  const sd = new StyleDictionary({
    tokens,
    log: { verbosity: "silent" },
    platforms: {
      css: {
        transforms: ["name/kebab"],
        buildPath: join(DIST, ".sd", theme) + "/",
        files: [{ destination: "vars.css", format: "cr/vars-body" }],
      },
    },
  });
  await sd.buildAllPlatforms();
  return readFileSync(join(DIST, ".sd", theme, "vars.css"), "utf8");
}

/* ── 3. assemble control-room.css ───────────────────────────────────────── */

const SELECTOR = {
  dark: ':root, :root[data-theme="dark"]',
  light: ':root[data-theme="light"]',
  extreme: ':root[data-theme="extreme"]',
  phosphor: ':root[data-theme="phosphor"]',
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
*:focus-visible { outline: 3px solid var(--sig-work); outline-offset: 2px; }
/* Motion is opt-out at the system level. */
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
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

/* ── 4. tailwind preset + flat json ─────────────────────────────────────── */

function tailwindPreset() {
  const ref = (n) => `var(--${n})`;
  // expose the semantic color roles by their token name; utilities resolve to
  // the CSS vars, so they follow html[data-theme] automatically.
  const colorRoles = {};
  for (const group of ["surface", "text", "line", "signal", "keyed"]) {
    for (const v of Object.values(src.semantic[group])) {
      if (!v || typeof v.cssVar !== "string") continue; // skip $comment etc.
      const name = v.cssVar.replace(/^--/, "");
      colorRoles[name] = ref(name);
    }
  }
  return `/* GENERATED — do not edit. Source: tokens/tokens.json */
/* Tailwind preset. Colors resolve to CSS custom properties, so utilities
   follow html[data-theme] automatically. Usage: presets: [require('./dist/tailwind-preset.cjs')] */
module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(colorRoles, null, 8).replace(/\n/g, "\n      ")},
      borderRadius: { none: "0px", DEFAULT: "0px" },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"]
      }
    }
  },
  corePlugins: { /* radius stays 0 by system law */ }
};
`;
}

function flatJson() {
  const out = {};
  for (const theme of THEMES) {
    const merged = theme === src.meta.defaultTheme ? { ...base, ...themeVars(theme) } : themeVars(theme);
    out[theme] = Object.fromEntries(Object.entries(merged).map(([k, v]) => [`--${k}`, v]));
  }
  return JSON.stringify({ $generated: true, source: "tokens/tokens.json", themes: out }, null, 2) + "\n";
}

/* ── 5. write / check ───────────────────────────────────────────────────── */

const css = await buildCss();
const tw = tailwindPreset();
const flat = flatJson();

const targets = [
  ["control-room.css", css],
  ["tailwind-preset.cjs", tw],
  ["tokens.flat.json", flat],
];

if (CHECK) {
  let stale = false;
  for (const [name, content] of targets) {
    const p = join(DIST, name);
    const cur = existsSync(p) ? readFileSync(p, "utf8") : "";
    if (cur !== content) { stale = true; console.error(`✗ dist/${name} is out of date`); }
  }
  if (stale) { console.error("\nRun: npm run build:tokens, then commit dist/."); process.exit(1); }
  console.log("✓ dist/ is up to date with tokens/tokens.json");
  process.exit(0);
}

mkdirSync(DIST, { recursive: true });
for (const [name, content] of targets) {
  writeFileSync(join(DIST, name), content);
  console.log(`wrote dist/${name}  (${content.length} bytes)`);
}
