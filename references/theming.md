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

The worked example `brands/slate.json` — a neutral corporate re-skin — reskins the
entire component browser (try the **slate ▸** switch) touching **no** component CSS
and **no** structure token.

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
