# Theming & branding — feature ⇄ appearance

Control Room draws a hard line between what a component **is** and how it **looks**.

- The **feature layer** (structure) — spacing, borders, shadows, typography,
  motion and every per-component token — is brand-agnostic. It never changes with
  the brand.
- The **appearance layer** (a *theme*) is nothing but a set of values for the
  semantic **roles**: surfaces, text/on-colours, lines, the signal ramp, keyed
  floods and textures. Components reference *only* these roles — never a colour —
  so swapping the appearance reskins the entire system.

This isn't a convention you have to trust: a guard test
(`tests/appearance-separation.test.mjs`) fails the build if a raw brand colour
ever appears in the component layer.

## The two layers, shipped separately

| file | layer | changes with brand? |
| --- | --- | --- |
| `dist/structure.css` | feature — scales, chassis, type, motion, component tokens, baseline | no |
| `dist/themes/<name>.css` | appearance — the semantic role values for one theme | **yes — this is the only thing you swap** |
| `dist/control-room.css` | the two above, bundled (all built-in themes) | — (back-compat convenience) |

Two ways to consume:

```html
<!-- A. bundle: every built-in theme, pick with data-theme (simplest) -->
<link rel="stylesheet" href="@control-room/design-system/css" />

<!-- B. split: structure once + exactly the theme(s) you ship (leaner, brandable) -->
<link rel="stylesheet" href="@control-room/design-system/structure.css" />
<link rel="stylesheet" href="@control-room/design-system/themes/slate.css" />
```

Then select a theme on the root element:

```html
<html data-theme="slate">
```

`dark` also claims bare `:root`, so it's the default when no `data-theme` is set.

## Local scope — a theme on any container {#local-scope}

`data-theme` is **not** root-only. Every theme (and brand) selects on bare
`[data-theme="…"]`, so you can run a different theme on a **subtree** than the
page around it — a light report panel inside a dark app, a phosphor status strip,
a brand-skinned island in an otherwise-neutral shell:

```html
<html data-theme="dark">
  …dark app…
  <section data-theme="light">    <!-- this panel + everything inside it is light -->
    <div class="cr-panel">…</div>
    <button class="cr-btn cr-btn--sig-work">run</button>
  </section>
</html>
```

The nearest `[data-theme]` ancestor wins for its subtree, and `color-scheme`
flips with it (so native controls, scrollbars and form widgets match). It works
because a component's `--cr-*` tokens resolve their `var(--sig-*)`/`var(--panel)`
references **at the element where they're used** — the re-themed values on the
container cascade in automatically, with no per-component change and no JS. Nest
freely; a deeper `[data-theme]` re-scopes again. (This is also exactly how the
Component Browser puts every card under one page theme while you flip it.)

## The theme contract

`dist/theme-contract.json` (`@control-room/design-system/theme-contract`) is the
machine-readable list of every semantic role a complete theme must define — the
exact surface a brand writes to. The same list is the runtime `THEME_ROLES` in
`@control-room/design-system/theme`; a test keeps the two (and tokens.json) in
lock-step so they can't drift.

Roles by group: **surface** (`--ground` `--board` `--panel` `--panel-2` `--rail`),
**text** (`--ink` `--muted` `--rail-ink` `--on-sig` `--on-err` `--on-accent`
`--on-accent-2` `--on-idle`), **line** (`--border` `--mass` `--shadow-col`),
**signal** (`--sig-work` `--sig-wait` `--sig-done` `--sig-err` `--sig-idle`
`--sig-accent` `--sig-accent-2`), **keyed** (`--stage` `--stage-ink` `--drip`),
**texture** (`--halftone` `--dither` `--scanline` `--crosshatch` `--field`).

Signal hues are a **state channel**, not decoration — `--sig-err` *means* failing.
Keep the state semantics when you rebrand; change the hue, not the meaning.

## Authoring a brand

A brand is one file: an `$extends` base to inherit from, plus the roles you want to
change. You only state what differs.

```jsonc
// brands/acme.json
{
  "$label": "Acme",
  "$extends": "dark",          // a built-in theme name, or another brand
  "$scheme": "dark",           // color-scheme hint (light | dark)

  "ground": "#0e1116",
  "panel":  "#1b222d",
  "ink":    "#e8edf4",
  "sig-accent": "#6d7cff",     // your brand key
  "on-accent":  "#ffffff"      // text that sits on it
}
```

Build it — validated against the contract and contrast-checked, then emitted to
`dist/themes/acme.css` through the same renderer the built-in themes use:

```
npm run build:theme            # all brands/*.json
npm run build:theme acme       # just one
npm run build:theme --check    # CI: fail if any dist/themes/*.css is stale
```

Two worked examples reskin the entire component browser (try the **slate ▸** and
**porcelain ▸** switches), each touching **no** component CSS and **no** structure
token:

- `brands/slate.json` — a neutral corporate re-skin on the **dark** base, with
  hand-picked `--on-*` text colours.
- `brands/porcelain.json` — a light corporate re-skin on the **light** base that
  declares only surfaces + signal hues and lets the build **auto-derive** every
  `--on-*` (see below).

### Auto-derived on-colours

You rarely need to hand-pick the text colour that sits on each fill. Omit any
`--on-*` role and the build fills it by choosing whichever ink (near-black or
near-white) has the higher WCAG contrast on that fill. It also **re-derives** an
on-colour you inherited from an `$extends` base when your brand recolours the fill
underneath it — so an inherited `--on-accent` can't go stale after you change
`--sig-accent`. A `--on-*` you *do* set by hand is always left untouched.

```jsonc
{
  "$extends": "light",
  "sig-accent": "#4338ca"   // change the fill…
  // …omit "on-accent" — the build derives #ffffff (best contrast on #4338ca)
}
```

Programmatically it's `deriveOnColors(vars, { changed })` (and `autoOnColor(fill)`),
run automatically by `defineTheme` and `build:theme`; pass `deriveOnColors: false`
to `defineTheme` to opt out.

### Surface ramp from one tone (`$ramp`)

Surfaces should read as one material at different depths, not five hand-tuned
hexes. Give a brand `$ramp` (a single base surface tone) and the build derives the
whole ladder — `--ground`, `--board`, `--panel`, `--panel-2`, `--rail` — by walking
**OKLCH lightness** (perceptually even), keeping the tone's hue and a whisper of its
chroma so the set carries your tint. Direction follows `$scheme` (dark: ground
deepest, panels lift; light: ground bright, panel near-white); `--rail` stays a deep
tone for a dark nav on any scheme. Any surface you set explicitly still wins.

```jsonc
{
  "$extends": "dark",
  "$scheme": "dark",
  "$ramp": "#141013",        // one warm base tone → the whole surface ladder
  "sig-accent": "#ff6a3d"     // + your key; signals/on-colours inherit or derive
}
```

That's essentially the entire `brands/ember.json` — a full theme from a base tone
plus an accent. Precedence is `$extends` base < `$ramp` surfaces < explicit roles.
`$ramp` is a **build-time** authoring feature (it uses OKLCH conversion); the
generator lives in `build/ramp.mjs`.

### Structure — rounding, borders, shadows (`$shape`, `$weight`)

Branding isn't only colour. The **chassis** tokens shape the system, and a brand can
set them — either with two convenience knobs or by naming any chassis token directly:

- **`$shape`** — corner rounding: `"sharp"` (0px, the house default) · `"soft"` (6px)
  · `"round"` (12px). Rounds the rectangular surfaces (buttons, inputs, panels,
  menus, …) via `--radius`; circular indicators, decorative shapes and the breach
  keep their own radius.
- **`$weight`** — border + hard-shadow scale: `"hairline"` · `"regular"` (default) ·
  `"heavy"`. Scales `--brd-*` line weight and the `--shadow-off-*` offset depth.

Any chassis token can also be set explicitly (it wins over a preset): `--radius`,
`--brd-hair`/`--brd`/`--brd-heavy`/`--brd-brush`, `--shadow-off-sm`/`--shadow-off`/
`--shadow-off-lg`, `--focus-w`, `--focus-offset`, `--row-h` (density).

```jsonc
{
  "$extends": "light", "$ramp": "#f5f6f9",
  "$shape": "soft",       // --radius: 6px
  "$weight": "heavy",     // thicker borders + deeper hard shadows
  "row-h": "40px"          // explicit chassis override (roomier rows)
}
```

That's `brands/boardroom.json`. **House-style note:** the Control Room identity is
square corners and hard, blur-free shadows; `$shape`/`$weight` deliberately relax
that, so they change a brand's *character*, not just its palette. Chassis tokens are
optional — omit them and the brand inherits the structure layer unchanged.
Build-time; presets in `build/chassis.mjs`.

### Type — fonts & display character (`$fonts`)

The last non-colour identity axis. `$fonts` sets the three font families; the
display/label *character* (weight, tracking, transform) is set with the type tokens
directly:

```jsonc
{
  "$fonts": {
    "display": "'Helvetica Neue', Arial, sans-serif",
    "sans": "'Helvetica Neue', Arial, sans-serif",
    "mono": "'IBM Plex Mono', ui-monospace, monospace"
  },
  "type-display-transform": "none",      // mixed-case masthead instead of UPPERCASE
  "type-display-tracking": "-0.01em"
}
```

Brandable type tokens: `--font-sans`, `--font-display`, `--font-mono`,
`--type-display-weight` / `-tracking` / `-leading` / `-transform`,
`--type-label-tracking` / `-transform`. The **base sizes** stay in the structure
layer — they carry density/layout, not brand. A brand supplying a custom family
**must load that font itself** (the app bundles it); the token value is just a CSS
font stack, so always include a fallback. That's the type half of
`brands/boardroom.json`. Generator in `build/type.mjs`.

### Signal voice (`$signalTone`)

The signal roles are a **state channel** — `--sig-err` *means* failing — so a brand
must keep their hue families. `$signalTone` re-voices the inherited/derived ramp in
OKLCH by scaling **chroma** (and, for pastel, lifting lightness) while holding hue,
so the same states read louder or quieter:

- `"neon"` (default) — the loud Control Room ramp.
- `"muted"` — desaturated but still distinct (calm ops voice).
- `"pastel"` — soft and light.

```jsonc
{
  "$extends": "dark",
  "$ramp": "#0d1417",
  "$signalTone": "muted",     // work stays cyan, err stays red — just calmer
  "sig-accent": "#3aa0b0"      // explicit signals are left untouched
}
```

That's `brands/harbor.json`. Toning runs after `$extends`/`$ramp` and before
on-colour derivation (so on-colours match the re-voiced fills); a signal you set by
hand is never toned. Precedence: `$extends` < `$ramp` surfaces < toned signals <
explicit roles. Build-time; generator in `build/signals.mjs`.

### Fit signals to the surfaces (`$fitSignals`)

Reuse a dark-tuned neon ramp on light surfaces and a bright signal can vanish
against a near-white panel. `$fitSignals: true` (or a target ratio number) nudges
each signal's **lightness** (hue + chroma held) until it clears a minimum contrast
(default `3` — the non-text UI floor) against `--panel`. It only touches signals
that fall short, and never a hand-set one. Runs after toning, before on-colour
derivation.

### One brand, many modes (`$modes`)

A brand can emit **several themes from one file** — most usefully a dark + light
pair. Shared identity lives at the top level; each mode adds only what differs. The
first mode is primary (`<name>`), the rest are `<name>-<mode>`:

```jsonc
{
  "$extends": "dark", "$ramp": "#0f1420",
  "sig-accent": "#7c5cff",              // shared brand identity
  "$modes": {
    "dark":  {},                         // → dist/themes/aurora.css
    "light": {                           // → dist/themes/aurora-light.css
      "$scheme": "light", "$ramp": "#eef1f8",
      "$fitSignals": true,               // keep the shared neon signals legible on light
      "ink": "#161a26", "muted": "#5a6076", "rail-ink": "#eef1f8"
    }
  }
}
```

That's `brands/aurora.json`: the same indigo/cyan brand in both modes, the light
mode auto-darkening the inherited neon signals to stay readable on its near-white
surfaces. Select the light variant with `data-theme="aurora-light"`.

### Programmatic authoring (`@control-room/design-system/theme`)

The build path is thin wrapping over a framework-agnostic core you can call
directly — at build time, or in the browser for per-tenant / user-chosen themes:

```js
import { defineTheme, applyTheme, validateTheme, checkThemeContrast }
  from "@control-room/design-system/theme";

// validate + render to a scoped CSS string
const { css, validation, contrast } = defineTheme("acme", acmeBrand);

// or, in the browser, inject + activate at runtime
applyTheme(acmeVars, { name: "acme" });   // adds <style> + sets data-theme="acme"
```

- `validateTheme(vars)` → `{ valid, missing, unknown }` — missing required roles
  make it invalid; unknown keys are allowed (brand extension vars) and only warn.
- `mergeTheme(base, overrides)` — the `$extends` merge, if you resolve bases yourself.
- `themeCss(name, vars, { selector, scheme })` — pure render to CSS.
- `contrastRatio(fg, bg)` / `checkThemeContrast(vars)` — WCAG ratios for the key
  text/fill pairings; gradient-valued roles are skipped, not failed.

## Preview (proof sheet)

`npm run build:brand-preview` → `public/brands.html`: every theme (built-in +
brand, including `$modes` variants) rendered from its shipped appearance file — the
surface ladder, the signal ramp with its on-colour text and **measured WCAG
contrast** (green = ok, red = below target), and live components. Use it to eyeball
a brand and confirm every text-on-fill pairing clears contrast before sign-off.

## Contrast

`checkThemeContrast` (and `build:theme`) score the pairings a legible theme must
satisfy — body text on ground/panel, rail text, and text on each signal fill.
`build:theme` prints a ⚠ when a brand falls short; fix the offending `--on-*` or
surface value. Runtime validation always uses the real values, so a brand can't
ship an unreadable pairing unnoticed.

## Per-component overrides (fine-tuning, not rebranding)

Rebranding is the theme. For one-off tweaks that shouldn't change the theme, the
component tier exposes `--cr-*` tokens (e.g. `--cr-btn-bg`, `--cr-panel-pad`) that
default to role/scale values — override them on a scope without touching a theme:

```css
.danger-zone { --cr-btn-bg: var(--sig-err); --cr-btn-fg: var(--on-err); }
```

## What deliberately does NOT reskin: the breach

Law 9 — "the breach" — is the single sanctioned rule-break per screen (the one
soft-cornered, glowing element). It has its own `--cr-breach-*` variables and is
intentionally expressive; treat it as a per-screen accent you set consciously, not
part of the systematic theme.

## Honest note: generative art

Four decorative components (`CrSigil`, `CrCat`, `CrChrome`, `CrAscii`) paint to a
`<canvas>`, where CSS custom properties don't reach the 2D drawing context. They
read the palette at runtime via `getComputedStyle` and keep a hardcoded default
only as a **fallback**, so they *do* follow the active theme — but if you render
them before the theme CSS is applied, they fall back to the dark palette. Apply the
theme before these mount. Every other component is pure role references.
