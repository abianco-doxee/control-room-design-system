#!/usr/bin/env node
/**
 * Build the living gallery — a self-contained page that inlines the generated
 * tokens AND the shipped component layer (styles/components.css), then demoes
 * them live across all four themes. It doubles as the visual quality gate
 * (see checklists/component-checklist.md) and consumes the SAME CSS a real
 * consumer would — no separate demo styles to drift.
 *
 * Output: public/gallery.html   (served by the site at /gallery.html)
 * Depends on: dist/control-room.css, dist/tokens.flat.json, styles/components.css
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const tokensCss = readFileSync(join(ROOT, "dist", "control-room.css"), "utf8");
const componentsCss = readFileSync(join(ROOT, "styles", "components.css"), "utf8");
const flat = JSON.parse(readFileSync(join(ROOT, "dist", "tokens.flat.json"), "utf8"));
const dark = flat.themes.dark;

const THEMES = ["dark", "light", "extreme", "phosphor"];

const GROUPS = [
  ["Surface", ["--ground", "--board", "--panel", "--panel-2", "--rail"]],
  ["Text", ["--ink", "--muted", "--rail-ink", "--on-sig"]],
  ["Line & mass", ["--border", "--mass", "--shadow-col"]],
  ["Signal (state)", ["--sig-work", "--sig-wait", "--sig-done", "--sig-err", "--sig-idle", "--sig-accent"]],
  ["Keyed & decay", ["--stage", "--stage-ink", "--drip"]],
];

const swatch = (v) => `
  <div class="sw">
    <div class="chipcolor" style="background:var(${v})"></div>
    <code>${v}</code><span class="hex">${dark[v] || ""}</span>
  </div>`;

const swatchGroups = GROUPS.map(
  ([h, vars]) => `
  <h3>${h}</h3>
  <div class="swgrid">${vars.map(swatch).join("")}</div>`,
).join("");

const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Control Room — Living Gallery</title>
<style>
${tokensCss}

/* the shipped component layer — exactly what a consumer imports */
${componentsCss}

/* gallery chrome only (not part of the system) */
.wrap{max-width:1040px;margin:0 auto;padding:28px 20px 100px;}
.bar{position:sticky;top:0;z-index:10;display:flex;flex-wrap:wrap;gap:12px;align-items:center;
  background:var(--ground);padding:14px 0;border-bottom:var(--brd) solid var(--border);margin-bottom:8px;}
.bar h1{font-weight:900;font-size:clamp(20px,3vw,30px);text-transform:uppercase;letter-spacing:-.038em;
  line-height:.9;margin:0;flex:1;}
.switch{display:inline-flex;border:var(--brd-heavy) solid var(--border);
  box-shadow:var(--shadow-off) var(--shadow-off) 0 var(--shadow-col);}
.switch button{font-family:var(--font-mono);font-weight:800;font-size:11px;text-transform:uppercase;
  letter-spacing:.06em;padding:8px 12px;border:none;cursor:pointer;background:var(--panel);
  color:var(--muted);border-right:var(--brd) solid var(--border);}
.switch button:last-child{border-right:none;}
.switch button[aria-pressed="true"]{background:var(--sig-accent);color:var(--on-sig);}
h2{font-family:var(--font-mono);font-size:12px;font-weight:800;text-transform:uppercase;
  letter-spacing:.1em;color:var(--muted);margin:44px 0 14px;border-left:5px solid var(--sig-work);padding-left:10px;}
h3{font-family:var(--font-mono);font-size:11px;text-transform:uppercase;letter-spacing:.07em;
  color:var(--muted);margin:20px 0 8px;}
.swgrid{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));}
.sw{display:flex;align-items:center;gap:9px;background:var(--panel);border:var(--brd) solid var(--border);padding:7px;}
.chipcolor{width:30px;height:30px;border:1.5px solid var(--border);flex-shrink:0;}
.sw code{font-family:var(--font-mono);font-size:11px;color:var(--ink);}
.sw .hex{margin-left:auto;font-family:var(--font-mono);font-size:10px;color:var(--muted);}
.demogrid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));}
.specimen .disp{font-weight:900;font-size:clamp(28px,5vw,48px);text-transform:uppercase;
  letter-spacing:-.038em;line-height:.9;}
.specimen .data{font-family:var(--font-mono);font-size:13px;color:var(--muted);margin-top:10px;
  text-transform:uppercase;letter-spacing:.07em;}
.note{font-family:var(--font-mono);font-size:11px;color:var(--muted);margin:0 0 18px;}
a.back{font-family:var(--font-mono);font-size:11px;color:var(--sig-work);text-decoration:none;}
</style>
</head>
<body>
<div class="wrap">
  <div class="bar">
    <h1>Control Room · Living Gallery</h1>
    <div class="switch" role="group" aria-label="Theme">
      ${THEMES.map((t, i) => `<button type="button" data-set="${t}" aria-pressed="${i === 0}">${t}</button>`).join("\n      ")}
    </div>
  </div>
  <p class="note">Everything below is built from the generated token layer + the shipped <code>styles/components.css</code>. Flip the theme — nothing has per-theme code. <a class="back" href="./">◂ docs</a></p>

  <h2>01 · Color tokens</h2>
  ${swatchGroups}

  <h2>02 · Typography — two registers, nothing between</h2>
  <div class="specimen">
    <div class="disp">14 sessions<br>2 need you</div>
    <div class="data">rev 2.6 // unit/cr-01 // up 4h12m // ◍ sync</div>
  </div>

  <h2>03 · Components</h2>
  <div class="demogrid">
    <div>
      <h3>Panel · SessionRow · StatusDot</h3>
      <section class="cr-panel"><h4 class="cr-panel__title">Sessions</h4>
        <div class="cr-row"><span class="cr-dot" style="background:var(--sig-work)"></span><span class="cr-row__name">PTL-757 chat-turn</span><span class="cr-row__status">streaming</span></div>
        <div class="cr-row"><span class="cr-dot" style="background:var(--sig-wait)"></span><span class="cr-row__name">CR-1130 picker</span><span class="cr-row__status">needs input</span></div>
        <div class="cr-row"><span class="cr-dot" style="background:var(--sig-err)"></span><span class="cr-row__name">rp verify</span><span class="cr-row__status">2 failing</span></div>
      </section>
    </div>
    <div>
      <h3>Hero (keyed focal)</h3>
      <div class="cr-hero cr-hero--wait"><div><div class="cr-hero__big">nova needs you</div><div class="cr-hero__sub">CR-1130 · paused · 6m</div></div></div>
      <h3 style="margin-top:16px">Button · Chip · Tag</h3>
      <button class="cr-btn" type="button">RUN SCAN</button>
      <div style="margin-top:10px;display:flex;gap:7px;flex-wrap:wrap;align-items:center">
        <span class="cr-chip">PTL-757</span><span class="cr-chip cr-chip--alt">ui-kit</span>
        <span class="cr-tag cr-tag--now">shipped</span><span class="cr-tag cr-tag--no">ruled out</span>
      </div>
    </div>
    <div>
      <h3>Bezel (texture lives here only)</h3>
      <div class="cr-bezel"><div class="cr-bezel__rivets" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <div class="cr-bezel__screen">&gt; scan complete · 14 sessions · 2 flagged</div></div>
      <h3 style="margin-top:16px">Arrow-rail (sequence)</h3>
      <div class="cr-rail"><span class="cr-rail__step cr-rail__step--on">scan</span><span class="cr-rail__step">triage</span><span class="cr-rail__step">fix</span><span class="cr-rail__step">verify</span></div>
    </div>
    <div>
      <h3>Error surface (drip)</h3>
      <div class="cr-drip"><div class="cr-drip__title">connection lost</div><div class="cr-drip__sub">ai-global-chat · SSE closed · retry 3/5</div></div>
    </div>
    <div style="grid-column:1/-1">
      <h3>Masthead</h3>
      <header class="cr-masthead"><p class="cr-masthead__eyebrow">DP Control Room · Phase 0</p><h1 class="cr-masthead__title">14 sessions<br>2 need you</h1></header>
    </div>
    <div>
      <h3>Nav rail</h3>
      <nav class="cr-nav" style="width:auto">
        <div class="cr-nav__brand">CONTROL<br>ROOM</div>
        <ul class="cr-nav__list">
          <li><a class="cr-nav__item cr-nav__item--active" href="#">◈ Attention <span class="cr-nav__badge">1</span></a></li>
          <li><a class="cr-nav__item" href="#">◧ Sessions</a></li>
          <li><a class="cr-nav__item" href="#">▦ Sprint</a></li>
        </ul>
      </nav>
    </div>
    <div>
      <h3>Keyed contact sheet</h3>
      <div class="cr-tiles">
        <div class="cr-tile cr-tile--work">nova</div><div class="cr-tile cr-tile--wait">atlas</div>
        <div class="cr-tile cr-tile--done">echo</div><div class="cr-tile cr-tile--err">rhea</div>
        <div class="cr-tile cr-tile--idle">kite</div><div class="cr-tile cr-tile--stage">calm</div>
      </div>
    </div>
    <div style="grid-column:1/-1">
      <h3>Table</h3>
      <table class="cr-table">
        <thead><tr><th>Session</th><th>Task</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>nova</td><td>PTL-757 chat-turn</td><td>streaming</td></tr>
          <tr><td>rhea</td><td>rp verify</td><td>2 failing</td></tr>
        </tbody>
      </table>
    </div>
    <div style="grid-column:1/-1">
      <h3>Form controls</h3>
      <div style="display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(190px,1fr))">
        <div class="cr-field">
          <label class="cr-field__label" for="g-in">Session name</label>
          <input id="g-in" class="cr-input" placeholder="nova-01" />
          <span class="cr-field__hint">lowercase, no spaces</span>
        </div>
        <div class="cr-field cr-field--error">
          <label class="cr-field__label" for="g-in2">Endpoint</label>
          <input id="g-in2" class="cr-input" value="bad url" aria-invalid="true" />
          <span class="cr-field__error">must be a valid URL</span>
        </div>
        <div class="cr-field">
          <label class="cr-field__label" for="g-sel">Theme</label>
          <select id="g-sel" class="cr-select"><option>dark</option><option>light</option><option>extreme</option><option>phosphor</option></select>
        </div>
        <div class="cr-field">
          <label class="cr-field__label" for="g-ta">Notes</label>
          <textarea id="g-ta" class="cr-textarea" placeholder="scan notes…"></textarea>
        </div>
      </div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:12px;align-items:center">
        <label class="cr-check"><input type="checkbox" checked /> Auto-scan</label>
        <label class="cr-check"><input type="radio" name="g-r" checked /> Cyan</label>
        <label class="cr-check"><input type="radio" name="g-r" /> Magenta</label>
        <button type="button" role="switch" aria-checked="true" class="cr-switch"><span class="cr-switch__track" aria-hidden="true"></span> Live</button>
      </div>
    </div>
    <div style="grid-column:1/-1">
      <h3>Instrument shell (rail + masthead + panels)</h3>
      <div class="cr-instrument">
        <nav class="cr-nav" style="width:150px" aria-label="Primary">
          <div class="cr-nav__brand">CONTROL<br>ROOM</div>
          <ul class="cr-nav__list">
            <li><a class="cr-nav__item cr-nav__item--active" href="#">◈ Attention <span class="cr-nav__badge">2</span></a></li>
            <li><a class="cr-nav__item" href="#">◧ Sessions</a></li>
            <li><a class="cr-nav__item" href="#">▦ Sprint</a></li>
          </ul>
        </nav>
        <div class="cr-instrument__board">
          <div class="cr-hero cr-hero--wait"><div><div class="cr-hero__big">nova needs you</div><div class="cr-hero__sub">CR-1130 · paused · 6m</div></div></div>
          <section class="cr-panel"><h4 class="cr-panel__title">Sessions</h4>
            <div class="cr-row"><span class="cr-dot" style="background:var(--sig-work)"></span><span class="cr-row__name">PTL-757 chat-turn</span><span class="cr-row__status">streaming</span></div>
            <div class="cr-row"><span class="cr-dot" style="background:var(--sig-err)"></span><span class="cr-row__name">rp verify</span><span class="cr-row__status">2 failing</span></div>
          </section>
        </div>
      </div>
    </div>
  </div>
</div>
<script>
  var root=document.documentElement;
  document.querySelectorAll(".switch button").forEach(function(b){
    b.addEventListener("click",function(){
      root.setAttribute("data-theme",b.dataset.set);
      document.querySelectorAll(".switch button").forEach(function(x){
        x.setAttribute("aria-pressed",String(x===b));
      });
    });
  });
</script>
</body>
</html>
`;

mkdirSync(join(ROOT, "public"), { recursive: true });
writeFileSync(join(ROOT, "public", "gallery.html"), html);
console.log(`wrote public/gallery.html  (${html.length} bytes, consumes styles/components.css)`);
