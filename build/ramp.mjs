/**
 * OKLCH surface ramp — derive a full, coherent surface ladder from ONE base tone.
 *
 * Surfaces should read as a single material at different depths, not five
 * hand-tuned hexes. Given a base surface colour, this walks OKLCH **lightness**
 * (perceptually even — the reason we use OKLCH, not HSL) to produce
 * ground / board / panel / panel-2 / rail, keeping the base's hue and a whisper of
 * its chroma so the whole set carries the brand's tint. Direction follows the
 * scheme (dark: ground is deepest, panels lift; light: ground is bright, panel is
 * near-white). `rail` is always a deep tone (dark nav on any scheme).
 *
 * Build-time only (uses culori); brands opt in with `$ramp` (see build-theme.mjs
 * and references/theming.md). A brand can still override any individual surface.
 */
import { oklch, formatHex, clampChroma } from "culori";

// target OKLCH lightness per role, per scheme
const TARGETS = {
  dark: { ground: 0.17, board: 0.21, panel: 0.25, "panel-2": 0.30, rail: 0.13 },
  light: { ground: 0.95, board: 0.925, panel: 0.995, "panel-2": 0.965, rail: 0.17 },
};

/** Surfaces derived from `baseHex`. Returns { ground, board, panel, panel-2, rail }. */
export function surfaceRamp(baseHex, scheme = "dark") {
  const b = oklch(baseHex) || { mode: "oklch", l: 0.2, c: 0, h: 0 };
  const hue = b.h || 0;
  const tint = Math.min(b.c || 0, 0.02); // keep surfaces near-neutral, subtle tint
  const targets = TARGETS[scheme] || TARGETS.dark;
  const out = {};
  for (const [role, l] of Object.entries(targets)) {
    const chroma = role === "rail" ? Math.min(tint * 1.3, 0.03) : tint;
    out[role] = formatHex(clampChroma({ mode: "oklch", l, c: chroma, h: hue }, "oklch"));
  }
  return out;
}
