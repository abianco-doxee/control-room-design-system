/**
 * Type presets — a brand's font families (the last non-colour identity axis).
 *
 *   $fonts — { display, sans, mono } font stacks → --font-display / --font-sans /
 *            --font-mono. A brand supplying a custom family must LOAD that font
 *            itself; the value is just a CSS font stack (keep a fallback).
 *
 * The display/label *character* (weight, tracking, transform) and the base type
 * sizes are chassis-like structural tokens — set those directly (they're in
 * TYPE_OVERRIDABLE) when a brand wants a softer or louder masthead. Base sizes stay
 * in the structure layer (they carry density/layout, not brand). Dependency-free.
 */
export function typeFrom(brand) {
  const out = {};
  const f = brand.$fonts;
  if (f && typeof f === "object") {
    if (f.display) out["font-display"] = f.display;
    if (f.sans) out["font-sans"] = f.sans;
    if (f.mono) out["font-mono"] = f.mono;
  }
  return out;
}
