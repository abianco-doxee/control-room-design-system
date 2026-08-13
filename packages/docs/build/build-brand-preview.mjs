#!/usr/bin/env node
/**
 * Brand preview — a self-contained swatch page for every theme (built-in + brand).
 *
 * Reads the generated appearance files (@alebianco/cr-tokens themes/*.css), re-scopes each theme's
 * role values to a container class, and renders — on one page — the surface ladder,
 * the signal ramp with its on-colour text and measured WCAG contrast, and a strip
 * of live components. It's the brand author's proof sheet: does this brand read
 * right, and does every text-on-fill pairing clear contrast?
 *
 * Reads only the built appearance files (no re-resolution), so it always reflects
 * exactly what ships. Run after build:tokens + build:theme.
 *
 * Run: node build/build-brand-preview.mjs → public/brands.html
 *      node build/build-brand-preview.mjs --check → fail if the committed page is stale
 *
 * brands.html INLINES components.css, so any change to the stylesheet silently
 * staleness-rots this committed page unless it is rebuilt. --check wires that
 * into `verify` so the gap can't reopen.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contrastRatio } from "@alebianco/cr-utils/theme";

const CHECK = process.argv.includes("--check");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const THEMES = join(ROOT, "..", "..", "packages", "tokens", "dist", "themes");
const BRANDS = join(ROOT, "..", "..", "packages", "tokens", "brands");

const structureCss = readFileSync(
  join(ROOT, "..", "..", "packages", "tokens", "dist", "structure.css"),
  "utf8"
);
const componentsCss = readFileSync(
  join(ROOT, "..", "..", "packages", "styles", "styles", "components.css"),
  "utf8"
);

const BUILTIN = ["dark", "light", "extreme", "phosphor"];
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]
  );

/** Parse a theme file's first rule block into { scheme, vars }. */
function parseTheme(css) {
  const block = (css.match(/\{([^}]*)\}/) || [])[1] || "";
  const vars = {};
  for (const m of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  const scheme = (block.match(/color-scheme:\s*(\w+)/) || [])[1] || "dark";
  return { scheme, vars };
}

/** Read every theme (built-ins first, then brands), each with a label. */
function collectThemes() {
  const files = readdirSync(THEMES)
    .filter((f) => f.endsWith(".css"))
    .map((f) => basename(f, ".css"));
  const order = [
    ...BUILTIN.filter((b) => files.includes(b)),
    ...files.filter((f) => !BUILTIN.includes(f)).sort(),
  ];
  return order.map((name) => {
    const { scheme, vars } = parseTheme(readFileSync(join(THEMES, `${name}.css`), "utf8"));
    let label = name;
    const brandBase = name.replace(/-(light|dark|hc)$/, "");
    const bp = join(BRANDS, `${brandBase}.json`);
    if (existsSync(bp)) label = JSON.parse(readFileSync(bp, "utf8")).$label || name;
    else if (BUILTIN.includes(name)) label = `${name} · built-in`;
    return { name, label, scheme, vars, brand: !BUILTIN.includes(name) };
  });
}

const SURFACES = [
  { k: "ground", on: "ink" },
  { k: "board", on: "ink" },
  { k: "panel", on: "ink" },
  { k: "panel-2", on: "ink" },
  { k: "rail", on: "rail-ink" },
];
const SIGNALS = [
  { k: "sig-work", on: "on-sig", t: "work" },
  { k: "sig-wait", on: "on-sig", t: "wait" },
  { k: "sig-done", on: "on-sig", t: "done" },
  { k: "sig-err", on: "on-err", t: "err" },
  { k: "sig-idle", on: "on-idle", t: "idle" },
  { k: "sig-accent", on: "on-accent", t: "accent" },
  { k: "sig-accent-2", on: "on-accent-2", t: "accent2" },
];

/** A swatch showing a fill, its on-colour label, and the measured contrast. */
function swatch(vars, fillKey, onKey, text, min) {
  const fill = vars[fillKey],
    on = vars[onKey];
  const r = contrastRatio(on, fill);
  const badge =
    r == null ? "" : `<b class="ratio ${r >= (min || 3) ? "ok" : "no"}">${r.toFixed(1)}</b>`;
  return `<div class="sw" style="background:var(--${fillKey});color:var(--${onKey})">
    <span>${esc(text)}</span>${badge}</div>`;
}

function samples() {
  // live components, styled purely by the scoped role vars
  return `<div class="samples">
    <button class="cr-btn">Primary</button>
    <button class="cr-btn cr-btn--outline cr-btn--sig-accent">Accent</button>
    <button class="cr-btn cr-btn--ghost">Ghost</button>
    <span class="cr-chip">chip</span>
    <span class="cr-chip cr-chip--sig-err">error</span>
    <div class="cr-panel" style="min-width:150px"><div class="cr-panel__body">Panel surface with <a href="#" style="color:var(--sig-work)">a link</a>.</div></div>
  </div>`;
}

function section(t) {
  const surf = SURFACES.map((s) => swatch(t.vars, s.k, s.on, s.k, 4.5)).join("");
  const sig = SIGNALS.map((s) => swatch(t.vars, s.k, s.on, s.t, 3)).join("");
  return `<section class="brand-${t.name}">
    <header><h2>${esc(t.label)}</h2><code>data-theme="${esc(t.name)}"</code>
      <span class="scheme">${esc(t.scheme)}${t.brand ? " · brand" : ""}</span></header>
    <div class="row"><div class="lbl">surfaces</div><div class="swatches">${surf}</div></div>
    <div class="row"><div class="lbl">signals</div><div class="swatches">${sig}</div></div>
    <div class="row"><div class="lbl">type</div><div class="specimen">
      <span class="disp">Aa</span>
      <span class="data">0123 · nominal · SYSTEM READY</span>
    </div></div>
    ${samples()}
  </section>`;
}

const themes = collectThemes();
const scopedVars = themes
  .map(
    (t) =>
      `.brand-${t.name}{color-scheme:${t.scheme};` +
      Object.entries(t.vars)
        .map(([k, v]) => `--${k}:${v}`)
        .join(";") +
      "}"
  )
  .join("\n");

const PAGE_CSS = `
  body{margin:0;background:#0b0b12;color:#e6e6f2;font-family:var(--font-mono),monospace;padding:24px;display:grid;gap:20px}
  h1{font-family:var(--font-display,sans-serif);text-transform:uppercase;letter-spacing:-.02em;margin:0 0 4px}
  .intro{color:#8a8aa6;font-size:12px;margin:0 0 8px;max-width:70ch;line-height:1.6}
  section{border:2px solid var(--border,#000);background:var(--ground);color:var(--ink);padding:16px;display:grid;gap:12px}
  header{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;border-bottom:var(--brd-hair,1.5px) solid var(--border);padding-bottom:8px}
  header h2{margin:0;font-family:var(--font-display,sans-serif);text-transform:uppercase;font-size:18px}
  header code{font-size:11px;color:var(--muted)}
  header .scheme{margin-left:auto;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted)}
  .row{display:flex;gap:10px;align-items:center}
  .row .lbl{width:64px;flex:none;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted)}
  .swatches{display:flex;gap:6px;flex-wrap:wrap}
  .sw{min-width:80px;height:44px;border:var(--brd-hair,1.5px) solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 8px;font-size:11px}
  .sw .ratio{font-size:10px;font-weight:800;padding:1px 4px}
  .sw .ratio.ok{opacity:.7}
  .sw .ratio.no{background:#f45058;color:#fff}
  .samples{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding-top:4px}
  .specimen{display:flex;align-items:baseline;gap:12px;min-height:36px}
  .specimen .disp{font-family:var(--font-display);font-weight:var(--type-display-weight,900);letter-spacing:var(--type-display-tracking,-.03em);text-transform:var(--type-display-transform,uppercase);font-size:32px;line-height:1;color:var(--ink)}
  .specimen .data{font-family:var(--font-mono);font-size:var(--text-sm,12px);color:var(--muted)}
`;

const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Control Room — Brand Preview</title>
<style>${structureCss}\n${componentsCss}\n${scopedVars}\n${PAGE_CSS}</style></head>
<body>
<div><h1>Brand preview</h1>
<p class="intro">Every theme (built-in + brand) rendered from its shipped appearance file: the surface ladder, the signal ramp with its on-colour text and measured WCAG contrast (green = ok, red = below target), and live components. Generated by build/build-brand-preview.mjs.</p></div>
${themes.map(section).join("\n")}
</body></html>`;

const out = join(ROOT, "public", "brands.html");

if (CHECK) {
  const current = existsSync(out) ? readFileSync(out, "utf8") : null;
  if (current !== html) {
    console.error("✗ public/brands.html is stale — run `npm run build:brand-preview`");
    process.exit(1);
  }
  console.log(`✓ brand preview is up to date (${themes.length} themes)`);
  process.exit(0);
}

mkdirSync(join(ROOT, "public"), { recursive: true });
writeFileSync(out, html);
console.log(`wrote public/brands.html  (${themes.length} themes, ${html.length} bytes)`);
