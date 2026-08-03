#!/usr/bin/env node
/**
 * Build the living gallery — a self-contained page that inlines the generated
 * tokens and demoes the language + components live across all four themes.
 * It doubles as the visual quality gate (see checklists/component-checklist.md).
 *
 * Output: site/public/gallery.html   (served by VitePress at /gallery.html)
 * Depends on: dist/control-room.css, dist/tokens.flat.json  (run build:tokens first)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const tokensCss = readFileSync(join(ROOT, "dist", "control-room.css"), "utf8");
const flat = JSON.parse(readFileSync(join(ROOT, "dist", "tokens.flat.json"), "utf8"));
const dark = flat.themes.dark;

const THEMES = ["dark", "light", "extreme", "phosphor"];

// swatch groups: [heading, [cssVarName…]]
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

// component demo block (its own compact styles, mirroring references/components.md)
const DEMO_CSS = `
  .g-panel{background:var(--panel);border:var(--brd) solid var(--border);
    box-shadow:var(--shadow-off) var(--shadow-off) 0 var(--shadow-col);padding:13px;}
  .g-panel h4{font-family:var(--font-mono);font-size:11px;font-weight:800;text-transform:uppercase;
    letter-spacing:.1em;color:var(--ink);margin:0 0 10px;}
  .g-btn{font-family:var(--font-mono);font-size:12px;font-weight:800;letter-spacing:.03em;
    padding:9px 15px;cursor:pointer;background:var(--sig-wait);color:var(--on-sig);
    border:var(--brd-heavy) solid var(--border);
    box-shadow:var(--shadow-off) var(--shadow-off) 0 var(--shadow-col);
    transition:transform .05s,box-shadow .05s;}
  .g-btn:active{transform:translate(var(--shadow-off),var(--shadow-off));box-shadow:0 0 0 var(--shadow-col);}
  .g-chip{font-family:var(--font-mono);font-size:11px;font-weight:700;padding:3px 9px;
    background:var(--sig-done);color:var(--on-sig);border:var(--brd) solid var(--border);}
  .g-chip.alt{background:var(--sig-work);}
  .g-dot{width:8px;height:8px;border:1.5px solid var(--border);display:inline-block;}
  .g-tag{font-family:var(--font-mono);font-size:10px;font-weight:800;padding:2px 7px;
    border:1.5px solid var(--border);text-transform:uppercase;letter-spacing:.04em;}
  .g-srow{display:flex;align-items:center;gap:11px;padding:7px 0;
    border-bottom:1.5px solid color-mix(in srgb,var(--border) 18%,transparent);}
  .g-srow .nm{flex:1;font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--ink);}
  .g-srow .st{font-family:var(--font-mono);font-size:11px;color:var(--muted);}
  .g-hero{display:flex;align-items:center;gap:16px;background:var(--sig-accent);color:var(--on-sig);
    border:var(--brd) solid var(--border);box-shadow:var(--shadow-off) var(--shadow-off) 0 var(--shadow-col);
    padding:16px;}
  .g-hero .big{font-weight:900;font-size:19px;line-height:1.05;}
  .g-hero .sub2{font-family:var(--font-mono);font-size:12px;opacity:.82;margin-top:3px;}
  .g-bezel{border:var(--brd-brush) solid var(--border);background:var(--panel-2);padding:11px;
    box-shadow:var(--shadow-off) var(--shadow-off) 0 var(--shadow-col);}
  .g-bezel .rivets{display:flex;justify-content:space-between;margin-bottom:8px;}
  .g-bezel .rivets i{width:7px;height:7px;background:var(--border);display:block;}
  .g-bezel .screen{background:var(--board);border:var(--brd) solid var(--border);padding:16px;
    background-image:var(--halftone);background-size:var(--halftone-size) var(--halftone-size);
    font-family:var(--font-mono);font-size:12px;color:var(--ink);}
  .g-rail{display:flex;}
  .g-rail span{font-family:var(--font-mono);font-size:11px;font-weight:700;padding:7px 15px 7px 21px;
    background:var(--panel);color:var(--ink);border:var(--brd) solid var(--border);margin-left:-10px;
    clip-path:polygon(0 0,calc(100% - 10px) 0,100% 50%,calc(100% - 10px) 100%,0 100%,10px 50%);}
  .g-rail span:first-child{margin-left:0;}
  .g-rail span.on{background:var(--sig-work);color:var(--on-sig);}
  .g-drip{border:var(--brd) solid var(--border);background:var(--sig-err);color:#fff;padding:16px;}
  .g-drip .dt{font-weight:900;font-size:17px;text-transform:uppercase;letter-spacing:-.02em;}
  .g-drip .ds{font-family:var(--font-mono);font-size:11px;opacity:.85;margin-top:3px;}
`;

const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Control Room — Living Gallery</title>
<style>
${tokensCss}

/* gallery chrome */
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
${DEMO_CSS}
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
  <p class="note">Every element below is built from the generated token layer. Flip the theme — nothing has per-theme code. <a class="back" href="./">◂ docs</a></p>

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
      <h3>Panel</h3>
      <section class="g-panel"><h4>Sessions</h4>
        <div class="g-srow"><span class="g-dot" style="background:var(--sig-work)"></span><span class="nm">PTL-757 chat-turn</span><span class="st">streaming</span></div>
        <div class="g-srow"><span class="g-dot" style="background:var(--sig-wait)"></span><span class="nm">CR-1130 picker</span><span class="st">needs input</span></div>
        <div class="g-srow"><span class="g-dot" style="background:var(--sig-err)"></span><span class="nm">rp verify</span><span class="st">2 failing</span></div>
      </section>
    </div>
    <div>
      <h3>Hero (keyed focal)</h3>
      <div class="g-hero"><div><div class="big">nova needs you</div><div class="sub2">CR-1130 · paused · 6m</div></div></div>
      <h3 style="margin-top:16px">Buttons · Chips</h3>
      <button class="g-btn" type="button">RUN SCAN</button>
      <div style="margin-top:10px;display:flex;gap:7px;flex-wrap:wrap">
        <span class="g-chip">PTL-757</span><span class="g-chip alt">ui-kit</span>
        <span class="g-tag" style="background:var(--sig-done);color:var(--on-sig)">shipped</span>
        <span class="g-tag" style="background:var(--sig-err);color:var(--on-sig)">ruled out</span>
      </div>
    </div>
    <div>
      <h3>Bezel (texture lives here only)</h3>
      <div class="g-bezel"><div class="rivets" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <div class="screen">&gt; scan complete · 14 sessions · 2 flagged</div></div>
      <h3 style="margin-top:16px">Arrow-rail (sequence)</h3>
      <div class="g-rail"><span class="on">scan</span><span>triage</span><span>fix</span><span>verify</span></div>
    </div>
    <div>
      <h3>Error surface (drip)</h3>
      <div class="g-drip"><div class="dt">connection lost</div><div class="ds">ai-global-chat · SSE closed · retry 3/5</div></div>
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

// VitePress publicDir is <srcDir>/public and srcDir is the repo root
mkdirSync(join(ROOT, "public"), { recursive: true });
writeFileSync(join(ROOT, "public", "gallery.html"), html);
console.log(`wrote public/gallery.html  (${html.length} bytes)`);
