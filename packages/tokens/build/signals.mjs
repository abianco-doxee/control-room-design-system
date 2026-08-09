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

import { contrastRatio, THEME_ROLES } from "@control-room/utils/theme";
import { clampChroma, formatHex, oklch } from "culori";

/** The signal role keys (bare, no leading --), from the contract. */
export const SIGNAL_KEYS = THEME_ROLES.filter((r) => r.group === "signal").map((r) =>
  r.cssVar.replace(/^--/, "")
);

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

/**
 * Nudge signal **lightness** (hue + chroma held) until each clears a minimum
 * contrast against a reference surface — the fix for inheriting a dark-tuned neon
 * ramp onto light surfaces (or vice versa), where a bright signal vanishes on a
 * near-white panel. Only touches signals that fall short; picks the L closest to
 * the original that meets `min`, else the L with the most contrast.
 *
 * `opts.against` — surface role to be legible on (default "panel");
 * `opts.min` — target ratio (default 3, the non-text UI-component floor);
 * `opts.skip` — Set of hand-set keys to leave alone.
 */
export function fitSignals(vars, opts = {}) {
  const against = vars[opts.against || "panel"];
  const min = opts.min || 3;
  const skip = opts.skip || new Set();
  const out = {};
  if (!against) return out;
  for (const k of SIGNAL_KEYS) {
    if (skip.has(k) || !vars[k]) continue;
    if ((contrastRatio(vars[k], against) || 0) >= min) continue; // already legible
    const col = oklch(vars[k]);
    if (!col) continue;
    const origL = col.l ?? 0;
    let best = null,
      bestC = -1,
      chosen = null,
      chosenDelta = Infinity;
    for (let l = 0.12; l <= 0.96; l += 0.02) {
      const hex = formatHex(
        clampChroma({ mode: "oklch", l, c: col.c || 0, h: col.h || 0 }, "oklch")
      );
      const c = contrastRatio(hex, against) || 0;
      if (c > bestC) {
        bestC = c;
        best = hex;
      }
      if (c >= min) {
        const d = Math.abs(l - origL);
        if (d < chosenDelta) {
          chosenDelta = d;
          chosen = hex;
        }
      }
    }
    out[k] = chosen || best;
  }
  return out;
}
