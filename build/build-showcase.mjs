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
  join(ROOT, "packages", "tokens", "dist", "control-room.css"),
  "utf8"
);
const componentsCss = readFileSync(
  join(ROOT, "packages", "styles", "styles", "components.css"),
  "utf8"
);
/* External BRANDS (brands/*.json → dist/themes/<name>.css) live outside the
 * built-in bundle. Appending each proves the whole browser reskins to a brand via
 * one appearance file + data-theme, with no component change. See theming.md. */
const BUILTIN_THEMES = new Set(["dark", "light", "extreme", "phosphor"]);
const themesDir = join(ROOT, "packages", "tokens", "dist", "themes");
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
      `    <button data-set="${n}" aria-pressed="false" title="external brand — brands/${n}.json">${n} ▸</button>`
  )
  .join("\n");
const catalog = JSON.parse(readFileSync(join(ROOT, "catalog", "catalog.json"), "utf8"));

let displayFace = "";
try {
  const woff2 = readFileSync(
    join(
      ROOT,
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
  button: [
    { state: "primary", html: `<button class="cr-btn">run scan</button>` },
    { state: "work", html: `<button class="cr-btn cr-btn--sig-work">deploy</button>` },
    { state: "accent", html: `<button class="cr-btn cr-btn--sig-accent">commit</button>` },
    { state: "err", html: `<button class="cr-btn cr-btn--sig-err">kill</button>` },
    {
      state: "outline · sm",
      html: `<button class="cr-btn cr-btn--outline cr-btn--sm">controls</button>`,
    },
    { state: "disabled", html: `<button class="cr-btn" disabled>run scan</button>` },
  ],
  chip: [
    { state: "default (done)", html: `<span class="cr-chip">PTL-757</span>` },
    { state: "alt (work)", html: `<span class="cr-chip cr-chip--alt">ui-kit</span>` },
  ],
  tag: [
    { state: "done", html: `<span class="cr-tag cr-tag--done">shipped</span>` },
    { state: "work", html: `<span class="cr-tag cr-tag--work">running</span>` },
    { state: "wait", html: `<span class="cr-tag cr-tag--wait">waiting</span>` },
    { state: "err", html: `<span class="cr-tag cr-tag--err">failed</span>` },
    { state: "idle", html: `<span class="cr-tag cr-tag--idle">parked</span>` },
    { state: "accent", html: `<span class="cr-tag cr-tag--accent">pinned</span>` },
  ],
  "status-dot": [
    {
      state: "work",
      html: `<span class="cr-dot" style="background:var(--sig-work)" role="img" aria-label="working"></span>`,
    },
    {
      state: "wait",
      html: `<span class="cr-dot" style="background:var(--sig-wait)" role="img" aria-label="waiting"></span>`,
    },
    {
      state: "err",
      html: `<span class="cr-dot" style="background:var(--sig-err)" role="img" aria-label="error"></span>`,
    },
    {
      state: "done",
      html: `<span class="cr-dot" style="background:var(--sig-done)" role="img" aria-label="done"></span>`,
    },
  ],
  shape: [
    {
      state: "crit (▲)",
      html: `<span class="cr-sev cr-sev--crit" role="img" aria-label="critical"></span>`,
    },
    {
      state: "warn (◆)",
      html: `<span class="cr-sev cr-sev--warn" role="img" aria-label="warn"></span>`,
    },
    {
      state: "work (⬠)",
      html: `<span class="cr-sev cr-sev--work" role="img" aria-label="work"></span>`,
    },
    { state: "ok (⬡)", html: `<span class="cr-sev cr-sev--ok" role="img" aria-label="ok"></span>` },
    {
      state: "idle (●)",
      html: `<span class="cr-sev cr-sev--idle" role="img" aria-label="idle"></span>`,
    },
  ],
  panel: [
    {
      state: "panel",
      html: `<div class="cr-panel" style="padding:12px;min-width:160px">panel surface</div>`,
    },
    {
      state: "major",
      html: `<div class="cr-panel cr-panel--major" style="padding:12px;min-width:160px">major panel</div>`,
    },
    {
      state: "inset",
      html: `<div class="cr-panel cr-panel--inset" style="padding:12px;min-width:160px">recessed</div>`,
    },
  ],
  hero: [
    {
      state: "wait",
      html: `<div class="cr-hero cr-hero--wait"><div><div class="cr-hero__big">2 need you</div><div class="cr-hero__sub">awaiting input</div></div></div>`,
    },
    {
      state: "err",
      html: `<div class="cr-hero cr-hero--err"><div><div class="cr-hero__big">1 failing</div><div class="cr-hero__sub">SSE closed</div></div></div>`,
    },
    {
      state: "calm",
      html: `<div class="cr-hero cr-hero--calm"><div><div class="cr-hero__big">all nominal</div><div class="cr-hero__sub">14 sessions</div></div></div>`,
    },
  ],
  masthead: [
    {
      state: "with marks",
      html: `<header class="cr-masthead cr-mark"><p class="cr-masthead__eyebrow">DP Control Room</p><h1 class="cr-masthead__title">14 sessions</h1></header>`,
    },
  ],
  tabs: [
    {
      state: "tablist",
      html: `<div class="cr-tabs" role="tablist"><button role="tab" class="cr-tab cr-tab--on" aria-selected="true">queue</button><button role="tab" class="cr-tab" aria-selected="false">workers</button><button role="tab" class="cr-tab" aria-selected="false">history</button></div>`,
    },
  ],
  meter: [
    {
      state: "work 72%",
      html: `<div class="cr-meter cr-meter--work" style="width:240px"><span class="cr-meter__label">cpu</span><span class="cr-meter__track"><span class="cr-meter__fill" style="width:72%"></span></span></div>`,
    },
    {
      state: "wait 40%",
      html: `<div class="cr-meter cr-meter--wait" style="width:240px"><span class="cr-meter__label">queue</span><span class="cr-meter__track"><span class="cr-meter__fill" style="width:40%"></span></span></div>`,
    },
    {
      state: "err 12%",
      html: `<div class="cr-meter cr-meter--err" style="width:240px"><span class="cr-meter__label">errors</span><span class="cr-meter__track"><span class="cr-meter__fill" style="width:12%"></span></span></div>`,
    },
  ],
  progress: [
    {
      state: "determinate 64%",
      html: `<div class="cr-progress" style="width:240px" role="progressbar" aria-valuenow="64" aria-valuemin="0" aria-valuemax="100" aria-label="indexing"><span class="cr-progress__fill" style="width:64%"></span></div>`,
    },
    {
      state: "indeterminate",
      html: `<div class="cr-progress cr-progress--indeterminate cr-progress--wait" style="width:240px" role="progressbar" aria-label="syncing"><span class="cr-progress__fill"></span></div>`,
    },
  ],
  alert: [
    {
      state: "wait",
      html: `<div class="cr-alert cr-alert--wait" role="status" style="max-width:360px"><span class="cr-alert__icon"></span><div class="cr-alert__body"><p class="cr-alert__title">maintenance</p><p class="cr-alert__msg">workers restart at 02:00 UTC.</p></div></div>`,
    },
    {
      state: "err · dismissible",
      html: `<div class="cr-alert cr-alert--err" role="alert" style="max-width:360px"><span class="cr-alert__icon"></span><div class="cr-alert__body"><p class="cr-alert__title">endpoint unreachable</p><p class="cr-alert__msg">SSE closed.</p></div><button class="cr-alert__close" aria-label="Dismiss">✕</button></div>`,
    },
  ],
  "radio-group": [
    {
      state: "row",
      html: `<div class="cr-radiogroup cr-radiogroup--row" role="radiogroup" aria-label="density"><button role="radio" class="cr-radio" aria-checked="false" tabindex="-1"><span class="cr-radio__box"></span>cozy</button><button role="radio" class="cr-radio" aria-checked="true" tabindex="0"><span class="cr-radio__box"></span>compact</button></div>`,
    },
  ],
  slider: [
    {
      state: "range",
      html: `<input type="range" class="cr-slider" value="64" min="0" max="100" aria-label="threshold" style="max-width:240px" />`,
    },
  ],
  segmented: [
    {
      state: "single-select",
      html: `<div class="cr-segmented" role="radiogroup" aria-label="scope"><button role="radio" class="cr-segmented__opt" aria-checked="true" tabindex="0">all</button><button role="radio" class="cr-segmented__opt" aria-checked="false" tabindex="-1">mine</button><button role="radio" class="cr-segmented__opt" aria-checked="false" tabindex="-1">failing</button></div>`,
    },
  ],
  "number-field": [
    {
      state: "steppers",
      html: `<div class="cr-numberfield"><button class="cr-numberfield__btn" aria-label="Decrease">−</button><input type="number" class="cr-numberfield__input" value="6" aria-label="max retries" /><button class="cr-numberfield__btn" aria-label="Increase">+</button></div>`,
    },
  ],
  breadcrumb: [
    {
      state: "trail",
      html: `<nav aria-label="Breadcrumb"><ol class="cr-breadcrumb"><li class="cr-breadcrumb__item"><a class="cr-breadcrumb__link" href="#">control room</a></li><li class="cr-breadcrumb__item"><a class="cr-breadcrumb__link" href="#">sessions</a></li><li class="cr-breadcrumb__item" aria-current="page">cr-1130</li></ol></nav>`,
    },
  ],
  pagination: [
    {
      state: "windowed",
      html: `<nav class="cr-pager" aria-label="Pagination"><button class="cr-pager__btn" aria-label="prev">‹</button><button class="cr-pager__btn">1</button><button class="cr-pager__btn cr-pager__btn--on" aria-current="page">2</button><button class="cr-pager__btn">3</button><span class="cr-pager__ellipsis">…</span><button class="cr-pager__btn">9</button><button class="cr-pager__btn" aria-label="next">›</button></nav>`,
    },
  ],
  table: [
    {
      state: "sortable · selectable",
      html: `<table class="cr-table"><thead><tr><th class="cr-table__sel"></th><th><button class="cr-table__sortable" type="button">job<span class="cr-table__ind">▲</span></button></th><th>worker</th><th>state</th></tr></thead><tbody><tr aria-selected="true"><td class="cr-table__sel"><input type="checkbox" class="cr-check" checked aria-label="select"/></td><td>cr-1130</td><td>nova-01</td><td>failing</td></tr><tr aria-selected="false"><td class="cr-table__sel"><input type="checkbox" class="cr-check" aria-label="select"/></td><td>ptl-757</td><td>ail-chat</td><td>waiting</td></tr></tbody></table>`,
    },
  ],
  kbd: [
    {
      state: "keycap",
      html: `<button class="cr-btn cr-btn--outline cr-btn--sm">save <kbd class="cr-kbd">⌘S</kbd></button>`,
    },
    {
      state: "on fill",
      html: `<button class="cr-btn cr-btn--sig-err">incident <kbd class="cr-kbd cr-kbd--on">I</kbd></button>`,
    },
  ],
  breach: [
    {
      state: "err · alive",
      html: `<div class="cr-breach cr-breach--err cr-breach--alive" style="padding:16px;max-width:360px"><div style="position:relative;z-index:1"><strong style="font-family:var(--font-display);text-transform:uppercase">build failing</strong><p style="font-family:var(--font-mono);font-size:12px;margin:6px 0 0">SSE closed · retry 3/5</p></div></div>`,
    },
  ],
  drip: [
    {
      state: "error surface",
      html: `<div class="cr-drip" style="max-width:340px"><div class="cr-drip__title">connection lost</div><div class="cr-drip__sub">SSE closed · retry 3/5</div></div>`,
    },
  ],
  sigil: [
    { state: "working", html: sig("nova-01", "working", 52) },
    { state: "waiting", html: sig("ptl-757", "waiting", 52) },
    { state: "error", html: sig("cr-1130", "error", 52) },
    { state: "done", html: sig("rp-verify", "done", 52) },
    { state: "idle", html: sig("ail-chat", "idle", 52) },
  ],
  chrome: [
    {
      state: "seeded strips",
      html: `<div style="display:flex;flex-direction:column;gap:6px;min-width:320px"><canvas class="crchrome" width="380" height="24" data-seed="cr-00"></canvas><canvas class="crchrome" width="380" height="24" data-seed="nova-rack"></canvas></div>`,
    },
  ],
  ascii: [
    {
      state: "braille field",
      html: `<div class="cr-ascii cr-ascii--mask-edge" style="position:relative;width:240px;height:110px"><canvas class="crascii" width="240" height="110" data-seed="nova" data-variant="braille"></canvas></div>`,
    },
  ],
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
  accordion: [
    {
      state: "one open",
      html: `<div class="cr-accordion" style="min-width:280px"><div class="cr-accordion__item"><button class="cr-accordion__header" aria-expanded="true"><span>stack trace</span><span class="cr-accordion__chevron"></span></button><div class="cr-accordion__panel" role="region">SSEError: stream closed</div></div><div class="cr-accordion__item"><button class="cr-accordion__header" aria-expanded="false"><span>config</span><span class="cr-accordion__chevron"></span></button></div></div>`,
    },
  ],
  switch: [
    {
      state: "off",
      html: `<button class="cr-switch" role="switch" aria-checked="false"><span class="cr-switch__track"></span>live</button>`,
    },
    {
      state: "on",
      html: `<button class="cr-switch" role="switch" aria-checked="true"><span class="cr-switch__track"></span>live</button>`,
    },
  ],
  checkbox: [
    {
      state: "unchecked",
      html: `<label style="display:inline-flex;gap:8px;align-items:center;font-family:var(--font-mono);font-size:13px"><input type="checkbox" class="cr-check" aria-label="select"/> failing</label>`,
    },
    {
      state: "checked",
      html: `<label style="display:inline-flex;gap:8px;align-items:center;font-family:var(--font-mono);font-size:13px"><input type="checkbox" class="cr-check" checked aria-label="select"/> waiting</label>`,
    },
  ],
  input: [
    {
      state: "text",
      html: `<input class="cr-input" placeholder="nova-01" aria-label="session name" />`,
    },
  ],
  textarea: [
    {
      state: "multi-line",
      html: `<textarea class="cr-textarea" rows="2" aria-label="notes">stream stalled at turn 42</textarea>`,
    },
  ],
  select: [
    {
      state: "native",
      html: `<select class="cr-input" aria-label="region"><option>eu-west-1</option><option>us-east-1</option></select>`,
    },
  ],
  "form-field": [
    {
      state: "with hint",
      html: `<div class="cr-field" style="min-width:220px"><label class="cr-field__label" for="sx-1">Session name</label><input id="sx-1" class="cr-input" placeholder="nova-01" /><span class="cr-field__hint">lowercase, no spaces</span></div>`,
    },
    {
      state: "error",
      html: `<div class="cr-field cr-field--error" style="min-width:220px"><label class="cr-field__label" for="sx-2">Endpoint</label><input id="sx-2" class="cr-input" value="bad url" /><span class="cr-field__hint">must be a valid URL</span></div>`,
    },
  ],
  tooltip: [
    {
      state: "hover / focus",
      html: `<span class="cr-tooltip"><span class="cr-tooltip__trigger" tabindex="0">SLA</span><span class="cr-tooltip__bubble" role="tooltip">99.9% monthly uptime</span></span>`,
    },
  ],
  toast: [
    {
      state: "done",
      html: `<div class="cr-toast cr-toast--done" role="status"><span class="cr-toast__msg">queue drained</span><button class="cr-toast__close" aria-label="Dismiss">✕</button></div>`,
    },
    {
      state: "err",
      html: `<div class="cr-toast cr-toast--err" role="alert"><span class="cr-toast__msg">endpoint unreachable</span><button class="cr-toast__close" aria-label="Dismiss">✕</button></div>`,
    },
  ],
  "toast-region": [
    {
      state: "stacked (br)",
      html: `<div style="display:flex;flex-direction:column;gap:8px;max-width:320px"><div class="cr-toast cr-toast--done" role="status"><span class="cr-toast__msg">queue drained</span><button class="cr-toast__close" aria-label="Dismiss">✕</button></div><div class="cr-toast cr-toast--err" role="alert"><span class="cr-toast__msg">killed all workers</span><button class="cr-toast__close" aria-label="Dismiss">✕</button></div></div>`,
    },
  ],
  menu: [
    {
      state: "open panel",
      html: `<div class="cr-menu" style="position:relative;min-height:130px"><button class="cr-btn cr-btn--outline cr-btn--sm" aria-haspopup="menu" aria-expanded="true">actions ▾</button><div class="cr-menu__panel" role="menu"><button role="menuitem" class="cr-menu__item">pause all</button><button role="menuitem" class="cr-menu__item">restart failed</button><div class="cr-menu__sep"></div><button role="menuitem" class="cr-menu__item cr-menu__item--danger">kill all</button></div></div>`,
    },
  ],
  combobox: [
    {
      state: "filtering",
      html: `<div class="cr-combobox" style="min-width:220px;min-height:150px"><input class="cr-combobox__input" value="nova" role="combobox" aria-expanded="true" aria-controls="sx-cb" aria-label="worker" /><ul class="cr-combobox__list" id="sx-cb" role="listbox"><li class="cr-combobox__opt" role="option" aria-selected="false">nova-01</li><li class="cr-combobox__opt cr-combobox__opt--active" role="option" aria-selected="true">nova-02</li></ul></div>`,
    },
  ],
  "cron-field": [
    {
      state: "with readout",
      html: `<div class="cr-cron" style="max-width:280px"><input class="cr-cron__input" value="0 9 * * 1-5" aria-label="cron" /><div class="cr-cron__presets"><button class="cr-cron__preset">hourly</button><button class="cr-cron__preset">nightly 2am</button></div><p class="cr-cron__out">At 09:00 AM, Monday through Friday</p></div>`,
    },
  ],
  datetime: [
    {
      state: "datetime-local",
      html: `<input type="datetime-local" class="cr-datetime" value="2026-08-04T02:00" aria-label="first run" />`,
    },
  ],
  "hover-card": [
    {
      state: "card",
      html: `<span class="cr-hovercard"><span class="cr-hovercard__trigger" tabindex="0">health</span><span class="cr-hovercard__panel" role="group" aria-label="health" style="opacity:1;visibility:visible;position:static;margin-top:8px"><dl class="cr-dl"><dt class="cr-dl__k">workers</dt><dd class="cr-dl__v">4 online</dd><dt class="cr-dl__k">error rate</dt><dd class="cr-dl__v">1.2%</dd></dl></span></span>`,
    },
  ],
  tree: [
    {
      state: "fleet",
      html: `<ul class="cr-tree" role="tree" aria-label="fleet" style="min-width:220px"><li class="cr-tree__item" role="treeitem" aria-level="1" aria-expanded="true" tabindex="0" style="padding-left:calc(0 * var(--space-4) + var(--space-2))"><span class="cr-tree__twist"></span><span>nova (pool)</span></li><li class="cr-tree__item" role="treeitem" aria-level="2" tabindex="-1" style="padding-left:calc(1 * var(--space-4) + var(--space-2))"><span class="cr-tree__lead">·</span><span>nova-01 · streaming</span></li><li class="cr-tree__item" role="treeitem" aria-level="2" aria-selected="true" tabindex="-1" style="padding-left:calc(1 * var(--space-4) + var(--space-2))"><span class="cr-tree__lead">·</span><span>nova-02 · idle</span></li><li class="cr-tree__item" role="treeitem" aria-level="1" aria-expanded="false" tabindex="-1" style="padding-left:calc(0 * var(--space-4) + var(--space-2))"><span class="cr-tree__twist"></span><span>ail (pool)</span></li></ul>`,
    },
  ],
  "diagonal-primitives": [
    {
      state: "chev · notch · wedge",
      html: `<div style="display:flex;gap:16px;align-items:center"><span class="cr-chev" style="font-family:var(--font-mono);font-size:13px">route</span><span class="cr-notch" style="font-family:var(--font-mono);font-size:11px;font-weight:800;text-transform:uppercase">held</span><span class="cr-wedge cr-panel" style="padding:8px 20px 8px 12px;font-family:var(--font-mono);font-size:13px">active</span></div>`,
    },
  ],
  "session-row": [
    {
      state: "row",
      html: `<div style="min-width:280px"><div class="cr-row"><span class="cr-sev cr-sev--work" role="img" aria-label="working"></span>${sig("ptl-757", "working", 20)}<span class="cr-row__name">PTL-757 chat-turn</span><span class="cr-row__status">streaming</span></div><div class="cr-row"><span class="cr-sev cr-sev--crit" role="img" aria-label="critical"></span>${sig("cr-1130", "error", 20)}<span class="cr-row__name">CR-1130 build</span><span class="cr-row__status">failing</span></div></div>`,
    },
  ],
  bezel: [
    {
      state: "instrument screen",
      html: `<div class="cr-bezel" style="max-width:280px"><div class="cr-bezel__rivets"><i></i><i></i></div><div class="cr-bezel__screen">SYS 0x7F · 41ms<br/>throughput 128/min</div></div>`,
    },
  ],
  telemetry: [
    {
      state: "seeded string",
      html: `<span class="cr-telemetry">SYS 0x7F · 41ms · ▁▂▃▅▇▅▃▂</span>`,
    },
  ],
  "empty-error-state": [
    {
      state: "empty (calm)",
      html: `<div class="cr-panel" style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:13px;color:var(--muted);min-width:220px">no sessions in queue</div>`,
    },
    {
      state: "error",
      html: `<div class="cr-drip" style="max-width:260px"><div class="cr-drip__title">load failed</div><div class="cr-drip__sub">could not reach scheduler</div></div>`,
    },
  ],
};

const kbdBadge = (t) => `<span class="badge">${t}</span>`;
// ── prop tables, generated from the compiled React interfaces ─────────────
const REACT_DIR = join(ROOT, "dist", "frameworks", "react", "components");
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
  "radio-group",
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
  "meter",
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
]);

function stageHtml(id) {
  const ex = EXAMPLES[id] || [];
  // Live cell first: the actual shipped component, hydrated. <noscript> keeps a
  // sensible message if JS is off; the static state cells below still render.
  const island = ISLAND_IDS.has(id)
    ? `<div class="cell cell--live"><div class="cell__label">playground · editable props</div><div class="cell__demo" data-island="${id}"><span class="cell__pending">mounting…<noscript> (enable JavaScript)</noscript></span></div></div>`
    : "";
  if (!island && !ex.length) {
    return `<div class="stage stage--empty">Composed in the <a href="./gallery.html">Live Gallery</a> and the <code>examples/console</code> app.</div>`;
  }
  const cells = ex
    .map(
      (s) =>
        `<div class="cell"><div class="cell__demo">${s.html}</div><div class="cell__label">${s.state}</div></div>`
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
.switch { display: flex; gap: 6px; margin-left: auto; flex-wrap: wrap; }
.switch button { font-family: var(--font-mono); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em;
  padding: 5px 10px; background: var(--panel); color: var(--muted); border: var(--brd) solid var(--border); cursor: pointer; }
.switch button[aria-pressed="true"] { background: var(--sig-accent); color: var(--on-accent); }
.top a.gallery { font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: var(--ink); text-decoration: none; border-bottom: 2px dotted var(--muted); }
.wrap { display: grid; grid-template-columns: 220px 1fr; gap: 0; align-items: start; }
/* chrome surfaces track the theme — use --board/--ink (not the app's always-dark --rail). */
.idx { position: sticky; top: 61px; align-self: start; max-height: calc(100vh - 61px); overflow: auto;
  padding: 16px; border-right: var(--brd) solid var(--border); background: var(--board); }
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
.cell { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.cell__demo { display: flex; align-items: center; gap: 8px; min-width: 0; max-width: 100%; overflow-x: auto; }
/* keep fixed-size decorative canvases from forcing horizontal scroll on narrow screens */
.stage canvas { max-width: 100%; height: auto; }
.cell__label { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
/* live playground gets a full row */
.cell--live { flex: 1 1 100%; min-width: 0; order: -1; }
.cell--live > .cell__demo { display: block; }
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
@media (max-width: 720px) { .wrap { grid-template-columns: 1fr; } .idx { position: static; max-height: none; border-right: 0; border-bottom: var(--brd) solid var(--border); } }
</style>
</head>
<body>
<div class="top">
  <div class="brand">
    <a class="home" href="./">◂ Control Room</a>
    <h1>Component Browser</h1>
  </div>
  <span class="sub">${entries.length} components · exercised in all states</span>
  <a class="gallery" href="./gallery.html">Live Gallery ↗</a>
  <div class="switch" role="group" aria-label="Theme">
    <button data-set="dark" aria-pressed="true">dark</button>
    <button data-set="light" aria-pressed="false">light</button>
    <button data-set="extreme" aria-pressed="false">extreme</button>
    <button data-set="phosphor" aria-pressed="false">phosphor</button>
${brandButtons}
  </div>
</div>
<div class="wrap">
  <nav class="idx" aria-label="Components">${indexHtml}</nav>
  <main>${cardsHtml}</main>
</div>
<script>${browserScript}</script>
<script>${islandsBundle}</script>
</body>
</html>
`;

mkdirSync(join(ROOT, "public"), { recursive: true });
writeFileSync(join(ROOT, "public", "components.html"), html);
console.log(`wrote public/components.html  (${entries.length} components, ${html.length} bytes)`);
