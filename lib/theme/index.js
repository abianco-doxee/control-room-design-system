/**
 * Control Room — theme / brand core.
 *
 * The design system draws a hard line between **feature** and **appearance**:
 *
 *   - the *feature* layer (structure) — spacing, borders, shadows, typography,
 *     motion and per-component tokens — is brand-agnostic. It ships once
 *     (dist/structure.css) and never changes with the brand.
 *   - the *appearance* layer (a **theme**) is nothing but a set of values for the
 *     semantic **roles** (surfaces, text, lines, signals, keyed floods, textures).
 *     Swapping the appearance == swapping one theme file. Components only ever
 *     reference the roles, never a colour, so they inherit any theme unchanged.
 *
 * This module is the framework-agnostic core for authoring, validating and
 * emitting themes. It has no fs / DOM dependency at import time (applyTheme is the
 * one browser-only helper, guarded). The token build (build/build-tokens.mjs) and
 * the brand build (build/build-theme.mjs) both render through `themeCss` here, so
 * built-in themes and external brands are produced by exactly one code path.
 *
 * `THEME_ROLES` is the runtime copy of the theme contract. A node test
 * (tests/theme.test.mjs) asserts it stays identical to tokens.json's semantic tier
 * and to the generated dist/theme-contract.json, so the three can never drift.
 * See references/theming.md.
 */

/** The theme contract: every semantic role a complete theme must define, grouped.
 *  `cssVar` is the custom property a component reads; `role` is what it means. */
export const THEME_ROLES = [
  // surfaces — back-to-front
  { cssVar: "--ground", group: "surface", role: "page background, furthest back" },
  { cssVar: "--board", group: "surface", role: "instrument / work surface" },
  { cssVar: "--panel", group: "surface", role: "raised card / panel" },
  { cssVar: "--panel-2", group: "surface", role: "recessed / inset region" },
  { cssVar: "--rail", group: "surface", role: "navigation rail background" },
  // text / on-colours
  { cssVar: "--ink", group: "text", role: "primary text" },
  { cssVar: "--muted", group: "text", role: "secondary / label text" },
  { cssVar: "--rail-ink", group: "text", role: "text on the rail" },
  { cssVar: "--on-sig", group: "text", role: "text/icon on a signal fill" },
  { cssVar: "--on-err", group: "text", role: "text/icon on an error fill" },
  { cssVar: "--on-accent", group: "text", role: "text/icon on an accent fill" },
  { cssVar: "--on-accent-2", group: "text", role: "text on the second accent" },
  { cssVar: "--on-idle", group: "text", role: "text/icon on an idle fill" },
  // lines / mass
  { cssVar: "--border", group: "line", role: "contour / outline (near-black)" },
  { cssVar: "--mass", group: "line", role: "black as a large fill area" },
  { cssVar: "--shadow-col", group: "line", role: "hard offset shadow colour" },
  // signal ramp (state channel)
  { cssVar: "--sig-work", group: "signal", role: "working (also default focus)" },
  { cssVar: "--sig-wait", group: "signal", role: "waiting / needs input" },
  { cssVar: "--sig-done", group: "signal", role: "done / merged" },
  { cssVar: "--sig-err", group: "signal", role: "error / failing" },
  { cssVar: "--sig-idle", group: "signal", role: "idle" },
  { cssVar: "--sig-accent", group: "signal", role: "attention / primary action" },
  { cssVar: "--sig-accent-2", group: "signal", role: "secondary action key" },
  // keyed floods
  { cssVar: "--stage", group: "keyed", role: "calm/nominal keyed stage flood" },
  { cssVar: "--stage-ink", group: "keyed", role: "text on the stage flood" },
  { cssVar: "--drip", group: "keyed", role: "house glitch / decay hue" },
  // textures (hardware-only decorative layers)
  { cssVar: "--halftone", group: "texture", role: "hardware texture (bezel only)" },
  { cssVar: "--dither", group: "texture", role: "ordered 1-bit dither" },
  { cssVar: "--scanline", group: "texture", role: "CRT scanlines" },
  { cssVar: "--crosshatch", group: "texture", role: "±45° cross-hatch" },
  { cssVar: "--field", group: "texture", role: "whisper drafting field for dead space" },
];

/** Chassis structural vars a theme/brand MAY override — the *shape* of the system,
 *  distinct from its colour. Optional: absence inherits the structure layer.
 *  `--radius` rounds the rectangular surfaces (default 0); the border and shadow
 *  scales set line weight and the hard-offset depth; focus + row-height tune the
 *  interaction feel. (Circles, decorative shapes and the breach keep their own.) */
export const CHASSIS_OVERRIDABLE = [
  "--radius",
  "--brd-hair",
  "--brd",
  "--brd-heavy",
  "--brd-brush",
  "--shadow-off-sm",
  "--shadow-off",
  "--shadow-off-lg",
  "--focus-w",
  "--focus-offset",
  "--row-h",
];

/** Type vars a brand MAY override — font families and the display/label character
 *  (the last non-colour identity axis). The base sizes stay in the structure layer
 *  (they carry layout/density, not brand). A brand supplying a custom font family
 *  must load that font itself; the value is just a font stack. */
export const TYPE_OVERRIDABLE = [
  "--font-sans",
  "--font-display",
  "--font-mono",
  "--type-display-weight",
  "--type-display-tracking",
  "--type-display-leading",
  "--type-display-transform",
  "--type-label-tracking",
  "--type-label-transform",
];

const roleKey = (cssVar) => cssVar.replace(/^--/, "");
const REQUIRED = THEME_ROLES.map((r) => roleKey(r.cssVar));
const REQUIRED_SET = new Set(REQUIRED);
const CHASSIS_SET = new Set(CHASSIS_OVERRIDABLE.map(roleKey));
const TYPE_SET = new Set(TYPE_OVERRIDABLE.map(roleKey));
/** Everything a theme may set beyond the colour roles: chassis + type. */
const STRUCTURAL_SET = new Set([...CHASSIS_SET, ...TYPE_SET]);

/** Normalise a brand's keys to bare names (accepts `--ground` or `ground`). */
function normalizeVars(vars) {
  const out = {};
  for (const [k, v] of Object.entries(vars || {})) {
    if (k.startsWith("$")) continue; // metadata ($extends, $label, …) ignored here
    out[roleKey(k)] = v;
  }
  return out;
}

/**
 * Validate a theme's values against the contract.
 * Returns `{ valid, missing, unknown }`:
 *  - `missing` — required roles the theme doesn't define (→ invalid);
 *  - `unknown` — keys that are neither a role nor a chassis override (allowed as
 *    brand extension vars, so they only warn — they don't make a theme invalid).
 */
export function validateTheme(vars) {
  const v = normalizeVars(vars);
  const keys = new Set(Object.keys(v));
  const missing = REQUIRED.filter((k) => !keys.has(k));
  const unknown = Object.keys(v).filter((k) => !REQUIRED_SET.has(k) && !STRUCTURAL_SET.has(k));
  return { valid: missing.length === 0, missing, unknown };
}

/**
 * Merge brand `overrides` onto a `base` theme's values — the `extends` path.
 * A brand then only needs to state what differs from the theme it builds on.
 */
export function mergeTheme(base, overrides) {
  return { ...normalizeVars(base), ...normalizeVars(overrides) };
}

/** Split a value map into semantic-role vars, structural vars (chassis + type),
 *  and any extra brand-extension vars. */
function partition(vars) {
  const v = normalizeVars(vars);
  const roles = {};
  const structural = {};
  const extra = {};
  for (const [k, val] of Object.entries(v)) {
    if (REQUIRED_SET.has(k)) roles[k] = val;
    else if (STRUCTURAL_SET.has(k)) structural[k] = val;
    else extra[k] = val;
  }
  return { roles, structural, extra };
}

/**
 * Render a theme to a scoped CSS block (a string). Pure — no I/O.
 * `opts.selector` defaults to `:root[data-theme="<name>"]`; pass your own to scope
 * differently (e.g. the default theme uses `:root, :root[data-theme="dark"]`).
 * `opts.scheme` sets `color-scheme` (light|dark). Structural (chassis + type)
 * overrides and any extra brand vars are emitted alongside the role values.
 */
export function themeCss(name, vars, opts = {}) {
  const selector = opts.selector || `:root[data-theme="${name}"]`;
  const scheme = opts.scheme || "dark";
  const { roles, structural, extra } = partition(vars);
  const line = ([k, val]) => `  --${k}: ${val};`;
  const body = [
    ...Object.entries(roles).map(line),
    ...Object.entries(structural).map(line),
    ...Object.entries(extra).map(line),
  ].join("\n");
  return `${selector} {\n  color-scheme: ${scheme};\n${body}\n}\n`;
}

/**
 * Runtime theming (browser): inject/replace a <style> holding a theme block and
 * (unless `opts.activate === false`) set `<html data-theme="name">` so it applies.
 * Returns the name. No-op with a thrown error outside a DOM.
 */
export function applyTheme(vars, opts = {}) {
  if (typeof document === "undefined") throw new Error("applyTheme requires a DOM (browser)");
  const name = opts.name || "brand";
  const css = themeCss(name, vars, opts);
  const id = opts.styleId || `cr-theme-${name}`;
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = css;
  if (opts.activate !== false) document.documentElement.setAttribute("data-theme", name);
  return name;
}

/* ─────────────────────────── contrast checking ─────────────────────────── */

function parseColor(c) {
  if (typeof c !== "string") return null;
  const s = c.trim();
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3)
      h = h
        .split("")
        .map((x) => x + x)
        .join("");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const rgb = s.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const parts = rgb[1]
      .split(/[,/]/)
      .slice(0, 3)
      .map((p) => parseFloat(p));
    if (parts.some((n) => Number.isNaN(n))) return null;
    return parts.map((n) => (n <= 1 && !Number.isInteger(n) ? Math.round(n * 255) : n));
  }
  return null; // gradients, color-mix, named — not a flat colour we can score
}

function relLuminance([r, g, b]) {
  const lin = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** WCAG contrast ratio between two colours (1..21), or null if either isn't a
 *  flat parseable colour (gradient/color-mix roles are skipped, not failed). */
export function contrastRatio(fg, bg) {
  const a = parseColor(fg);
  const b = parseColor(bg);
  if (!a || !b) return null;
  const la = relLuminance(a);
  const lb = relLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Pick the more legible ink for a given fill — the darker or lighter candidate,
 * whichever has the higher WCAG contrast. Lets a brand skip hand-tuning every
 * `--on-*` colour. Returns `light`/`dark` (defaults tuned to the system's inks) or
 * `null` if the fill isn't a flat colour.
 */
export function autoOnColor(fill, dark = "#06050c", light = "#ffffff") {
  const cd = contrastRatio(dark, fill);
  const cl = contrastRatio(light, fill);
  if (cd == null && cl == null) return null;
  return (cl || 0) > (cd || 0) ? light : dark;
}

/** Which fill each on-colour role sits on (mirrors how the components pair them). */
export const ON_PAIRS = {
  "on-sig": "sig-wait",
  "on-err": "sig-err",
  "on-accent": "sig-accent",
  "on-accent-2": "sig-accent-2",
  "on-idle": "sig-idle",
};

/**
 * Auto-pick the legible ink for every `--on-*` role the author didn't set by hand.
 * An on-colour is (re)derived when it is **missing**, or when the theme **changed
 * the fill it sits on** — so a brand that recolours `--sig-accent` gets a matching
 * `--on-accent` even if it inherited a now-stale one from its `$extends` base.
 *
 * `opts.changed` — a Set/array of role names the author explicitly provided (the
 * brand's own keys). A name in `changed` for an on-colour is treated as hand-set
 * (left alone); a fill name in `changed` forces its on-colour to re-derive.
 * `opts.dark`/`opts.light` tune the candidate inks. Returns a new value map.
 */
export function deriveOnColors(vars, opts = {}) {
  const v = normalizeVars(vars);
  const changed = new Set([...(opts.changed || [])].map((k) => String(k).replace(/^--/, "")));
  for (const [on, fill] of Object.entries(ON_PAIRS)) {
    if (changed.has(on)) continue; // author set this on-colour explicitly — leave it
    const missing = v[on] == null || v[on] === "";
    if (!missing && !changed.has(fill)) continue; // present and its fill didn't change — keep
    const chosen = autoOnColor(v[fill], opts.dark, opts.light);
    if (chosen) v[on] = chosen;
  }
  return v;
}

/** The foreground/background pairings a legible theme should satisfy. */
export const CONTRAST_PAIRS = [
  { fg: "--ink", bg: "--ground", min: 4.5, label: "body text on ground" },
  { fg: "--ink", bg: "--panel", min: 4.5, label: "text on panel" },
  { fg: "--muted", bg: "--panel", min: 3, label: "muted label on panel" },
  { fg: "--rail-ink", bg: "--rail", min: 4.5, label: "rail text on rail" },
  { fg: "--on-sig", bg: "--sig-wait", min: 3, label: "button text on wait fill" },
  { fg: "--on-err", bg: "--sig-err", min: 3, label: "text on error fill" },
  { fg: "--on-accent", bg: "--sig-accent", min: 3, label: "text on accent fill" },
  { fg: "--on-idle", bg: "--sig-idle", min: 3, label: "text on idle fill" },
  { fg: "--stage-ink", bg: "--stage", min: 3, label: "text on stage flood" },
];

/**
 * Check a theme's key text/fill pairings. Returns `{ ok, results, failures }`
 * where each result is `{ label, ratio, min, pass, skipped }`. Pairings whose
 * colours aren't flat (gradients etc.) are `skipped`, not failed.
 */
export function checkThemeContrast(vars) {
  const v = normalizeVars(vars);
  const results = CONTRAST_PAIRS.map((p) => {
    const ratio = contrastRatio(v[roleKey(p.fg)], v[roleKey(p.bg)]);
    if (ratio == null)
      return { label: p.label, ratio: null, min: p.min, pass: true, skipped: true };
    return {
      label: p.label,
      ratio: Math.round(ratio * 100) / 100,
      min: p.min,
      pass: ratio >= p.min,
      skipped: false,
    };
  });
  const failures = results.filter((r) => !r.pass);
  return { ok: failures.length === 0, results, failures };
}

/**
 * One-call brand authoring. `brand` may carry `$extends` (a base value map to
 * merge onto) plus role overrides. Returns
 * `{ name, vars, css, validation, contrast }` — throws if required roles are
 * missing (unless `opts.strict === false`).
 */
export function defineTheme(name, brand, opts = {}) {
  const base = brand && brand.$extends ? brand.$extends : opts.base || {};
  const merged = mergeTheme(base, brand);
  /* auto-pick on-* the author didn't set (and re-derive where the fill changed),
   * unless opted out, before validating */
  const changed = Object.keys(normalizeVars(brand || {}));
  const vars =
    opts.deriveOnColors === false ? merged : deriveOnColors(merged, { ...opts, changed });
  const validation = validateTheme(vars);
  if (!validation.valid && opts.strict !== false) {
    throw new Error(`Theme "${name}" is missing required roles: ${validation.missing.join(", ")}`);
  }
  const contrast = checkThemeContrast(vars);
  const css = themeCss(name, vars, opts);
  return { name, vars, css, validation, contrast };
}
