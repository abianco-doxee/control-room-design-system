/**
 * Signal tone — re-voice the state ramp without breaking its meaning.
 *
 * The signal roles are a *state channel*: `--sig-err` means failing, `--sig-done`
 * means merged. A brand may want that channel louder or quieter than the neon
 * default, but it must keep the hue families (red stays red, green stays green) or
 * the semantics break. `toneSignals` scales **chroma** (and, for pastel, lifts
 * **lightness**) in OKLCH while holding hue — so "muted" and "pastel" are the same
 * states in a calmer voice.
 *
 * Build-time only (uses culori); brands opt in with `$signalTone` (see
 * build-theme.mjs and references/theming.md). Explicitly-set signal roles are left
 * alone — the brand meant those exactly.
 */
import { oklch, formatHex, clampChroma } from "culori";
import { THEME_ROLES } from "../lib/theme/index.js";

/** The signal role keys (bare, no leading --), from the contract. */
export const SIGNAL_KEYS = THEME_ROLES.filter((r) => r.group === "signal").map((r) => r.cssVar.replace(/^--/, ""));

const TONES = {
  neon: { cMul: 1, lAdd: 0, lMin: 0 }, // the loud default (identity)
  muted: { cMul: 0.55, lAdd: 0, lMin: 0 }, // desaturated, still distinct
  pastel: { cMul: 0.45, lAdd: 0.08, lMin: 0.8 }, // soft + light
};

export const SIGNAL_TONES = Object.keys(TONES);

/**
 * Return adjusted values for the signal roles in `vars`, toned per `tone`.
 * Skips roles in `skip` (a Set of bare keys the author set by hand) and returns
 * `{}` for the neon/identity tone. Hue is always preserved.
 */
export function toneSignals(vars, tone = "neon", skip = new Set()) {
  const t = TONES[tone];
  if (!t || tone === "neon") return {};
  const out = {};
  for (const k of SIGNAL_KEYS) {
    if (skip.has(k) || !vars[k]) continue;
    const col = oklch(vars[k]);
    if (!col) continue;
    let l = (col.l ?? 0) + t.lAdd;
    if (t.lMin) l = Math.max(l, t.lMin);
    l = Math.min(l, 0.98);
    const c = (col.c ?? 0) * t.cMul;
    out[k] = formatHex(clampChroma({ mode: "oklch", l, c, h: col.h || 0 }, "oklch"));
  }
  return out;
}
