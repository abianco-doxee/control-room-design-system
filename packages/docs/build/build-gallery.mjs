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
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { timeTicks } from "@control-room/utils/time-scale";
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
const flat = JSON.parse(
  readFileSync(join(ROOT, "..", "..", "packages", "tokens", "dist", "tokens.flat.json"), "utf8")
);
const dark = flat.themes.dark;

// Inline the condensed display face (Saira Condensed 800) as "CR Display" — the
// first name in --font-display — so the standalone gallery shows the real
// condensed register instead of a system fallback. One weight, data-URI'd.
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
  /* font not installed — falls back to the rest of the --font-display stack */
}

const THEMES = ["dark", "light", "extreme", "phosphor"];

const GROUPS = [
  ["Surface", ["--ground", "--board", "--panel", "--panel-2", "--rail"]],
  ["Text", ["--ink", "--muted", "--rail-ink", "--on-sig"]],
  ["Line & mass", ["--border", "--mass", "--shadow-col"]],
  [
    "Signal (state)",
    [
      "--sig-work",
      "--sig-wait",
      "--sig-done",
      "--sig-err",
      "--sig-idle",
      "--sig-accent",
      "--sig-accent-2",
    ],
  ],
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
  <div class="swgrid">${vars.map(swatch).join("")}</div>`
).join("");

// ── Chart demo generators — mirror the CrSparkline/CrLineChart/CrBarChart/
// CrStackedBar geometry so the static gallery markup matches the shipped
// components (the component browser mounts the real ones; these are the same
// math, hand-rendered for the standalone page). ─────────────────────────────
const hue = (sig, i) => {
  const order = ["work", "accent-2", "accent", "wait", "done"];
  const key = sig ? (sig === "accent2" ? "accent-2" : sig) : order[i % order.length];
  return "var(--sig-" + key + ")";
};
// Nice-scale helpers — mirror CrLineChart/CrBarChart so the static y-axis matches.
const niceNum = (range, round) => {
  const exp = Math.floor(Math.log10(range));
  const f = range / Math.pow(10, exp);
  let nf;
  if (round) {
    if (f < 1.5) nf = 1;
    else if (f < 3) nf = 2;
    else if (f < 7) nf = 5;
    else nf = 10;
  } else {
    if (f <= 1) nf = 1;
    else if (f <= 2) nf = 2;
    else if (f <= 5) nf = 5;
    else nf = 10;
  }
  return nf * Math.pow(10, exp);
};
const niceScale = (lo, hi, maxTicks) => {
  let a = lo,
    b = hi;
  if (b <= a) b = a + 1;
  const range = niceNum(b - a, false),
    step = niceNum(range / (maxTicks - 1), true);
  const niceLo = Math.floor(a / step) * step,
    niceHi = Math.ceil(b / step) * step;
  const ticks = [];
  for (let v = niceLo; v <= niceHi + step * 0.5; v += step) ticks.push(Math.round(v / step) * step);
  return { min: niceLo, max: niceHi, ticks };
};
const fmtTick = (v) => {
  const a = Math.abs(v);
  if (a >= 1000000) return Math.round(v / 100000) / 10 + "M";
  if (a >= 1000) return Math.round(v / 100) / 10 + "k";
  return String(Math.round(v * 100) / 100);
};
function sparkSvg(data, { signal = "work", area = true, height = 32, label = "trend" } = {}) {
  const W = 120,
    pad = 3,
    H = height,
    n = data.length;
  const min = Math.min(...data),
    max = Math.max(...data),
    range = max - min || 1,
    innerH = H - pad * 2;
  const pts = data.map((v, i) => ({
    x: n === 1 ? W / 2 : (i / (n - 1)) * W,
    y: pad + (1 - (v - min) / range) * innerH,
  }));
  const line = pts.map((p) => p.x.toFixed(2) + "," + p.y.toFixed(2)).join(" ");
  let ap = "M " + pts[0].x.toFixed(2) + "," + H.toFixed(2);
  for (const p of pts) ap += " L " + p.x.toFixed(2) + "," + p.y.toFixed(2);
  ap += " L " + pts[n - 1].x.toFixed(2) + "," + H.toFixed(2) + " Z";
  const last = pts[n - 1];
  return (
    `<span class="cr-spark cr-spark--${signal}" role="img" aria-label="${label}: ${n} points, latest ${data[n - 1]}">` +
    `<svg class="cr-spark__svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">` +
    (area ? `<path class="cr-spark__area" d="${ap}"/>` : "") +
    `<polyline class="cr-spark__line" points="${line}" vector-effect="non-scaling-stroke"/>` +
    `<circle class="cr-spark__dot" cx="${last.x.toFixed(2)}" cy="${last.y.toFixed(2)}" r="2.4" vector-effect="non-scaling-stroke"/></svg></span>`
  );
}
function lineChartSvg(
  series,
  labels,
  {
    area = true,
    height = 140,
    label = "line chart",
    axis = true,
    unit = "",
    x = null,
    xTime = false,
    xZone = "UTC",
  } = {}
) {
  const W = 320,
    H = height,
    L = axis ? 30 : 8,
    R = 8,
    T = 10,
    B = 18,
    plotW = W - L - R,
    plotH = H - T - B;
  const xs = x && x.length ? x : null,
    continuous = !!xs;
  let dlo = Infinity,
    dhi = -Infinity;
  for (const s of series)
    for (const v of s.data) {
      if (v < dlo) dlo = v;
      if (v > dhi) dhi = v;
    }
  if (!isFinite(dlo)) {
    dlo = 0;
    dhi = 1;
  }
  const sc = niceScale(dlo, dhi, 5),
    lo = sc.min,
    hi = sc.max,
    range = hi - lo || 1;
  const yAt = (v) => T + (1 - (v - lo) / range) * plotH;
  let xmin = 0,
    xmax = 1,
    xticks = [];
  if (continuous) {
    xmin = Math.min(...xs);
    xmax = Math.max(...xs);
    xticks = xTime
      ? timeTicks(xmin, xmax, { zone: xZone, target: 6 }).filter(
          (t) => t.value >= xmin && t.value <= xmax
        )
      : niceScale(xmin, xmax, 5)
          .ticks.filter((t) => t >= xmin && t <= xmax)
          .map((v) => ({ value: v, label: fmtTick(v) }));
  }
  const xspan = xmax - xmin || 1;
  const xAtV = (v) => L + ((v - xmin) / xspan) * plotW;
  const xAtI = (i, n) => L + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const gridSvg = sc.ticks
    .map((v) => {
      const gy = yAt(v).toFixed(2);
      return (
        `<line class="cr-chart__grid" x1="${L}" y1="${gy}" x2="${W - R}" y2="${gy}" vector-effect="non-scaling-stroke"/>` +
        (axis
          ? `<text class="cr-chart__ytick" x="${L - 5}" y="${(yAt(v) + 3).toFixed(2)}" text-anchor="end">${fmtTick(v)}${unit}</text>`
          : "")
      );
    })
    .join("");
  const seriesSvg = series
    .map((s, si) => {
      const color = hue(s.signal, si),
        lim = continuous ? Math.min(s.data.length, xs.length) : s.data.length;
      const pts = [];
      for (let i = 0; i < lim; i++)
        pts.push({ x: continuous ? xAtV(xs[i]) : xAtI(i, lim), y: yAt(s.data[i]) });
      const line = pts.map((p) => p.x.toFixed(2) + "," + p.y.toFixed(2)).join(" ");
      let ap = "M " + pts[0].x.toFixed(2) + "," + (T + plotH).toFixed(2);
      for (const p of pts) ap += " L " + p.x.toFixed(2) + "," + p.y.toFixed(2);
      ap += " L " + pts[pts.length - 1].x.toFixed(2) + "," + (T + plotH).toFixed(2) + " Z";
      const e = pts[pts.length - 1];
      return (
        (area ? `<path class="cr-linechart__area" d="${ap}" style="fill:${color}"/>` : "") +
        `<polyline class="cr-linechart__line" points="${line}" style="stroke:${color}" vector-effect="non-scaling-stroke"/>` +
        `<circle class="cr-linechart__end" cx="${e.x.toFixed(2)}" cy="${e.y.toFixed(2)}" r="2.6" style="fill:${color}" vector-effect="non-scaling-stroke"/>`
      );
    })
    .join("");
  const ticks = continuous
    ? xticks
        .map(
          (tk) =>
            `<line class="cr-chart__grid cr-chart__grid--v" x1="${xAtV(tk.value).toFixed(2)}" y1="${T}" x2="${xAtV(tk.value).toFixed(2)}" y2="${(T + plotH).toFixed(2)}" vector-effect="non-scaling-stroke"/><text class="cr-chart__tick" x="${xAtV(tk.value).toFixed(2)}" y="${H - 5}" text-anchor="middle">${tk.label}</text>`
        )
        .join("")
    : (labels || [])
        .map(
          (t, i) =>
            `<text class="cr-chart__tick" x="${xAtI(i, labels.length).toFixed(2)}" y="${H - 5}" text-anchor="middle">${t}</text>`
        )
        .join("");
  const legend =
    series.length > 1
      ? `<figcaption class="cr-chart__legend">${series.map((s, si) => `<button type="button" class="cr-chart__key" aria-pressed="true"><span class="cr-chart__sw" style="background:${hue(s.signal, si)}" aria-hidden="true"></span>${s.name}</button>`).join("")}</figcaption>`
      : "";
  const summary =
    label + " — " + series.map((s) => s.name + " latest " + s.data[s.data.length - 1]).join(", ");
  return `<figure class="cr-chart cr-linechart"><div class="cr-linechart__graphic" role="img" aria-label="${summary}"><svg class="cr-linechart__plot" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${gridSvg}${seriesSvg}${ticks}</svg></div>${legend}</figure>`;
}
function barChartSvg(
  data,
  { target, showValues = true, height = 140, label = "bar chart", axis = true, unit = "" } = {}
) {
  const W = 320,
    H = height,
    L = axis ? 30 : 6,
    R = 6,
    T = 14,
    B = 18,
    plotW = W - L - R,
    plotH = H - T - B,
    base = T + plotH;
  let hi = target || 0;
  for (const d of data) if (d.value > hi) hi = d.value;
  const sc = niceScale(0, hi || 1, 5),
    max = sc.max;
  const yAt = (v) => base - Math.max(0, Math.min(1, v / max)) * plotH;
  const gridSvg = sc.ticks
    .map(
      (v) =>
        `<line class="cr-chart__grid" x1="${L}" y1="${yAt(v).toFixed(2)}" x2="${W - R}" y2="${yAt(v).toFixed(2)}" vector-effect="non-scaling-stroke"/>` +
        (axis
          ? `<text class="cr-chart__ytick" x="${L - 5}" y="${(yAt(v) + 3).toFixed(2)}" text-anchor="end">${fmtTick(v)}${unit}</text>`
          : "")
    )
    .join("");
  const n = data.length,
    gap = 2,
    bw = (plotW - gap * (n - 1)) / n;
  const bars = data
    .map((d, i) => {
      const h = Math.max(0, Math.min(1, d.value / max)) * plotH,
        x = L + i * (bw + gap),
        cx = x + bw / 2,
        color = hue(d.signal, i);
      return (
        `<rect class="cr-barchart__bar" x="${x.toFixed(2)}" y="${(base - h).toFixed(2)}" width="${bw.toFixed(2)}" height="${h.toFixed(2)}" rx="1.5" style="fill:${color}"/>` +
        (showValues
          ? `<text class="cr-chart__val" x="${cx.toFixed(2)}" y="${(base - h - 3).toFixed(2)}" text-anchor="middle">${d.value}</text>`
          : "") +
        `<text class="cr-chart__tick" x="${cx.toFixed(2)}" y="${H - 5}" text-anchor="middle">${d.label}</text>`
      );
    })
    .join("");
  const tline =
    target !== undefined
      ? `<line class="cr-chart__target" x1="${L}" y1="${yAt(target).toFixed(2)}" x2="${W - R}" y2="${yAt(target).toFixed(2)}" vector-effect="non-scaling-stroke"/>`
      : "";
  const summary = label + " — " + data.map((d) => d.label + " " + d.value).join(", ");
  return `<figure class="cr-chart cr-barchart" role="img" aria-label="${summary}"><svg class="cr-barchart__plot" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${gridSvg}${bars}${tline}</svg></figure>`;
}
function stackedBar(segments, { label, showLegend = true } = {}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const rows = segments.map((s) => ({ ...s, pct: (s.value / total) * 100 }));
  const bar = rows
    .map(
      (r) =>
        `<span class="cr-stack__seg cr-stack__seg--${r.signal}" style="flex-grow:${r.pct}" title="${r.label} · ${r.value}"></span>`
    )
    .join("");
  const legend = showLegend
    ? `<div class="cr-stack__legend" aria-hidden="true">${rows.map((r) => `<span class="cr-stack__key"><span class="cr-stack__sw cr-stack__seg--${r.signal}"></span><span class="cr-stack__kl">${r.label}</span><span class="cr-stack__kv">${r.value}</span><span class="cr-stack__kp">${Math.round(r.pct)}%</span></span>`).join("")}</div>`
    : "";
  const summary =
    (label || "breakdown") +
    " — " +
    rows.map((r) => r.label + " " + r.value + " (" + Math.round(r.pct) + "%)").join(", ");
  return `<div class="cr-stack" role="img" aria-label="${summary}">${label ? `<span class="cr-stack__label">${label}</span>` : ""}<div class="cr-stack__bar" aria-hidden="true">${bar}</div>${legend}</div>`;
}

const chartsSection = `
      <h3 style="margin-top:16px">Telemetry &amp; charts — sparkline · line · bar · stacked</h3>
      <p class="note" style="margin-bottom:10px">SVG plots on the signal palette: crisp non-scaling 2px marks, a recessive grid, baseline-anchored bars, one y-axis. Series identity carries a legend (never colour alone); every figure has a spoken summary.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px">
        <span style="font-family:var(--font-mono);font-size:12px;color:var(--muted)">p95 latency</span>
        ${sparkSvg([3, 5, 4, 7, 6, 9, 8, 12, 10, 14, 11, 15], { signal: "work", label: "p95 latency" })}
        <span style="font-family:var(--font-mono);font-size:13px;color:var(--ink)">15ms</span>
        ${sparkSvg([9, 7, 8, 5, 6, 4, 5, 3, 4, 2], { signal: "done", area: false, label: "error rate" })}
        <span style="font-family:var(--font-mono);font-size:13px;color:var(--ink)">2%</span>
      </div>
      <div style="display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));align-items:start">
        <div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--muted);margin-bottom:6px">throughput vs errors · 09→16</div>
          ${lineChartSvg(
            [
              { name: "throughput", data: [12, 18, 15, 22, 19, 26, 24, 31], signal: "work" },
              { name: "errors", data: [2, 3, 2, 5, 4, 3, 6, 4], signal: "err" },
            ],
            ["09", "10", "11", "12", "13", "14", "15", "16"],
            { label: "Throughput vs errors" }
          )}
        </div>
        <div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--muted);margin-bottom:6px">error budget · calendar axis (5 months)</div>
          ${(() => {
            // ~5 months of weekly samples → monthly calendar ticks (UTC, deterministic).
            const start = Date.UTC(2025, 0, 6),
              week = 7 * 24 * 3600 * 1000;
            const xs = [],
              data = [];
            for (let i = 0; i < 22; i++) {
              xs.push(start + i * week);
              data.push(80 + Math.round(18 * Math.sin(i / 2.5)) + (i % 4));
            }
            return lineChartSvg([{ name: "budget", data, signal: "work" }], null, {
              label: "error budget over five months",
              unit: "%",
              x: xs,
              xTime: true,
              xZone: "UTC",
            });
          })()}
        </div>
        <div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--muted);margin-bottom:6px">sessions by region · target 35</div>
          ${barChartSvg(
            [
              { label: "eu", value: 42 },
              { label: "us", value: 31 },
              { label: "ap", value: 18 },
              { label: "sa", value: 9 },
            ],
            { target: 35, label: "Sessions by region" }
          )}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;max-width:420px;margin-top:16px">
        ${stackedBar(
          [
            { label: "working", value: 6, signal: "work" },
            { label: "waiting", value: 3, signal: "wait" },
            { label: "done", value: 9, signal: "done" },
            { label: "failed", value: 1, signal: "err" },
          ],
          { label: "Fleet state" }
        )}
        ${stackedBar(
          [
            { label: "cpu", value: 41, signal: "work" },
            { label: "io", value: 22, signal: "accent" },
            { label: "idle", value: 37, signal: "idle" },
          ],
          { label: "Worker eu-01 budget" }
        )}
      </div>`;

const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Control Room — Living Gallery</title>
<style>
${displayFace}
${tokensCss}

/* the shipped component layer — exactly what a consumer imports */
${componentsCss}

/* gallery chrome only (not part of the system) */
.wrap{max-width:1040px;margin:0 auto;padding:28px 20px 100px;}
.bar{position:sticky;top:0;z-index:10;display:flex;flex-wrap:wrap;gap:12px;align-items:center;
  background:var(--ground);padding:14px 0;border-bottom:var(--brd) solid var(--border);margin-bottom:8px;}
.bar h1{font-weight:900;font-size:clamp(20px,3vw,30px);text-transform:uppercase;letter-spacing:-.038em;
  line-height:.9;margin:0;}
.bar .brand{display:flex;flex-direction:column;gap:2px;}
.bar a.home{font-family:var(--font-mono);font-size:11px;font-weight:800;text-transform:uppercase;
  letter-spacing:.06em;color:var(--muted);text-decoration:none;}
.bar a.home:hover{color:var(--sig-accent);}
.jump{display:flex;flex-wrap:wrap;gap:14px;align-items:center;flex:1;}
.jump a{font-family:var(--font-mono);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;
  color:var(--ink);text-decoration:none;border-bottom:2px dotted transparent;}
.jump a:hover{border-bottom-color:var(--muted);color:var(--sig-accent);}
.jump a.xlink{margin-left:auto;color:var(--muted);}
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
<div class="cr-scrollbar" aria-hidden="true"></div>
<div class="wrap">
  <div class="bar">
    <div class="brand">
      <a class="home" href="./">◂ Control Room</a>
      <h1>Living Gallery</h1>
    </div>
    <nav class="jump" aria-label="Sections">
      <a href="#tokens">Tokens</a>
      <a href="#type">Type</a>
      <a href="#components">Components</a>
      <a class="xlink" href="./components.html">Component Browser ↗</a>
    </nav>
    <div class="switch" role="group" aria-label="Theme">
      ${THEMES.map((t, i) => `<button type="button" data-set="${t}" aria-pressed="${i === 0}">${t}</button>`).join("\n      ")}
    </div>
  </div>
  <p class="note">Everything below is built from the generated token layer + the shipped <code>styles/components.css</code>. Flip the theme — nothing has per-theme code.</p>

  <h2 id="tokens">01 · Color tokens</h2>
  ${swatchGroups}

  <h2 id="type">02 · Typography — two registers, nothing between</h2>
  <div class="specimen">
    <div class="disp">14 sessions<br>2 need you</div>
    <div class="data">rev 2.6 // unit/cr-01 // up 4h12m // ◍ sync</div>
  </div>

  <h2 id="components">03 · Components</h2>
  <div class="demogrid">
    <div style="grid-column:1/-1">
      <h3>Composed — an operator's screen (the whole vocabulary in one)</h3>
      <p style="font-family:var(--font-mono);font-size:11px;color:var(--muted);max-width:80ch;line-height:1.6;margin:0 0 12px">
        One screen exercising the nine laws together: condensed masthead + registration ticks, a keyed hero,
        severity shapes beside colour, seeded sigils per session, the arrow-rail, a texture + scanline bezel,
        keyed tiles — and exactly one Law-9 breach. Flip the theme; it holds with zero per-theme code.
      </p>
      <div class="cr-instrument">
        <nav class="cr-nav" aria-label="Primary">
          <div class="cr-nav__brand">CONTROL<br>ROOM</div>
          <ul class="cr-nav__list">
            <li><a class="cr-nav__item cr-nav__item--active" href="#" aria-current="page">◈ Attention <span class="cr-nav__badge">2</span></a></li>
            <li><a class="cr-nav__item" href="#">◧ Sessions</a></li>
            <li><a class="cr-nav__item" href="#">▦ Sprint</a></li>
            <li><a class="cr-nav__item" href="#">◹ Pipeline</a></li>
          </ul>
        </nav>
        <div class="cr-instrument__board">
          <header class="cr-masthead cr-mark" style="overflow:hidden">
            <div class="cr-ascii cr-ascii--mask-l" aria-hidden="true"><canvas class="crascii" width="380" height="130" data-seed="cr-mast" data-variant="braille"></canvas></div>
            <p class="cr-masthead__eyebrow" style="position:relative;z-index:1">DP Control Room · Phase 0</p>
            <h1 class="cr-masthead__title" style="position:relative;z-index:1">14 sessions<br>2 need you</h1>
            <span class="cr-telemetry" aria-hidden="true" style="position:absolute;right:14px;bottom:10px;z-index:1">SEED 2E7A · 0x4F · 12ms ▮▮▮▯▯</span>
          </header>
          <div class="cr-hero cr-hero--wait">
            <div><div class="cr-hero__big">nova needs you</div><div class="cr-hero__sub">CR-1130 · paused for input · 6m</div></div>
            <canvas class="crsig" width="56" height="56" data-seed="nova-01" data-state="waiting" style="margin-left:auto"></canvas>
          </div>
          <div style="display:grid;grid-template-columns:1.25fr 1fr;gap:12px">
            <section class="cr-panel cr-panel--major">
              <h4 class="cr-panel__title">Sessions</h4>
              <div class="cr-row"><span class="cr-sev cr-sev--work" role="img" aria-label="working"></span><canvas class="crsig" width="20" height="20" data-seed="ptl-757" data-state="working"></canvas><span class="cr-row__name">PTL-757 chat-turn</span><span class="cr-row__status">streaming</span></div>
              <div class="cr-row"><span class="cr-sev cr-sev--warn" role="img" aria-label="attend"></span><canvas class="crsig" width="20" height="20" data-seed="cr-1130" data-state="waiting"></canvas><span class="cr-row__name">CR-1130 picker</span><span class="cr-row__status">needs input</span></div>
              <div class="cr-row"><span class="cr-sev cr-sev--crit" role="img" aria-label="critical"></span><canvas class="crsig" width="20" height="20" data-seed="rp-verify" data-state="error"></canvas><span class="cr-row__name">rp verify</span><span class="cr-row__status">2 failing</span></div>
              <div class="cr-row"><span class="cr-sev cr-sev--ok" role="img" aria-label="nominal"></span><canvas class="crsig" width="20" height="20" data-seed="atlas" data-state="done"></canvas><span class="cr-row__name">atlas deploy</span><span class="cr-row__status">merged</span></div>
              <div style="display:flex;gap:8px;margin-top:12px"><button class="cr-btn cr-btn--sm cr-btn--sig-accent" type="button">Escalate</button><button class="cr-btn cr-btn--sm cr-btn--sig-accent2" type="button">Approve all</button></div>
            </section>
            <section class="cr-panel">
              <h4 class="cr-panel__title">Pipeline</h4>
              <div class="cr-rail" style="margin-bottom:10px"><span class="cr-rail__step cr-rail__step--on">scan</span><span class="cr-rail__step">triage</span><span class="cr-rail__step">fix</span><span class="cr-rail__step">verify</span></div>
              <div class="cr-bezel cr-anim-scan"><div class="cr-bezel__rivets" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
                <div class="cr-bezel__screen cr-tex--glass">&gt; scan complete · 14 sessions · 2 flagged<br>&gt; awaiting operator on CR-1130</div></div>
              <div style="display:flex;gap:10px;margin-top:10px;align-items:center"><span class="cr-plate">UNIT · CR-00 · REV.C</span><span class="cr-tally">▐▐▐ ▌ 14</span></div>
            </section>
          </div>
          <div class="cr-breach cr-breach--wash cr-breach--alive" style="background-color:var(--panel);padding:16px">
            <div class="cr-masthead__eyebrow" style="color:var(--sig-accent)">Milestone</div>
            <div class="cr-hero__big" style="color:var(--ink)">Sprint 41 shipped</div>
            <div class="cr-hero__sub" style="color:var(--muted)">38 tasks · 0 regressions · 2 days early</div>
          </div>
          <div class="cr-tiles">
            <div class="cr-tile cr-tile--work">nova</div>
            <div class="cr-tile cr-tile--wait">atlas</div>
            <div class="cr-tile cr-tile--done">echo</div>
            <div class="cr-tile cr-tile--err">rhea</div>
            <div class="cr-tile cr-tile--idle">kite</div>
            <div class="cr-tile cr-tile--stage">calm</div>
          </div>
        </div>
      </div>
    </div>
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
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <button class="cr-btn" type="button">RUN SCAN</button>
        <button class="cr-btn cr-btn--sig-accent" type="button">Escalate</button>
        <button class="cr-btn cr-btn--sig-accent2" type="button">Approve</button>
      </div>
      <div style="margin-top:10px;display:flex;gap:7px;flex-wrap:wrap;align-items:center">
        <span class="cr-chip">PTL-757</span><span class="cr-chip cr-chip--alt">ui-kit</span>
        <span class="cr-tag cr-tag--done">shipped</span><span class="cr-tag cr-tag--err">ruled out</span>
      </div>
    </div>
    <div>
      <h3>Bezel + texture (halftone / dither / scan — hardware only)</h3>
      <div class="cr-bezel cr-anim-scan"><div class="cr-bezel__rivets" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <div class="cr-bezel__screen cr-tex--glass">&gt; scan complete · 14 sessions · 2 flagged</div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px">
        <div class="cr-panel cr-panel--inset cr-tex--halftone" style="min-height:44px;font-family:var(--font-mono);font-size:10px;color:var(--muted);padding:8px">halftone</div>
        <div class="cr-panel cr-panel--inset cr-tex--dither" style="min-height:44px;font-family:var(--font-mono);font-size:10px;color:var(--muted);padding:8px">dither</div>
        <div class="cr-panel cr-panel--inset cr-tex--scan" style="min-height:44px;font-family:var(--font-mono);font-size:10px;color:var(--muted);padding:8px">scan</div>
      </div>
      <h3 style="margin-top:16px">Seeded pixel-sigils (cyber-sigilism)</h3>
      <div id="sigrow" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
        <canvas class="crsig" width="52" height="52" data-seed="nova-01" data-state="working"></canvas>
        <canvas class="crsig" width="52" height="52" data-seed="ptl-757" data-state="waiting"></canvas>
        <canvas class="crsig" width="52" height="52" data-seed="cr-1130" data-state="error"></canvas>
        <canvas class="crsig" width="52" height="52" data-seed="rp-verify" data-state="done"></canvas>
        <canvas class="crsig" width="52" height="52" data-seed="ail-chat" data-state="idle"></canvas>
      </div>
      <h3 style="margin-top:16px">Arrow-rail (sequence)</h3>
      <div class="cr-rail"><span class="cr-rail__step cr-rail__step--on">scan</span><span class="cr-rail__step">triage</span><span class="cr-rail__step">fix</span><span class="cr-rail__step">verify</span></div>
      <h3 style="margin-top:16px">Diagonal primitives (shape = meaning)</h3>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <span class="cr-chev" style="font-family:var(--font-mono);font-size:var(--text-sm);color:var(--ink)">route</span>
        <span class="cr-notch" style="font-family:var(--font-mono);font-size:var(--text-2xs);font-weight:800;text-transform:uppercase">held</span>
        <span class="cr-wedge cr-panel" style="padding:8px 20px 8px 12px;font-family:var(--font-mono);font-size:var(--text-sm)">active panel</span>
      </div>
    </div>
    <div>
      <h3>Error surface (drip)</h3>
      <div class="cr-drip"><div class="cr-drip__title">connection lost</div><div class="cr-drip__sub">ai-global-chat · SSE closed · retry 3/5</div></div>
    </div>
    <div style="grid-column:1/-1">
      <h3>Masthead</h3>
      <header class="cr-masthead cr-mark"><p class="cr-masthead__eyebrow">DP Control Room · Phase 0</p><h1 class="cr-masthead__title">14 sessions<br>2 need you</h1></header>
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
      <h3>Table (sortable · selectable · sticky header)</h3>
      <table class="cr-table cr-table--sticky">
        <thead><tr>
          <th class="cr-table__sel" aria-label="select"></th>
          <th class="cr-table__sortable" aria-sort="ascending">Session<span class="cr-table__ind">▲</span></th>
          <th class="cr-table__sortable" aria-sort="none">Task</th>
          <th class="cr-table__sortable" aria-sort="none">Status</th>
        </tr></thead>
        <tbody>
          <tr aria-selected="true"><td class="cr-table__sel"><input type="checkbox" class="cr-check" checked aria-label="select row" /></td><td>nova</td><td>PTL-757 chat-turn</td><td>streaming</td></tr>
          <tr aria-selected="false"><td class="cr-table__sel"><input type="checkbox" class="cr-check" aria-label="select row" /></td><td>rhea</td><td>rp verify</td><td>2 failing</td></tr>
        </tbody>
      </table>
      <h3 style="margin-top:16px">Tabs</h3>
      <div class="cr-tabs" role="tablist">
        <button type="button" role="tab" class="cr-tab cr-tab--on" aria-selected="true">queue</button>
        <button type="button" role="tab" class="cr-tab" aria-selected="false">workers</button>
        <button type="button" role="tab" class="cr-tab" aria-selected="false">history</button>
      </div>
      <h3 style="margin-top:16px">Meters (capacity)</h3>
      <div style="display:flex;flex-direction:column;gap:8px;max-width:340px">
        <div class="cr-meter cr-meter--work"><span class="cr-meter__label">cpu</span><span class="cr-meter__track" role="meter" aria-valuenow="72" aria-valuemin="0" aria-valuemax="100" aria-label="cpu"><span class="cr-meter__fill" style="width:72%"></span></span></div>
        <div class="cr-meter cr-meter--wait"><span class="cr-meter__label">queue</span><span class="cr-meter__track" role="meter" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" aria-label="queue"><span class="cr-meter__fill" style="width:40%"></span></span></div>
        <div class="cr-meter cr-meter--err"><span class="cr-meter__label">errors</span><span class="cr-meter__track" role="meter" aria-valuenow="12" aria-valuemin="0" aria-valuemax="100" aria-label="errors"><span class="cr-meter__fill" style="width:12%"></span></span></div>
      </div>
      ${chartsSection}
      <h3 style="margin-top:16px">Pagination</h3>
      <nav class="cr-pager" aria-label="Pagination">
        <button type="button" class="cr-pager__btn" aria-label="Previous page">‹</button>
        <button type="button" class="cr-pager__btn" aria-label="Page 1">1</button>
        <button type="button" class="cr-pager__btn cr-pager__btn--on" aria-label="Page 2" aria-current="page">2</button>
        <button type="button" class="cr-pager__btn" aria-label="Page 3">3</button>
        <span class="cr-pager__ellipsis" aria-hidden="true">…</span>
        <button type="button" class="cr-pager__btn" aria-label="Page 9">9</button>
        <button type="button" class="cr-pager__btn" aria-label="Next page">›</button>
      </nav>
      <h3 style="margin-top:16px">Menu (dropdown)</h3>
      <div class="cr-menu" style="position:relative;min-height:150px">
        <button type="button" class="cr-btn cr-btn--outline cr-btn--sm" aria-haspopup="menu" aria-expanded="true">actions ▾</button>
        <div class="cr-menu__panel" role="menu">
          <button type="button" role="menuitem" class="cr-menu__item">pause all</button>
          <button type="button" role="menuitem" class="cr-menu__item">restart failed</button>
          <div class="cr-menu__sep"></div>
          <button type="button" role="menuitem" class="cr-menu__item cr-menu__item--danger">kill all</button>
        </div>
      </div>
      <h3 style="margin-top:16px">Toast region (stacked)</h3>
      <div style="display:flex;flex-direction:column;gap:8px;max-width:340px">
        <div class="cr-toast cr-toast--done" role="status" aria-live="polite"><span class="cr-toast__msg">queue drained</span><button type="button" class="cr-toast__close" aria-label="Dismiss">✕</button></div>
        <div class="cr-toast cr-toast--err" role="alert" aria-live="assertive"><span class="cr-toast__msg">killed all workers</span><button type="button" class="cr-toast__close" aria-label="Dismiss">✕</button></div>
      </div>
      <h3 style="margin-top:16px">Key hints (main = always · secondary = on hover / hold Alt)</h3>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <button type="button" class="cr-btn cr-btn--sig-err" aria-keyshortcuts="i">open incident <kbd class="cr-kbd cr-kbd--on" aria-hidden="true">I</kbd></button>
        <div class="cr-keys-host" style="display:flex;gap:8px;align-items:center">
          <span style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--muted)">hover me →</span>
          <button type="button" class="cr-btn cr-btn--outline cr-btn--sm" aria-keyshortcuts="1">dark <kbd class="cr-kbd cr-kbd--hint" aria-hidden="true">1</kbd></button>
          <button type="button" class="cr-btn cr-btn--outline cr-btn--sm" aria-keyshortcuts="2">light <kbd class="cr-kbd cr-kbd--hint" aria-hidden="true">2</kbd></button>
        </div>
      </div>
      <h3 style="margin-top:16px">Command palette (⌘K)</h3>
      <div class="cr-palette" style="position:static;margin:0;width:auto;max-width:420px">
        <div class="cr-palette__box">
          <input class="cr-palette__input" type="text" role="combobox" aria-expanded="true" aria-controls="g-pal-list" aria-activedescendant="g-cmd-1" aria-autocomplete="list" aria-label="Search commands" value="the" />
          <ul class="cr-palette__list" id="g-pal-list" role="listbox" aria-label="Commands">
            <li class="cr-palette__item" id="g-cmd-0" role="option" aria-selected="false"><span class="cr-palette__label">Theme: Dark</span><span class="cr-palette__group">theme</span><kbd class="cr-kbd" aria-hidden="true">1</kbd></li>
            <li class="cr-palette__item cr-palette__item--active" id="g-cmd-1" role="option" aria-selected="true"><span class="cr-palette__label">Theme: Light</span><span class="cr-palette__group">theme</span><kbd class="cr-kbd" aria-hidden="true">2</kbd></li>
            <li class="cr-palette__item" id="g-cmd-2" role="option" aria-selected="false"><span class="cr-palette__label">Theme: Extreme</span><span class="cr-palette__group">theme</span><kbd class="cr-kbd" aria-hidden="true">3</kbd></li>
          </ul>
        </div>
      </div>
      <h3 style="margin-top:16px">Alerts (signal-keyed callouts)</h3>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div class="cr-alert cr-alert--wait" role="status"><span class="cr-alert__icon" aria-hidden="true"></span><div class="cr-alert__body"><p class="cr-alert__title">Scheduled maintenance</p><p class="cr-alert__msg">Workers restart at 02:00 UTC.</p></div></div>
        <div class="cr-alert cr-alert--err" role="alert"><span class="cr-alert__icon" aria-hidden="true"></span><div class="cr-alert__body"><p class="cr-alert__title">Endpoint unreachable</p><p class="cr-alert__msg">ai-global-chat · SSE closed.</p></div><button type="button" class="cr-alert__close" aria-label="Dismiss">✕</button></div>
      </div>
      <h3 style="margin-top:16px">Radio group · Slider</h3>
      <div style="display:flex;gap:32px;flex-wrap:wrap;align-items:flex-start">
        <div class="cr-radiogroup cr-radiogroup--row" role="radiogroup" aria-label="Density">
          <button type="button" role="radio" class="cr-radio" data-value="cozy" aria-checked="false" tabindex="-1"><span class="cr-radio__box" aria-hidden="true"></span>cozy</button>
          <button type="button" role="radio" class="cr-radio" data-value="compact" aria-checked="true" tabindex="0"><span class="cr-radio__box" aria-hidden="true"></span>compact</button>
        </div>
        <input type="range" class="cr-slider" min="0" max="100" value="64" aria-label="Threshold" style="max-width:220px" />
      </div>
      <h3 style="margin-top:16px">Progress (determinate · indeterminate)</h3>
      <div style="display:flex;flex-direction:column;gap:10px;max-width:340px">
        <div class="cr-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="64" aria-label="Indexing"><span class="cr-progress__fill" style="width:64%"></span></div>
        <div class="cr-progress cr-progress--indeterminate cr-progress--wait" role="progressbar" aria-label="Syncing"><span class="cr-progress__fill"></span></div>
      </div>
      <h3 style="margin-top:16px">Skeleton (loading) · Data list</h3>
      <div style="display:flex;gap:32px;flex-wrap:wrap;align-items:flex-start">
        <div style="display:flex;flex-direction:column;gap:8px;min-width:180px">
          <span class="cr-skeleton cr-skeleton--text" style="width:70%"></span>
          <span class="cr-skeleton cr-skeleton--line" style="width:100%"></span>
          <span class="cr-skeleton cr-skeleton--line" style="width:85%"></span>
        </div>
        <dl class="cr-dl">
          <dt class="cr-dl__k">worker</dt><dd class="cr-dl__v">nova-01</dd>
          <dt class="cr-dl__k">region</dt><dd class="cr-dl__v">eu-west-1</dd>
          <dt class="cr-dl__k">uptime</dt><dd class="cr-dl__v">41h 12m</dd>
        </dl>
      </div>
      <h3 style="margin-top:16px">Accordion · Popover</h3>
      <div style="display:flex;gap:32px;flex-wrap:wrap;align-items:flex-start">
        <div class="cr-accordion" style="min-width:280px">
          <div class="cr-accordion__item">
            <button type="button" class="cr-accordion__header" aria-expanded="true" aria-controls="g-acc-0" id="g-acc-h0"><span>Stack trace</span><span class="cr-accordion__chevron" aria-hidden="true"></span></button>
            <div class="cr-accordion__panel" id="g-acc-0" role="region" aria-labelledby="g-acc-h0">SSEError: stream closed at turn 42</div>
          </div>
          <div class="cr-accordion__item">
            <button type="button" class="cr-accordion__header" aria-expanded="false" aria-controls="g-acc-1" id="g-acc-h1"><span>Recent events</span><span class="cr-accordion__chevron" aria-hidden="true"></span></button>
          </div>
        </div>
        <div class="cr-popover" style="position:relative;min-height:170px">
          <button type="button" class="cr-btn cr-btn--outline cr-btn--sm" aria-haspopup="dialog" aria-expanded="true">filters ▾</button>
          <div class="cr-popover__panel" role="dialog" aria-label="Queue filters" tabindex="-1">
            <p style="font-family:var(--font-mono);font-size:var(--text-xs);font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 8px">show state</p>
            <label style="font-family:var(--font-mono);font-size:var(--text-sm);display:flex;gap:8px;align-items:center"><input type="checkbox" class="cr-check" checked /> failing</label>
          </div>
        </div>
      </div>
      <h3 style="margin-top:16px">Drawer (edge sheet)</h3>
      <div class="cr-drawer" style="position:static;inset:auto;margin:0;width:auto;max-width:320px;height:auto;border:var(--brd) solid var(--border);box-shadow:var(--shadow-off) var(--shadow-off) 0 var(--shadow-col)">
        <div class="cr-drawer__box">
          <div class="cr-drawer__head"><h2 class="cr-drawer__title">cr-1130 · inspect</h2><button type="button" class="cr-drawer__close" aria-label="Close">✕</button></div>
          <div class="cr-drawer__body">
            <dl class="cr-dl"><dt class="cr-dl__k">state</dt><dd class="cr-dl__v">failing · SSE closed</dd><dt class="cr-dl__k">retries</dt><dd class="cr-dl__v">3 / 5</dd></dl>
          </div>
        </div>
      </div>
      <h3 style="margin-top:16px">Breadcrumb · Segmented control</h3>
      <div style="display:flex;gap:32px;flex-wrap:wrap;align-items:center">
        <nav aria-label="Breadcrumb"><ol class="cr-breadcrumb">
          <li class="cr-breadcrumb__item"><a class="cr-breadcrumb__link" href="#">control room</a></li>
          <li class="cr-breadcrumb__item"><a class="cr-breadcrumb__link" href="#">sessions</a></li>
          <li class="cr-breadcrumb__item" aria-current="page">cr-1130</li>
        </ol></nav>
        <div class="cr-segmented" role="radiogroup" aria-label="Scope">
          <button type="button" role="radio" class="cr-segmented__opt" data-value="all" aria-checked="true" tabindex="0">all</button>
          <button type="button" role="radio" class="cr-segmented__opt" data-value="mine" aria-checked="false" tabindex="-1">mine</button>
          <button type="button" role="radio" class="cr-segmented__opt" data-value="failing" aria-checked="false" tabindex="-1">failing</button>
        </div>
      </div>
      <h3 style="margin-top:16px">Combobox · Number field</h3>
      <div style="display:flex;gap:32px;flex-wrap:wrap;align-items:flex-start">
        <div class="cr-combobox" style="min-width:220px">
          <input class="cr-combobox__input" type="text" role="combobox" aria-expanded="true" aria-controls="g-combo" aria-activedescendant="g-co-1" aria-autocomplete="list" aria-label="Jump to worker" value="nova" />
          <ul class="cr-combobox__list" id="g-combo" role="listbox">
            <li class="cr-combobox__opt" id="g-co-0" role="option" aria-selected="false">nova-01</li>
            <li class="cr-combobox__opt cr-combobox__opt--active" id="g-co-1" role="option" aria-selected="true">nova-02</li>
          </ul>
        </div>
        <div class="cr-numberfield">
          <button type="button" class="cr-numberfield__btn" aria-label="Decrease">−</button>
          <input type="number" class="cr-numberfield__input" value="6" aria-label="Max retries" />
          <button type="button" class="cr-numberfield__btn" aria-label="Increase">+</button>
        </div>
      </div>
      <h3 style="margin-top:16px">ASCII separators &amp; lists</h3>
      <div style="max-width:340px">
        <p class="cr-sep-label">recent events</p>
        <ul class="cr-list cr-list--tick">
          <li class="cr-list__item">12:03 stream opened</li>
          <li class="cr-list__item">12:41 SSE closed · retry 3/5</li>
        </ul>
        <hr class="cr-sep" />
        <div class="cr-leader"><span class="cr-leader__k">uptime</span><span class="cr-leader__fill"></span><span class="cr-leader__v">41h 12m</span></div>
        <div class="cr-leader"><span class="cr-leader__k">region</span><span class="cr-leader__fill"></span><span class="cr-leader__v">eu-west-1</span></div>
      </div>
      <h3 style="margin-top:16px">ASCII rules · meters · spinner · empty state</h3>
      <div style="max-width:360px;display:flex;flex-direction:column;gap:12px">
        <div class="cr-rule" aria-hidden="true"></div>
        <div class="cr-rule cr-rule--hatch" aria-hidden="true"></div>
        <div class="cr-rule cr-rule--dot" aria-hidden="true"></div>
        <div class="cr-leader"><span class="cr-leader__k">index</span><span class="cr-leader__fill"></span><span class="cr-ascii-bar" style="--v:0.65"><span class="cr-ascii-bar__fill"></span></span></div>
        <div style="font-family:var(--font-mono);font-size:13px;color:var(--muted)"><span class="cr-ascii-spin" aria-hidden="true"></span> syncing worker pool…</div>
        <div class="cr-panel cr-panel--inset cr-empty" style="text-align:center;padding:24px">
          <p style="font-family:var(--font-mono);font-size:13px;color:var(--muted);margin:0">No sessions in this region yet.</p>
        </div>
      </div>
      <h3 style="margin-top:16px">Motion — glitch · attention · interaction · 3D break</h3>
      <p class="note" style="margin-bottom:10px">Hover the glitch title and the 3D card. The <code>--auto</code> tags glitch on their own, one at a time, in brief random bursts. All motion honors reduced-motion and the <code>calm</code> intensity profile.</p>
      <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start">
        <div>
          <div class="cr-glitch" data-text="BREACH DETECTED" style="font-family:var(--font-display);font-weight:900;font-size:28px;text-transform:uppercase;letter-spacing:-.02em;color:var(--ink)">BREACH DETECTED</div>
          <p class="note" style="margin-top:6px">glitch · hover (or <code>--on</code> for alerts)</p>
        </div>
        <div>
          <div class="cr-glitch cr-glitch--chroma cr-glitch-auto" data-text="SIGNAL LOST" style="font-family:var(--font-display);font-weight:900;font-size:22px;text-transform:uppercase;letter-spacing:-.02em;color:var(--ink)">SIGNAL LOST</div>
          <p class="note" style="margin-top:6px">chroma fringe · random auto-burst</p>
        </div>
        <div>
          <button class="cr-btn cr-btn--sig-accent cr-attention" type="button" style="--cr-attn:var(--sig-accent)">nova needs you</button>
          <p class="note" style="margin-top:6px">idle attention pulse on a primary action</p>
        </div>
        <div style="min-width:180px">
          <a href="#" class="cr-keyed cr-nav__item" style="display:block;padding:8px 10px;font-family:var(--font-mono);font-size:13px;color:var(--ink);text-decoration:none;border:var(--brd) solid var(--border)">hover: keyed edge</a>
          <p class="note" style="margin-top:6px">interaction · keyed sweep</p>
        </div>
        <div>
          <div class="cr-panel cr-tilt" style="padding:16px;min-width:150px">
            <div style="font-family:var(--font-display);font-weight:900;font-size:20px;text-transform:uppercase">CR-01</div>
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--muted)">3D tilt · hover</div>
          </div>
          <p class="note" style="margin-top:6px">sanctioned 3D break of the flat plane</p>
        </div>
      </div>
      <h3 style="margin-top:16px">Cursed text — T3 decay (Law 3)</h3>
      <p class="note" style="margin-bottom:10px">Zalgo combining marks, capped at 2 per glyph. The clean string owns the <code>aria-label</code>; the corrupted glyphs are <code>aria-hidden</code>. Corruption density follows <code>--decoration-intensity</code> and is seeded — same seed, same decay.</p>
      <div style="display:flex;gap:28px;flex-wrap:wrap;align-items:center;font-family:var(--font-display);font-weight:900;text-transform:uppercase;letter-spacing:-.01em">
        <span class="cr-cursed" data-seed="corrupt" style="font-size:26px">CORRUPTED</span>
        <span class="cr-cursed" data-seed="decay" style="font-size:26px">CHECKSUM FAIL</span>
        <span class="cr-cursed cr-glitch-auto cr-glitch" data-text="DAEMON" data-seed="daemon" style="font-size:26px">DAEMON</span>
      </div>
      <h3 style="margin-top:16px">Tree · Hover card</h3>
      <div style="display:flex;gap:32px;flex-wrap:wrap;align-items:flex-start">
        <ul class="cr-tree" role="tree" aria-label="Fleet" style="min-width:220px">
          <li class="cr-tree__item" role="treeitem" data-id="nova" aria-level="1" aria-expanded="true" aria-selected="false" tabindex="0" style="padding-left:calc(0 * var(--space-4) + var(--space-2))"><span class="cr-tree__twist" aria-hidden="true"></span><span>nova (pool)</span></li>
          <li class="cr-tree__item" role="treeitem" data-id="nova-01" aria-level="2" aria-selected="false" tabindex="-1" style="padding-left:calc(1 * var(--space-4) + var(--space-2))"><span class="cr-tree__lead" aria-hidden="true">·</span><span>nova-01 · streaming</span></li>
          <li class="cr-tree__item" role="treeitem" data-id="nova-02" aria-level="2" aria-selected="true" tabindex="-1" style="padding-left:calc(1 * var(--space-4) + var(--space-2))"><span class="cr-tree__lead" aria-hidden="true">·</span><span>nova-02 · idle</span></li>
          <li class="cr-tree__item" role="treeitem" data-id="ail" aria-level="1" aria-expanded="false" aria-selected="false" tabindex="-1" style="padding-left:calc(0 * var(--space-4) + var(--space-2))"><span class="cr-tree__twist" aria-hidden="true"></span><span>ail (pool)</span></li>
        </ul>
        <span class="cr-hovercard">
          <span class="cr-hovercard__trigger" tabindex="0">health</span>
          <span class="cr-hovercard__panel" role="group" aria-label="Fleet health" style="opacity:1;visibility:visible;position:static;box-shadow:var(--shadow-off) var(--shadow-off) 0 var(--shadow-col)">
            <dl class="cr-dl"><dt class="cr-dl__k">workers</dt><dd class="cr-dl__v">4 online</dd><dt class="cr-dl__k">error rate</dt><dd class="cr-dl__v">1.2%</dd></dl>
          </span>
        </span>
      </div>
      <h3 style="margin-top:16px">Cron field (cronstrue) · Date-time</h3>
      <div style="display:flex;gap:32px;flex-wrap:wrap;align-items:flex-start">
        <div class="cr-cron" style="max-width:280px">
          <input class="cr-cron__input" type="text" value="0 9 * * 1-5" aria-label="Cron expression" />
          <div class="cr-cron__presets">
            <button type="button" class="cr-cron__preset">hourly</button>
            <button type="button" class="cr-cron__preset">nightly 2am</button>
          </div>
          <p class="cr-cron__out">At 09:00 AM, Monday through Friday</p>
        </div>
        <input type="datetime-local" class="cr-datetime" value="2026-08-04T02:00" aria-label="First run" />
      </div>
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
      <h3 style="margin-top:18px">Schema-driven form — validation from ArkType / JSON Schema</h3>
      <p class="note" style="margin-bottom:10px">One schema (an ArkType type <em>or</em> a JSON Schema) drives the fields, coercion, and validation — errors are derived, never hand-set. Required fields mark with <span style="color:var(--sig-err)">*</span>; an error sets aria-invalid + links the message. The interactive, editable playground lives in the <a href="./components.html#c-form">component browser</a>.</p>
      <form class="cr-form" style="max-width:440px" novalidate onsubmit="return false">
        <h3 class="cr-form__title">New session</h3>
        <div class="cr-field">
          <label class="cr-field__label" for="f-name">Session name<span class="cr-field__req" aria-hidden="true"> *</span></label>
          <input id="f-name" name="name" class="cr-input" value="nova-01" aria-required="true" />
          <span class="cr-field__hint" id="f-name-hint">lowercase, no spaces</span>
        </div>
        <div class="cr-field cr-field--error">
          <label class="cr-field__label" for="f-ep">Endpoint URL<span class="cr-field__req" aria-hidden="true"> *</span></label>
          <input id="f-ep" name="endpoint" class="cr-input" value="nope" aria-required="true" aria-invalid="true" aria-describedby="f-ep-err" />
          <span class="cr-field__error" id="f-ep-err" role="alert">Endpoint must be a URL (was "nope")</span>
        </div>
        <div class="cr-field">
          <label class="cr-field__label" for="f-reg">Region<span class="cr-field__req" aria-hidden="true"> *</span></label>
          <select id="f-reg" name="region" class="cr-select" aria-required="true"><option value="">Select…</option><option value="eu-west" selected>Eu west</option><option value="us-east">Us east</option><option value="ap-south">Ap south</option></select>
        </div>
        <div class="cr-field">
          <label class="cr-check"><input type="checkbox" name="autoscale" checked /> Auto-scale on demand</label>
        </div>
        <div class="cr-form__actions"><button type="submit" class="cr-btn">Create session</button></div>
      </form>
    </div>
    <div style="grid-column:1/-1">
      <h3>Severity shapes — sides ∝ 1/danger (a channel beside colour)</h3>
      <div style="display:flex;gap:22px;flex-wrap:wrap;align-items:flex-end;font-family:var(--font-mono);font-size:10px;color:var(--muted)">
        <span style="display:flex;flex-direction:column;gap:6px;align-items:center"><span class="cr-sev cr-sev--crit" role="img" aria-label="critical"></span>crit · ▲3</span>
        <span style="display:flex;flex-direction:column;gap:6px;align-items:center"><span class="cr-sev cr-sev--warn" role="img" aria-label="warning"></span>warn · ◆4</span>
        <span style="display:flex;flex-direction:column;gap:6px;align-items:center"><span class="cr-sev cr-sev--work" role="img" aria-label="working"></span>work · ⬠5</span>
        <span style="display:flex;flex-direction:column;gap:6px;align-items:center"><span class="cr-sev cr-sev--ok" role="img" aria-label="nominal"></span>ok · ⬡6</span>
        <span style="display:flex;flex-direction:column;gap:6px;align-items:center"><span class="cr-sev cr-sev--idle" role="img" aria-label="idle"></span>idle · ●∞</span>
        <span style="color:var(--muted);max-width:34ch;line-height:1.5">Shape reads the severity even with no colour — survives the phosphor CRT and colour-blindness.</span>
      </div>
      <h3 style="margin-top:18px">Hardware chrome — kit + seeded strips (same seed → same strip)</h3>
      <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;background:var(--panel-2);border:2px solid var(--border);padding:12px">
        <i class="cr-rivet" aria-hidden="true"></i>
        <i class="cr-rivet cr-rivet--hex" aria-hidden="true"></i>
        <i class="cr-rivet cr-rivet--slot" aria-hidden="true"></i>
        <i class="cr-screw" aria-hidden="true"></i>
        <i class="cr-screw cr-screw--x" aria-hidden="true"></i>
        <i class="cr-bolt" aria-hidden="true"></i>
        <i class="cr-led" aria-hidden="true"></i>
        <i class="cr-led cr-led--wait" aria-hidden="true"></i>
        <i class="cr-led cr-led--err" aria-hidden="true"></i>
        <i class="cr-vent" aria-hidden="true"></i>
        <i class="cr-grille" aria-hidden="true"></i>
        <i class="cr-port" aria-hidden="true"></i>
        <span class="cr-stripe" style="width:64px" aria-hidden="true"></span>
        <span class="cr-tally">▐▐▐ ▌</span>
        <span class="cr-plate">UNIT · CR-00 · REV.C</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">
        <canvas class="crchrome" width="440" height="26" data-seed="cr-00"></canvas>
        <canvas class="crchrome" width="440" height="26" data-seed="nova-rack"></canvas>
        <canvas class="crchrome" width="440" height="26" data-seed="rp-verify-07"></canvas>
      </div>
      <h3 style="margin-top:18px">Texture — beyond dots: crosshatch (×) &amp; duotone (cross-colours)</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;font-family:var(--font-mono);font-size:10px;color:var(--muted)">
        <div class="cr-panel cr-panel--inset cr-tex--halftone" style="min-height:52px;padding:8px">halftone · dots</div>
        <div class="cr-panel cr-panel--inset cr-tex--cross" style="min-height:52px;padding:8px">crosshatch · ×</div>
        <div class="cr-panel cr-panel--inset cr-tex--duo" style="min-height:52px;padding:8px">duotone · cross-colours</div>
        <div class="cr-panel cr-panel--inset cr-tex--scan" style="min-height:52px;padding:8px">scanlines</div>
      </div>
    </div>
    <div style="grid-column:1/-1">
      <h3>Decoration — ASCII/pixel in dead space (seeded · aria-hidden · whisper)</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
        <div class="cr-panel cr-panel--inset" style="position:relative;height:120px;overflow:hidden">
          <div class="cr-ascii cr-ascii--mask-edge" aria-hidden="true"><canvas class="crascii" width="260" height="120" data-seed="nova" data-variant="braille"></canvas></div>
          <span style="position:relative;z-index:1;font-family:var(--font-mono);font-size:10px;color:var(--muted)">braille field</span>
        </div>
        <div class="cr-panel cr-panel--inset" style="position:relative;height:120px;overflow:hidden">
          <div class="cr-ascii cr-ascii--mask-edge" aria-hidden="true"><canvas class="crascii" width="260" height="120" data-seed="atlas" data-variant="block"></canvas></div>
          <span style="position:relative;z-index:1;font-family:var(--font-mono);font-size:10px;color:var(--muted)">block field ░▒▓</span>
        </div>
        <div class="cr-panel cr-panel--inset" style="position:relative;height:120px;overflow:hidden">
          <div class="cr-ascii cr-ascii--mask-edge" aria-hidden="true"><canvas class="crascii" width="260" height="120" data-seed="rhea" data-variant="ramp"></canvas></div>
          <span style="position:relative;z-index:1;font-family:var(--font-mono);font-size:10px;color:var(--muted)">ascii ramp</span>
        </div>
      </div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center;margin-top:12px">
        <div class="cr-panel cr-trim cr-trim--4" style="padding:16px 20px;font-family:var(--font-mono);font-size:11px;color:var(--muted)">telemetry frame trim · 4 corners</div>
        <span class="cr-telemetry">SEED A3F9 · 0x2E · 18ms ▮▮▮▮▯</span>
      </div>
      <div class="cr-ruler" style="margin-top:12px" aria-hidden="true"></div>
      <div class="cr-panel cr-bg--field" style="margin-top:12px;padding:14px;font-family:var(--font-mono);font-size:11px;color:var(--muted)">background drafting field — a whisper block-shade grid behind dead space</div>
      <div style="margin-top:12px;border:2px dashed var(--line-soft, var(--border));position:relative;height:110px;display:flex;align-items:center;justify-content:center;overflow:hidden">
        <div class="cr-ascii cr-ascii--mask-edge" aria-hidden="true"><canvas class="crascii" width="360" height="110" data-seed="empty" data-variant="braille"></canvas></div>
        <span style="position:relative;z-index:1;font-family:var(--font-mono);font-size:12px;color:var(--muted);letter-spacing:.12em">░ NO SIGNAL ░</span>
      </div>
    </div>
    <div style="grid-column:1/-1">
      <h3>The Breach (Law 9) — one sanctioned rule-break per screen</h3>
      <div style="display:flex;gap:26px;flex-wrap:wrap;align-items:center;padding:16px 4px">
        <div class="cr-breach cr-breach--wash cr-breach--alive" style="max-width:340px;padding:20px;background-color:var(--panel)">
          <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--sig-accent)">Milestone</div>
          <div style="font-family:var(--font-display);font-weight:900;font-size:30px;text-transform:uppercase;letter-spacing:-.03em;line-height:.88;margin-top:6px;color:var(--ink)">Sprint shipped</div>
          <div style="font-family:var(--font-mono);font-size:12px;color:var(--muted);margin-top:8px">14 sessions · 0 failing · on time</div>
        </div>
        <span class="cr-blob" aria-hidden="true"></span>
        <span class="cr-blob cr-breach--done" aria-hidden="true"></span>
        <p style="font-family:var(--font-mono);font-size:11px;color:var(--muted);max-width:30ch;line-height:1.65">Soft corner · gradient wash · blurred blob · colour glow — every one forbidden elsewhere. It reads <em>because</em> everything around it is hard-edged. One per screen, never two.</p>
      </div>
    </div>
    <div style="grid-column:1/-1">
      <h3>Overlays — Modal · Toast · Tooltip</h3>
      <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));align-items:start">
        <div>
          <div style="font-family:var(--font-mono);font-size:12px;color:var(--muted);margin-bottom:8px">Modal (native &lt;dialog&gt;, shown open)</div>
          <dialog class="cr-modal" open style="position:static;margin:0">
            <div class="cr-modal__head">
              <h2 class="cr-modal__title">Kill session?</h2>
              <button type="button" class="cr-modal__close" aria-label="Close">✕</button>
            </div>
            <div class="cr-modal__body">CR-1130 is streaming. Terminating drops the turn and cannot be undone.</div>
          </dialog>
        </div>
        <div>
          <div style="font-family:var(--font-mono);font-size:12px;color:var(--muted);margin-bottom:8px">Toasts (keyed to signal)</div>
          <div style="display:grid;gap:8px">
            <div class="cr-toast" role="status"><span class="cr-toast__msg">Scan started</span><button type="button" class="cr-toast__close" aria-label="Dismiss">✕</button></div>
            <div class="cr-toast cr-toast--done" role="status"><span class="cr-toast__msg">3 sessions cleared</span><button type="button" class="cr-toast__close" aria-label="Dismiss">✕</button></div>
            <div class="cr-toast cr-toast--wait" role="status"><span class="cr-toast__msg">Waiting on CR-1130</span><button type="button" class="cr-toast__close" aria-label="Dismiss">✕</button></div>
            <div class="cr-toast cr-toast--err" role="alert"><span class="cr-toast__msg">Endpoint unreachable</span><button type="button" class="cr-toast__close" aria-label="Dismiss">✕</button></div>
          </div>
        </div>
        <div>
          <div style="font-family:var(--font-mono);font-size:12px;color:var(--muted);margin-bottom:8px">Tooltip (hover / focus the term)</div>
          <p style="font-family:var(--font-mono);font-size:13px;color:var(--ink);line-height:1.7">
            The session is
            <span class="cr-tooltip"><span class="cr-tooltip__trigger" tabindex="0" aria-describedby="tt-drift">drifting</span><span class="cr-tooltip__bubble" role="tooltip" id="tt-drift">latency &gt; SLA for 3 consecutive turns</span></span>
            and needs a look.
          </p>
        </div>
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
<script>${browserScript}</script>
</body>
</html>
`;

mkdirSync(join(ROOT, "public"), { recursive: true });
writeFileSync(join(ROOT, "public", "gallery.html"), html);
console.log(`wrote public/gallery.html  (${html.length} bytes, consumes styles/components.css)`);
