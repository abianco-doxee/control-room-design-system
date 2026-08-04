// OKLCH palette generator for Control Room.
//
// Colour is generated in OKLCH (perceptually uniform) so every theme's signals
// sit at a consistent *perceived* lightness/chroma instead of being eyeballed in
// sRGB. Given a compact per-theme spec (ground L/C/H + signal hues + target
// L/C), it emits gamut-mapped sRGB hex ramps AND auto-picks each fill's on-colour
// (near-black vs near-white) by WCAG contrast, reporting any pair under AA.
//
//   node build/build-palette.mjs            # write tokens/palette.generated.json + report
//   node build/build-palette.mjs --report   # report only (no write)
//
// The output is provenance + a tuning surface; theme values in tokens/tokens.json
// are updated from it (see references/tokens.md#oklch).
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { oklch, formatHex, clampChroma, wcagContrast } from "culori";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Shared signal hues (OKLCH degrees). One hue per meaning — Law 2.
const HUE = {
  work: 218, wait: 77, done: 168, err: 22, accent: 354, accent2: 128,
  idle: 285, stage: 150, violet: 300,
};

// sRGB-gamut-mapped hex from OKLCH.
const hex = (l, c, h) => formatHex(clampChroma({ mode: "oklch", l, c, h }, "oklch"));

// Per-theme spec. `sig` = default fill lightness/chroma; per-signal overrides
// tune err (darker/desaturated) and idle (grey). `ground` builds the 4 surface
// steps by stepping L at a fixed near-black hue/chroma.
// Per theme: emit `ground` (4 surface steps) when a ground block is present,
// `sig` signals when a sig block is present, and `accent2` when present. So a
// theme can regenerate grounds only, signals only, or everything.
const THEMES = {
  // Fully generated. Grounds are a LIFTED deep violet-charcoal (more lightness
  // AND more chroma than a dead near-black) so the dark theme reads as a rich
  // surface, not a void — while staying dark enough for text contrast.
  dark: {
    ground: { h: 292, c: 0.072, steps: [0.155, 0.185, 0.225, 0.265] },
    sig:    { l: 0.80, c: 0.19 },
    // accent stays a HOT magenta (low-L keeps it saturated, not pale pink)
    over:   { err: { l: 0.66, c: 0.20 }, accent: { l: 0.66, c: 0.28 }, idle: { l: 0.62, c: 0.026, h: HUE.idle } },
    accent2: {},
  },
  extreme: {
    ground: { h: 312, c: 0.09, steps: [0.15, 0.185, 0.23, 0.275] },
    sig:    { l: 0.84, c: 0.23 },
    over:   { err: { l: 0.66, c: 0.22 }, accent: { l: 0.67, c: 0.29 }, idle: { l: 0.62, c: 0.05, h: 300 } },
    accent2: {},
  },
  // Light keeps its hand-tuned signals (character + AA), but the paper is
  // regenerated COOL (violet-grey, not warm cream) to sit with the neon signals.
  light:    { ground: { h: 285, c: 0.01, steps: [0.94, 0.915, 0.99, 0.965] }, accent2: { l: 0.46, c: 0.15, h: HUE.violet } },
  phosphor: { accent2: { l: 0.82, c: 0.20, h: 165 } },
};

const NEAR_BLACK = "#06050c";
const NEAR_WHITE = "#f4f2ff";
const bestOn = (bg) => {
  const b = wcagContrast(bg, NEAR_BLACK), w = wcagContrast(bg, NEAR_WHITE);
  return b >= w ? { on: NEAR_BLACK, ratio: b } : { on: NEAR_WHITE, ratio: w };
};

const SIGNALS = ["work", "wait", "done", "err", "idle", "accent", "accent2", "stage"];
const out = {};
const report = [];

const check = (name, s, value) => {
  const { on, ratio } = bestOn(value);
  report.push(`  ${ratio < 4.5 ? "⚠" : "✓"} ${name}.${s} ${value} on ${on} = ${ratio.toFixed(2)}${ratio < 4.5 ? " (< AA 4.5)" : ""}`);
  return on;
};

const SIG_ONLY = SIGNALS.filter((s) => s !== "accent2"); // accent2 handled separately

for (const [name, spec] of Object.entries(THEMES)) {
  const t = {};
  // grounds — 4 surface steps at a fixed near-ground hue/chroma
  if (spec.ground) {
    t.grounds = {};
    const gs = ["ground", "board", "panel", "panel-2"];
    spec.ground.steps.forEach((l, i) => { t.grounds[gs[i]] = hex(l, spec.ground.c, spec.ground.h); });
  }
  // signals — the full state ramp
  if (spec.sig) {
    t.signals = t.signals || {}; t.on = t.on || {};
    for (const s of SIG_ONLY) {
      const o = spec.over?.[s] || {};
      const l = o.l ?? spec.sig.l;
      const c = o.c ?? spec.sig.c;
      const h = spec.sig.forceHue ?? o.h ?? HUE[s];
      const value = hex(l, c, h);
      t.signals[s] = value;
      t.on[s] = check(name, s, value);
    }
  }
  // second accent — explicit L/C/H, or derived from the signal spec when "full"
  if (spec.accent2) {
    t.signals = t.signals || {}; t.on = t.on || {};
    const a2 = spec.accent2;
    const l = a2.l ?? spec.sig.l;
    const c = a2.c ?? spec.sig.c;
    const h = a2.h ?? HUE.accent2;
    const value = hex(l, c, h);
    t.signals.accent2 = value;
    t.on.accent2 = check(name, "accent2", value);
  }
  out[name] = t;
}

const write = !process.argv.includes("--report");
if (write) {
  writeFileSync(join(ROOT, "tokens", "palette.generated.json"), JSON.stringify(out, null, 2) + "\n");
  console.log("wrote tokens/palette.generated.json");
}
console.log("\nOKLCH palette — contrast report (near-black #06050c / near-white #f4f2ff):");
console.log(report.join("\n"));
const fails = report.filter((r) => r.includes("⚠")).length;
console.log(`\n${fails === 0 ? "✓ all fills clear AA on their chosen on-colour" : "✗ " + fails + " under AA — retune spec"}`);
