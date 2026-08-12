#!/usr/bin/env node
/**
 * Build the Component Browser — one card per catalogued component, each rendered
 * and exercised in its states, with a sticky category index and a live theme
 * switch (dark / light / extreme / phosphor). Mirrors the Doxee Design-System-Hub
 * component section. Consumes the SAME shipped CSS a real app would.
 *
 * Output: public/components.html   (served at /components.html)
 * Source of the component list: catalog/catalog.json
 * Per-component state snippets: EXAMPLES below (structure) — anything not listed
 * still gets a card with its variants/tokens and a link to the Live Gallery.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { browserScript } from "./gallery-scripts.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const tokensCss = readFileSync(
  join(ROOT, "..", "..", "packages", "tokens", "dist", "control-room.css"),
  "utf8"
);
const componentsCss = readFileSync(
  join(ROOT, "..", "..", "packages", "styles", "styles", "components.css"),
  "utf8"
);
/* External BRANDS (brands/*.json → dist/themes/<name>.css) live outside the
 * built-in bundle. Appending each proves the whole browser reskins to a brand via
 * one appearance file + data-theme, with no component change. See theming.md. */
const BUILTIN_THEMES = new Set(["dark", "light", "extreme", "phosphor"]);
const themesDir = join(ROOT, "..", "..", "packages", "tokens", "dist", "themes");
const brandThemes = existsSync(themesDir)
  ? readdirSync(themesDir)
      .filter((f) => f.endsWith(".css"))
      .map((f) => f.slice(0, -4))
      .filter((n) => !BUILTIN_THEMES.has(n))
      .sort()
  : [];
const brandThemeCss = brandThemes
  .map((n) => readFileSync(join(themesDir, `${n}.css`), "utf8"))
  .join("\n");
const brandButtons = brandThemes
  .map(
    (n) =>
      `    <button data-set="${n}" aria-pressed="false" title="external brand — packages/tokens/brands/${n}.json">${n}</button>`
  )
  .join("\n");
const catalog = JSON.parse(readFileSync(join(ROOT, "..", "..", "catalog", "catalog.json"), "utf8"));

let displayFace = "";
try {
  const woff2 = readFileSync(
    join(
      ROOT,
      "..",
      "..",
      "node_modules",
      "@fontsource",
      "saira-condensed",
      "files",
      "saira-condensed-latin-800-normal.woff2"
    )
  ).toString("base64");
  displayFace = `@font-face{font-family:"CR Display";font-style:normal;font-weight:800;font-display:swap;src:url(data:font/woff2;base64,${woff2}) format("woff2");}`;
} catch {
  /* fallback stack */
}

/* ── per-component state snippets ─────────────────────────────────────────
 * Each entry: [{ state: "label", html: "<markup/>" }]. Interactive components
 * are shown in their visual states via the shipped cr- classes (the same markup
 * the compiled components emit); the Live Gallery + Qwik example exercise the JS. */
const sig = (seed, st, n) =>
  `<canvas class="crsig" width="${n || 40}" height="${n || 40}" data-seed="${seed}" data-state="${st}"></canvas>`;
const EXAMPLES = {
  "data-list": [
    {
      state: "key → value",
      html: `<dl class="cr-dl"><dt class="cr-dl__k">worker</dt><dd class="cr-dl__v">nova-01</dd><dt class="cr-dl__k">uptime</dt><dd class="cr-dl__v">41h 12m</dd></dl>`,
    },
  ],
  skeleton: [
    {
      state: "loading",
      html: `<div style="display:flex;flex-direction:column;gap:8px;width:220px"><span class="cr-skeleton cr-skeleton--text" style="width:70%"></span><span class="cr-skeleton cr-skeleton--line"></span><span class="cr-skeleton cr-skeleton--line" style="width:85%"></span></div>`,
    },
  ],
  "ascii-detail": [
    {
      state: "labeled rule",
      html: `<div style="width:280px"><p class="cr-sep-label">recent events</p><ul class="cr-list cr-list--tick"><li class="cr-list__item">stream opened</li><li class="cr-list__item">SSE closed</li></ul><div class="cr-leader"><span class="cr-leader__k">uptime</span><span class="cr-leader__fill"></span><span class="cr-leader__v">41h</span></div></div>`,
    },
  ],
  // Four shapes, four fixed meanings (Law 4). A grid rather than one flex row:
  // as a row they overflowed and the card scrolled, and the meanings need labels
  // to read as a vocabulary rather than decoration.
  "diagonal-primitives": [
    {
      state: "chevron · direction",
      html: `<span class="cr-chev" style="font-family:var(--font-mono);font-size:13px">route</span>`,
    },
    {
      state: "notch · state",
      html: `<span class="cr-notch" style="font-family:var(--font-mono);font-size:11px;font-weight:800;text-transform:uppercase">held</span>`,
    },
    {
      state: "wedge · focus",
      html: `<span class="cr-wedge" style="display:inline-block;flex:none;padding:8px 28px 8px 12px;background:var(--panel);border:var(--brd) solid var(--border);font-family:var(--font-mono);font-size:13px">active</span>`,
    },
    {
      state: "arrow-rail · sequence",
      html: `<div class="cr-rail" style="font-family:var(--font-mono);font-size:12px"><span class="cr-rail__step cr-rail__step--on">queue</span><span class="cr-rail__step">run</span><span class="cr-rail__step">verify</span></div>`,
    },
  ],
};

const kbdBadge = (t) => `<span class="badge">${t}</span>`;
// ── prop tables, generated from the compiled React interfaces ─────────────
const REACT_DIR = join(
  ROOT,
  "..",
  "..",
  "packages",
  "components",
  "dist",
  "frameworks",
  "react",
  "components"
);
const COMP_INDEX = {}; // lowercased export name → actual file base (for case/hyphen mismatches)
try {
  for (const f of readdirSync(REACT_DIR))
    if (f.endsWith(".tsx")) COMP_INDEX[f.slice(0, -4).toLowerCase()] = f.slice(0, -4);
} catch {
  /* dist not built yet */
}
// catalog id → component export name where "Cr"+PascalCase(id) doesn't resolve.
const COMP_OVERRIDES = {
  checkbox: "CrChoice",
  "form-field": "CrField",
  "seeded-cat": "CrCat",
  "empty-error-state": "CrEmptyState",
  rail: "CrNav",
};
function resolveComponent(e) {
  if (COMP_OVERRIDES[e.id]) return COMP_OVERRIDES[e.id];
  const cand =
    "Cr" +
    e.id
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("");
  return COMP_INDEX[cand.toLowerCase()] || null;
}
const escT = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function readProps(comp) {
  const path = join(REACT_DIR, comp + ".tsx");
  if (!existsSync(path)) return null;
  const src = readFileSync(path, "utf8");
  const m = src.match(new RegExp("export interface " + comp + "Props \\{([\\s\\S]*?)\\n\\}"));
  if (!m) return null;
  const rows = [];
  let doc = "";
  for (const raw of m[1].split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const jd = line.match(/^\/\*\*\s*(.*?)\s*\*\/$/);
    if (jd) {
      doc = jd[1];
      continue;
    }
    if (line.startsWith("/*") || line.startsWith("*") || line.startsWith("//")) continue;
    const p = line.match(/^(\w+)(\??):\s*(.+?);?\s*$/);
    if (p) {
      rows.push({ prop: p[1], req: p[2] !== "?", type: p[3].replace(/\s+/g, " "), doc });
      doc = "";
    }
  }
  // Deterministic order: required first (callers must supply them), then optional
  // props alphabetically, then the styling-contract trio last — it is boilerplate
  // on every component and repeating it mid-table buries the real API.
  const CONTRACT = { unstyled: 1, pt: 2, dt: 3 };
  rows.sort((a, b) => {
    const ca = CONTRACT[a.prop] || 0;
    const cb = CONTRACT[b.prop] || 0;
    if (ca !== cb) return ca - cb; // contract trio sinks to the bottom
    if (ca) return ca - cb; // and keeps unstyled · pt · dt order
    if (a.req !== b.req) return a.req ? -1 : 1; // required before optional
    return a.prop.localeCompare(b.prop);
  });
  return rows.length ? rows : null;
}
function propsHtml(e) {
  const comp = resolveComponent(e);
  const rows = comp ? readProps(comp) : null;
  if (!rows) return "";
  const body = rows
    .map(
      (r) =>
        `<div class="prow"><code class="prow__n">${r.prop}${r.req ? "" : "?"}</code><code class="prow__t">${escT(r.type)}</code><span class="prow__d">${r.doc ? escT(r.doc) : ""}</span></div>`
    )
    .join("");
  return `<div class="vbox vbox--props"><h4>props · <code>&lt;${comp} /&gt;</code></h4>${body}</div>`;
}
function variantsHtml(e) {
  const keys = Object.keys(e.variants || {});
  if (!keys.length) return "";
  const rows = keys
    .map(
      (k) =>
        `<div class="vrow"><code>${k}</code><span>${(e.variants[k] || []).join(" · ")}</span></div>`
    )
    .join("");
  return `<div class="vbox"><h4>variants</h4>${rows}</div>`;
}
function tokensHtml(e) {
  if (!e.tokens || !e.tokens.length) return "";
  const rows = e.tokens
    .map(
      (t) =>
        `<div class="vrow"><code>${escT(t.cssVar)}</code><span>${escT(t.description || "")}</span></div>`
    )
    .join("");
  return `<div class="vbox"><h4>tokens</h4>${rows}</div>`;
}
// Catalog ids that get a LIVE island — the real compiled React component,
// mounted client-side by build/showcase-islands.jsx. Must match the DEMOS keys
// there (asserted by tests/showcase-islands.spec.mjs). Everything else falls back
// to its static state snippets.
const ISLAND_IDS = new Set([
  "accordion",
  "tabs",
  "menu",
  "combobox",
  "palette",
  "tree",
  "drawer",
  "popover",
  "hover-card",
  "segmented",
  "choice-group",
  "slider",
  "number-field",
  "pagination",
  "datetime",
  "cron-field",
  "modal",
  "switch",
  "select",
  "tooltip",
  "table",
  "toast-region",
  // presentational / form components
  "button",
  "tag",
  "chip",
  "status-dot",
  "kbd",
  "checkbox",
  "alert",
  "toast",
  "progress",
  "input",
  "textarea",
  "form-field",
  "breadcrumb",
  "session-row",
  "empty-error-state",
  "panel",
  "icon",
  // charts
  "sparkline",
  "line-chart",
  "bar-chart",
  "stacked-bar",
  // schema-driven form
  "form",
  // data grid
  "datagrid",
  // new operator / form kit
  "stepper",
  "pin-input",
  "tags-input",
  "input-group",
  "avatar",
  "spinner",
  "scroll-area",
  "resizable",
  // component-coverage batch
  "rating",
  "timeline",
  "toolbar",
  "file-upload",
  "carousel",
  "calendar",
  "hero",
  "masthead",
  "shape",
  "breach",
  "drip",
  "bezel",
  "sigil",
  "chrome",
  "ascii",
  "telemetry",
  "seeded-cat",
  "toggle-chip",
  "overflow",
  "relative-time",
  // CSS-block demos (no single component): the shipped classes composed directly
  "keyed-contact-sheet",
  "decoration-utilities",
  "instrument",
  "rail",
  "key-hints",
]);

// Demos that must not be squeezed below their intrinsic width (see .cell--intrinsic).
const INTRINSIC_IDS = new Set(["diagonal-primitives"]);
// Demos too wide to wrap — they scroll inside their cell instead of the page.
const SCROLL_IDS = new Set(["datagrid", "table", "timeline", "carousel", "calendar"]);

function stageHtml(id) {
  const ex = EXAMPLES[id] || [];
  // Live cell first: the actual shipped component, hydrated. <noscript> keeps a
  // sensible message if JS is off; the static state cells below still render.
  const island = ISLAND_IDS.has(id)
    ? `<div class="cell cell--live${SCROLL_IDS.has(id) ? " cell--scroll" : ""}"><div class="cell__label">playground · editable props</div><div class="cell__demo" data-island="${id}"><span class="cell__pending">mounting…<noscript> (enable JavaScript)</noscript></span></div></div>`
    : "";
  if (!island && !ex.length) {
    return `<div class="stage stage--empty">No isolated example — this composes other components.</div>`;
  }
  const cells = ex
    .map(
      (s) =>
        `<div class="cell${INTRINSIC_IDS.has(id) ? " cell--intrinsic" : ""}"><div class="cell__demo">${s.html}</div><div class="cell__label">${s.state}</div></div>`
    )
    .join("");
  return `<div class="stage">${island}${cells}</div>`;
}

// Bundle the live islands: the REAL compiled React components + a tiny stateful
// wrapper each, inlined so the page stays self-contained (GitHub Pages + file://).
const islandsBundle = esbuild.buildSync({
  entryPoints: [join(ROOT, "build", "showcase-islands.jsx")],
  bundle: true,
  format: "iife",
  loader: { ".ts": "tsx" },
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  minify: true,
  write: false,
}).outputFiles[0].text;

const entries = catalog.entries;
const byCat = {};
for (const e of entries) (byCat[e.category] ??= []).push(e);
// Deliberate reading order (primitives → actions → inputs → nav → surfaces →
// feedback → data-viz → identity), not alphabetical; any unlisted category falls
// to the end alphabetically so a new one still shows up.
const CAT_ORDER = [
  "primitives",
  "action",
  "forms",
  "navigation",
  "overlay",
  "layout",
  "state",
  "media",
  "chart",
  "identity",
  "behavior",
];
const catRank = (c) => {
  const i = CAT_ORDER.indexOf(c);
  return i === -1 ? CAT_ORDER.length : i;
};
const cats = Object.keys(byCat).sort((a, b) => catRank(a) - catRank(b) || a.localeCompare(b));
// entries within a category read alphabetically by name
for (const c of cats) byCat[c].sort((a, b) => a.name.localeCompare(b.name));

// Sidebar filter. Lives here rather than in gallery-scripts.mjs because that
// module is shared with the brand-preview page, which has no component index.
const filterScript = `
(() => {
  const input = document.getElementById("idx-filter");
  if (!input) return;
  const none = document.querySelector(".idx__none");
  const groups = [...document.querySelectorAll(".idx__group")];
  const apply = () => {
    const q = input.value.trim().toLowerCase();
    let hits = 0;
    for (const group of groups) {
      let groupHits = 0;
      for (const link of group.querySelectorAll(".idx__link")) {
        const match = !q || link.textContent.toLowerCase().includes(q);
        link.hidden = !match;
        if (match) groupHits++;
      }
      group.hidden = groupHits === 0;
      hits += groupHits;
    }
    if (none) none.hidden = hits > 0;
  };
  input.addEventListener("input", apply);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { input.value = ""; apply(); }
  });
})();
`;

const indexHtml = cats
  .map(
    (c) =>
      `<div class="idx__group"><div class="idx__cat">${c}<span class="idx__count">${byCat[c].length}</span></div>${byCat[
        c
      ]
        .map((e) => `<a class="idx__link" href="#c-${e.id}">${e.name}</a>`)
        .join("")}</div>`
  )
  .join("");

const cardsHtml = cats
  .map((c) =>
    byCat[c]
      .map(
        (e) => `
  <article class="card" id="c-${e.id}">
    <header class="card__head">
      <h2 class="card__name">${e.name}</h2>
      ${kbdBadge(e.category)}${kbdBadge(e.kind)}${kbdBadge(e.lifecycle)}
    </header>
    <p class="card__desc">${escT(e.description)}</p>
    ${stageHtml(e.id)}
    <div class="card__meta">${propsHtml(e)}${variantsHtml(e)}${tokensHtml(e)}</div>
  </article>`
      )
      .join("")
  )
  .join("");

const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Control Room — Component Browser</title>
<style>
${displayFace}
${tokensCss}
${brandThemeCss}
${componentsCss}
/* browser chrome (not part of the shipped system) */
* { box-sizing: border-box; }
body { margin: 0; }
.top { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  padding: 12px 20px; background: var(--board); border-bottom: var(--brd-heavy) solid var(--border); }
.top h1 { font-family: var(--font-display); font-weight: 900; text-transform: uppercase; font-size: 20px; margin: 0; letter-spacing: -0.02em; }
.top .sub { font-family: var(--font-mono); font-size: 12px; color: var(--muted); }
.top a.home { font-family: var(--font-mono); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
.top a.home:hover { color: var(--sig-accent); }
.top .brand { display: flex; flex-direction: column; gap: 2px; }
.switch { display: flex; gap: 6px; margin-left: auto; flex-wrap: nowrap;
  overflow-x: auto; max-width: min(52vw, 560px); scrollbar-width: thin; padding-bottom: 2px; }
.switch button { flex: none; font-family: var(--font-mono); font-size: 11px; font-weight: 800;
  text-transform: uppercase; letter-spacing: .06em; padding: 5px 10px; background: var(--panel);
  color: var(--muted); border: var(--brd) solid var(--border); cursor: pointer; }
.switch button[aria-pressed="true"] { background: var(--sig-accent); color: var(--on-accent); }
.wrap { display: grid; grid-template-columns: 220px 1fr; gap: 0; align-items: start; }
/* chrome surfaces track the theme — use --board/--ink (not the app's always-dark --rail). */
.idx { position: sticky; top: 61px; align-self: start; height: calc(100vh - 61px);
  display: flex; flex-direction: column; overflow: hidden;
  padding: 16px; border-right: var(--brd) solid var(--border); background: var(--board); }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden;
  clip-path: inset(50%); white-space: nowrap; border: 0; }
/* The index is 83 entries in a sticky column — filtering beats scrolling. */
.idx__filter { display: block; margin-bottom: 12px; flex: none; }
.idx__filter input { width: 100%; box-sizing: border-box; padding: 6px 8px;
  font-family: var(--font-mono); font-size: 12px; color: var(--ink);
  background: var(--panel); border: var(--brd) solid var(--border); border-radius: var(--radius); }
.idx__filter input::placeholder { color: var(--muted); }
.idx__filter input:focus-visible { outline: var(--focus-w, 2px) solid var(--sig-work); outline-offset: 2px; }
.idx__none { font-family: var(--font-mono); font-size: 12px; color: var(--muted); margin: 0 0 12px; flex: none; }
.idx__list { flex: 1 1 auto; overflow-y: auto; min-height: 0; }
.idx__group { margin-bottom: 14px; }
.idx__cat { font-family: var(--font-mono); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); margin-bottom: 4px; display: flex; justify-content: space-between; gap: 8px; }
.idx__count { color: var(--muted); font-weight: 700; }
.idx__link { display: block; font-family: var(--font-mono); font-size: 12px; color: var(--ink); text-decoration: none; padding: 2px 0; }
.idx__link:hover { color: var(--sig-accent); }
main { padding: 20px; display: flex; flex-direction: column; gap: 18px; min-width: 0; }
.card { border: var(--brd) solid var(--border); background: var(--panel); padding: 16px; box-shadow: var(--shadow-off) var(--shadow-off) 0 var(--shadow-col); scroll-margin-top: 72px; }
.card__head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.card__name { font-family: var(--font-display); font-weight: 900; text-transform: uppercase; font-size: 18px; margin: 0; letter-spacing: -0.01em; }
.badge { font-family: var(--font-mono); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); border: var(--brd-hair) solid var(--border); padding: 1px 6px; }
.card__desc { font-family: var(--font-mono); font-size: 13px; color: var(--ink); margin: 8px 0 14px; max-width: 70ch; }
.stage { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; padding: 16px; background: var(--board); border: var(--brd-hair) dashed color-mix(in srgb, var(--border) 45%, transparent); }
.stage--empty { font-family: var(--font-mono); font-size: 12px; color: var(--muted); }
.stage--empty a { color: var(--ink); }
/* min-width:0 let a cell shrink below its demo's intrinsic width, squeezing padded
 * demos (the wedge lost its label to its own clip-path). min-content fixed that but
 * overflowed the page at 375px, so cap the floor: respect intrinsic width until it
 * would exceed the viewport, then allow shrinking. */
.cell { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
/* Demos whose intrinsic width must be respected: a padded shape squeezed below it
 * loses content to its own clip-path (the wedge lost its label). Opt in per demo
 * rather than globally — a wide demo like the data grid must still be allowed to
 * shrink and scroll internally, or it overflows the page at 375px. */
.cell--intrinsic { min-width: min-content; }
/* Wrap before scrolling, and leave room for a focus ring. overflow-x:auto used to
 * be unconditional, which clipped outlines at the container edge and put a
 * scrollbar on demos that would have fitted if allowed to wrap. Wrapping handles
 * those; clipping is NOT used because a genuinely wide demo (the data grid, with
 * ~500px of fixed columns) must still scroll rather than overflow the page. */
.cell__demo { display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
  min-width: 0; max-width: 100%; padding: 3px; }
/* keep fixed-size decorative canvases from forcing horizontal scroll on narrow screens */
.stage canvas { max-width: 100%; height: auto; }
.cell__label { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
/* live playground gets a full row */
.cell--live { flex: 1 1 100%; min-width: 0; order: -1; }
.cell--live > .cell__demo { display: block; }
/* Only demos too wide to wrap get a scroller, so every other demo keeps its focus
 * ring visible. Declared after the .cell--live reset above, or that would win. */
.cell--scroll > .cell__demo { overflow-x: auto; }
/* "playground" marker: label stays ink (AA in every theme); the signal is a
 * decorative CSS dot, so it never trips a text-contrast check. */
.cell--live > .cell__label { color: var(--ink); font-weight: 800; display: flex; align-items: center; gap: 5px; }
.cell--live > .cell__label::before { content: ""; width: 7px; height: 7px; background: var(--sig-done); border: var(--brd-hair) solid var(--border); }
/* ── playground harness (browser chrome, not shipped) ──────────────────── */
.pg { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; }
.pg__live { flex: 1 1 320px; min-width: 260px; }
.pg__panel { flex: 0 1 280px; min-width: 220px; display: flex; flex-direction: column; gap: 10px; }
.pg__controls { display: flex; flex-direction: column; gap: 8px; padding: 12px; background: var(--panel-2); border: var(--brd-hair) solid var(--border); }
.pg__ctl { display: flex; flex-direction: column; gap: 3px; font-family: var(--font-mono); font-size: 11px; color: var(--ink); }
.pg__ctl--bool { flex-direction: row; align-items: center; gap: 7px; }
.pg__ctl-name { text-transform: uppercase; letter-spacing: .05em; font-size: 10px; font-weight: 700; color: var(--muted); }
.pg__ctl input[type="text"], .pg__ctl input[type="number"], .pg__ctl select {
  font-family: var(--font-mono); font-size: 12px; color: var(--ink); background: var(--panel);
  border: var(--brd-hair) solid var(--border); padding: 4px 6px; width: 100%; }
.pg__ctl--bool input { width: 15px; height: 15px; accent-color: var(--sig-work); }
.pg__reset { align-self: flex-start; margin-top: 2px; font-family: var(--font-mono); font-size: 10px;
  font-weight: 800; text-transform: uppercase; letter-spacing: .06em; padding: 4px 9px;
  background: var(--panel); color: var(--ink); border: var(--brd-hair) solid var(--border); cursor: pointer; }
.pg__reset:disabled { opacity: .45; cursor: default; }
.pg__reset:not(:disabled):hover { border-color: var(--sig-accent); color: var(--sig-accent); }
.pg__reset:focus-visible { outline: var(--focus-w, 2px) solid var(--sig-work); outline-offset: 2px; }
.pg__code { font-family: var(--font-mono); font-size: 11px; color: var(--ink); background: var(--board);
  border: var(--brd-hair) solid var(--border); padding: 8px 10px; margin: 0; white-space: pre-wrap; word-break: break-word; }
.pg__note { font-family: var(--font-mono); font-size: 11px; color: var(--muted); margin: 8px 0 0; }
@media (max-width: 720px) { .pg__panel { flex-basis: 100%; } }
.cell__pending { font-family: var(--font-mono); font-size: 11px; color: var(--muted); }
.card__meta { display: flex; gap: 24px; flex-wrap: wrap; margin-top: 14px; }
.vbox h4 { font-family: var(--font-mono); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); margin: 0 0 4px; }
.vbox h4 code { text-transform: none; color: var(--ink); font-weight: 700; }
/* prop tables — generated from the TS interfaces */
.vbox--props { flex: 1 1 100%; }
.prow { display: grid; grid-template-columns: minmax(96px, auto) minmax(130px, 1fr) 2fr; gap: 12px; font-family: var(--font-mono); font-size: 11px; padding: 2px 0; align-items: baseline; border-top: var(--brd-hair) solid color-mix(in srgb, var(--border) 25%, transparent); }
.prow__n { color: var(--sig-accent); font-weight: 700; }
.prow__t { color: var(--ink); overflow-x: auto; }
.prow__d { color: var(--muted); }
@media (max-width: 640px) { .prow { grid-template-columns: 1fr; gap: 1px; } }
.vrow { display: flex; gap: 10px; font-family: var(--font-mono); font-size: 11px; padding: 1px 0; }
.vrow code { color: var(--sig-accent); }
.vrow span { color: var(--muted); }
@media (max-width: 720px) { .wrap { grid-template-columns: 1fr; }
  .idx { position: static; height: auto; overflow: visible; border-right: 0; border-bottom: var(--brd) solid var(--border); }
  .idx__list { overflow: visible; } }
</style>
</head>
<body>
<div class="top">
  <div class="brand">
    <a class="home" href="./">◂ Control Room</a>
    <h1>Component Browser</h1>
  </div>
  <span class="sub">${entries.length} components · exercised in all states</span>
  <div class="switch" role="group" aria-label="Theme">
    <button data-set="dark" aria-pressed="true">dark</button>
    <button data-set="light" aria-pressed="false">light</button>
    <button data-set="extreme" aria-pressed="false">extreme</button>
    <button data-set="phosphor" aria-pressed="false">phosphor</button>
${brandButtons}
  </div>
</div>
<div class="wrap">
  <nav class="idx" aria-label="Components">
    <label class="idx__filter">
      <span class="sr-only">Filter components</span>
      <input type="search" id="idx-filter" placeholder="filter…" autocomplete="off" spellcheck="false" />
    </label>
    <p class="idx__none" hidden role="status">no match</p>
    <div class="idx__list">${indexHtml}</div>
  </nav>
  <main>${cardsHtml}</main>
</div>
<script>${browserScript}</script>
<script>${filterScript}</script>
<script>${islandsBundle}</script>
</body>
</html>
`;

mkdirSync(join(ROOT, "public"), { recursive: true });
writeFileSync(join(ROOT, "public", "components.html"), html);
console.log(`wrote public/components.html  (${entries.length} components, ${html.length} bytes)`);
