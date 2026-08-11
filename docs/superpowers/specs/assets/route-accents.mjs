// Route-accent hue generator for the control-room app.
//
// Route accents are WAYFINDING (which view am I in), not state. The DS signal ramp
// is STATE. If a route accent lands on a signal hue, the nav starts implying state
// it does not mean — the Law 2 failure the design system explicitly forbids.
//
// This picks N route hues that keep a guaranteed angular distance in OKLCH hue
// from every signal hue in every CHROMATIC theme, and from each other.
//
// Two notes on scope:
//   * `phosphor` is excluded from the hue constraint on purpose: it is a
//     single-hue CRT theme (all signals inside ~49°), so hue separation is
//     physically impossible there. Phosphor must separate wayfinding from state
//     by LIGHTNESS instead — see pickRouteHues' companion note.
//   * Hue distance is the second line of defence, not the first. Route accents
//     paint only `--cr-nav-accent` (the nav rail); signals paint dots/chips/
//     buttons/stage fills in the content area. The separation is structural.

const SIGNALS = [
  "--sig-work", "--sig-wait", "--sig-done", "--sig-err",
  "--sig-accent", "--sig-accent-2", "--stage",
];
// --sig-idle is deliberately absent: it is near-achromatic (C ~= 0.03), so its
// hue angle is not perceptually meaningful and would exclude a band for nothing.

const CHROMATIC_THEMES = ["dark", "light", "extreme"];

function srgbToLinear(c) {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

/** sRGB hex -> OKLCH. Returns {L, C, h} with h in degrees [0,360). */
export function hexToOklch(hex) {
  let s = hex.trim().replace(/^#/, "");
  if (s.length === 3) s = [...s].map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => srgbToLinear(parseInt(s.slice(i, i + 2), 16)));
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const t = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const cbrt = (v) => (v > 0 ? Math.cbrt(v) : -Math.cbrt(-v));
  const [l_, m_, s_] = [cbrt(l), cbrt(m), cbrt(t)];
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  return { L, C: Math.hypot(a, bb), h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 };
}

/** Shortest angular distance between two hues, in degrees. */
export function hueDistance(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Collect every signal hue across the chromatic themes.
 * @param themes {Record<string, Record<string,string>>} theme -> token -> hex
 */
export function signalHues(themes) {
  const hues = [];
  for (const t of CHROMATIC_THEMES) {
    const m = themes[t];
    if (!m) continue;
    for (const s of SIGNALS) {
      const v = m[s];
      if (typeof v === "string" && v.startsWith("#")) hues.push(hexToOklch(v).h);
    }
  }
  return hues;
}

/**
 * Pick `n` route hues maximising the minimum separation from all signal hues and
 * from each other (farthest-point insertion over a 1° grid, best seed wins).
 *
 * Returns { hues, separation } where `separation` is the guaranteed minimum
 * distance in degrees — assert on it so a future palette change fails loudly
 * instead of silently crowding a signal.
 *
 * NOTE for phosphor: do NOT use these hues there. Phosphor is monochrome by
 * design; carry wayfinding on lightness (a dim vs. bright green rail) and let
 * state keep the chroma. Any generator for it belongs in a separate function
 * with a lightness-separation assertion rather than a hue one.
 */
export function pickRouteHues(signals, n) {
  const distToSignals = (p) => Math.min(...signals.map((h) => hueDistance(p, h)));
  const grid = Array.from({ length: 360 }, (_, i) => i);

  let best = null;
  for (const seed of grid) {
    if (distToSignals(seed) < 12) continue; // hopeless seed, skip early
    const picks = [seed];
    for (let k = 1; k < n; k++) {
      let bestP = null;
      let bestV = -1;
      for (const c of grid) {
        const v = Math.min(distToSignals(c), ...picks.map((p) => hueDistance(c, p)));
        if (v > bestV) { bestV = v; bestP = c; }
      }
      picks.push(bestP);
    }
    let score = Math.min(...picks.map(distToSignals));
    for (let i = 0; i < picks.length; i++)
      for (let j = i + 1; j < picks.length; j++)
        score = Math.min(score, hueDistance(picks[i], picks[j]));
    if (!best || score > best.separation) best = { hues: [...picks].sort((a, b) => a - b), separation: score };
  }
  return best;
}
