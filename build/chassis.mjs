/**
 * Chassis presets — the *shape* of a brand (rounding, line weight, shadow depth),
 * distinct from its colour. Two convenience knobs that expand to the chassis
 * tokens; a brand can also set any chassis token explicitly (those win).
 *
 *   $shape  — corner rounding: "sharp" (0, the system default) · "soft" · "round".
 *   $weight — border + hard-shadow scale: "hairline" · "regular" (default) · "heavy".
 *
 * Note on the house style: the Control Room identity is square corners (radius 0)
 * and hard, blur-free shadows. `$shape`/`$weight` let a brand relax that — it's a
 * deliberate change of character, not just a colour swap. Values are plain strings;
 * no colour maths, so this is dependency-free.
 */
export const SHAPES = {
  sharp: { radius: "0px" },
  soft: { radius: "6px" },
  round: { radius: "12px" },
};

export const WEIGHTS = {
  hairline: {
    "brd-hair": "1px", "brd": "1.5px", "brd-heavy": "2px", "brd-brush": "3px",
    "shadow-off-sm": "1px", "shadow-off": "2px", "shadow-off-lg": "3px",
  },
  regular: {}, // the system default (identity)
  heavy: {
    "brd-hair": "2px", "brd": "3px", "brd-heavy": "4px", "brd-brush": "6px",
    "shadow-off-sm": "3px", "shadow-off": "6px", "shadow-off-lg": "9px",
  },
};

export const SHAPE_NAMES = Object.keys(SHAPES);
export const WEIGHT_NAMES = Object.keys(WEIGHTS);

/** Chassis token values (bare keys, no leading --) implied by a brand's $shape /
 *  $weight presets. Returns {} when neither is set. */
export function chassisFrom(brand) {
  const out = {};
  if (brand.$shape && SHAPES[brand.$shape]) Object.assign(out, SHAPES[brand.$shape]);
  if (brand.$weight && WEIGHTS[brand.$weight]) Object.assign(out, WEIGHTS[brand.$weight]);
  return out;
}
