# Token Reference

The token layer is the contract between the design language and every component.
**MUST** build on it. **NEVER** hardcode a value that a token already names — a
raw hex or a `border-radius: 4px` is, by definition, a defect, because it will
not survive a theme flip and it breaks the single source of truth.

- **Author** here: `tokens/tokens.json` — the hand-edited source of truth.
- **Generated** by `pnpm run build:tokens`, committed:
  - `dist/control-room.css` — runtime CSS custom properties, all four themes
  - `dist/tw-theme.css` — Tailwind v4 `@theme` (colors resolve to the CSS vars)
  - `dist/tokens.flat.json` — resolved `cssVar → value`, per theme
  - `design-tokens/control-room.tokens.json` — **DTCG** format (see below)

Never hand-edit the generated files. `pnpm run verify:tokens` fails CI if any of
them drift from `tokens.json`.

## DTCG interop

`design-tokens/control-room.tokens.json` is emitted in the [Design Tokens
Community Group](https://www.designtokens.org/) format, matching the Doxee
`Design-System-Hub` convention: each token carries `$type` / `$value` /
`$description` and a `com.doxee.cssVar` extension naming its CSS variable. This
makes Control Room tokens consumable by Style Dictionary, Figma token plugins,
and the Doxee tooling without a bespoke parser. Structure: `chassis`,
`typography`, `motion`, and a `theme` group (`dark` / `light` / `extreme` /
`phosphor`) whose colors are grouped by semantic role.

## Token tiers (global → semantic → component)

Control Room uses the standard three-tier token model, so nothing hardcodes a
raw value:

1. **Primitive / global** (`primitive` in `tokens.json`) — context-free scales,
   named by what they *are*: the **spacing scale** (`--space-*`, 4px base — step
   n = 4n, matching Tailwind), the **type scale** (`--text-2xs … --text-xl`),
   line-heights (`--leading-*`), radius (`--radius-none`, always 0), and z-index
   (`--z-*`). Plus the chassis primitives (`--brd*`, `--shadow-off*`).
2. **Semantic** (`semantic`) — named by what they're *for*: `--panel`, `--ink`,
   `--sig-work`, `--on-err`, … Values differ per theme; meaning does not.
3. **Component** (`component`) — per-component tokens referencing the tiers
   above: `--cr-btn-bg`, `--cr-btn-pad-x`, `--cr-panel-pad`, … Restyle a
   component by overriding its `--cr-*` tokens; you never edit its CSS.

Rule of thumb: **components consume component tokens; component tokens reference
semantic + primitive; semantic references primitive/theme values.** No layer
reaches past the one below it, and no CSS uses a raw px or hex.

### Primitive scales

Spacing (`--space-*`): `0, px(1), 0-5(2), 1(4), 2(8), 3(12), 4(16), 5(20),
6(24), 8(32), 10(40), 12(48), 16(64)` px. Type (`--text-*`): `2xs(10), xs(11),
sm(12), base(13), md(15), lg(19), xl(clamp display)`. Use these — never a literal.

### Component tokens

Each component exposes tokens (see `component` in `tokens.json`), e.g. Button:
`--cr-btn-bg`, `--cr-btn-fg`, `--cr-btn-pad-x`, `--cr-btn-pad-y`, `--cr-btn-size`.
Variants are just token overrides — e.g. `.cr-btn--sm { --cr-btn-pad-x: var(--space-3); }`.

Interactive components expose per-part / per-state tokens at the same granularity
as PrimeVue's `dt` — e.g. Tabs: `--cr-tabs-indicator` (active underline),
`--cr-tabs-tab-active-fg`, `--cr-tabs-tab-fg`; Menu: `--cr-menu-item-hover-bg`,
`--cr-menu-panel-bg`, `--cr-menu-item-danger-fg`; Modal: `--cr-modal-bg`,
`--cr-modal-backdrop`. A component's `dt` prop sets exactly these on that one
instance, so an override stays surgical (see `references/styling-contract.md`).

Coverage is library-wide. Two conventions keep the surface small:

- **Shared `field` group** — the text-control family (Input, Textarea, Select,
  Combobox, NumberField, DateTime, Cron, Pin, TagsInput) reads one surface:
  `--cr-field-bg`, `--cr-field-fg`, `--cr-field-border`, `--cr-field-placeholder`,
  `--cr-field-focus`, `--cr-field-error`. Retheme the whole form layer in one place
  (mirrors PrimeVue's `form.field.*`).
- **Single `accent` knob** — where a component's active/selected/indicator colour
  came from a signal, it's one token that drives every derived shade: e.g.
  `--cr-table-accent` colours both the sort indicator and the selected-row tint;
  `--cr-tree-accent`, `--cr-accordion-accent`, `--cr-segmented-accent-bg`,
  `--cr-stepper-accent-bg`, `--cr-pager-accent-bg`, `--cr-nav-active-bg` follow the
  same shape.

Signal-driven components (Tag, Tile, Meter, Progress, Toast) intentionally have no
per-component tokens — their colour *is* the semantic signal, so retheme them via
the signal tokens (`--sig-work`, `--sig-done`, …). Alert is the hybrid: a base
surface (`--cr-alert-bg`/`--cr-alert-border`) plus a per-variant `--cr-alert-key`.

## How theming works

Themes are selected by `html[data-theme]`:

| `data-theme` | Theme |
| --- | --- |
| *(absent)* or `dark` | **Dark** — default, Edgerunners ramp |
| `light` | **Light** — ink-on-paper, newsprint |
| `extreme` | **Extreme** — the intensity dial to 11 |
| `phosphor` | **Phosphor** — single-channel green CRT |

Every theme carries the **full** token set. A component composed only from
tokens works in all four with **zero per-theme code**. That property is the
acceptance test for the token layer — if a component needs a per-theme override,
either it is hardcoding something or a token is missing.

Prevent a flash of the wrong theme (FOUC) with a tiny inline script in `<head>`,
before stylesheets, that reads the persisted choice and sets the attribute:

```html
<script>
  (function () {
    var t = localStorage.getItem("cr-theme");
    if (t) document.documentElement.setAttribute("data-theme", t);
  })();
</script>
```

## Chassis tokens (theme-independent)

Structural. The **only** theme that overrides these is `extreme` (heavier
everything).

| Token | Default | Extreme | Purpose |
| --- | --- | --- | --- |
| `--brd-hair` | `1.5px` | `2px` | hairline — dot/tag outlines, row separators, dense chrome |
| `--brd` | `2px` | `3px` | internal dividers, minor panels |
| `--brd-heavy` | `3px` | `4px` | major panels, mastheads, primary buttons |
| `--brd-brush` | `5px` | `6px` | outer chassis, bezels — the "brush stroke" |
| `--shadow-off-sm` | `2px` | `3px` | small floating pieces — menus, chips, popovers |
| `--shadow-off` | `4px` | `6px` | standard hard drop offset |
| `--shadow-off-lg` | `6px` | `9px` | mastheads, live instruments |
| `--radius` | `0px` | `0px` | **always 0** — exists so the 0 is explicit |
| `--halftone-size` | `7px` | `7px` | halftone cell size (bezels only) |
| `--breach-radius` | `14px` | `14px` | Law 9 — the one soft corner (`.cr-breach` only) |
| `--breach-blur` | `26px` | `26px` | Law 9 — blurred-blob softness |
| `--breach-glow-size` | `40px` | `40px` | Law 9 — glow radius |

The three `--breach-*` tokens are the **only** place radius, blur, and a soft glow
are licensed (Law 9 — The Breach). They exist as named tokens precisely so the
exception is explicit and greppable, and so a raw `border-radius` anywhere else
still reads as a defect.

**Interaction constants** (theme-independent — how a state *reads*, not a colour):

| Token | Value | Purpose |
| --- | --- | --- |
| `--state-disabled-op` | `0.45` | opacity for a disabled control |
| `--state-hover-mix` | `12%` | `--ink` mixed into a surface on hover (`color-mix`) |
| `--row-h` | `34px` | dense-table row-height baseline (density) |

**The hard-shadow idiom** (memorize it; it is everywhere):

```css
box-shadow: var(--shadow-off) var(--shadow-off) 0 var(--shadow-col);
/* offset-x  offset-y  blur=0  color — blur and spread are ALWAYS 0 */
```

## Typography tokens

Two registers, nothing between (Law 5).

| Token | Value | Notes |
| --- | --- | --- |
| `--font-display` | `"CR Display","Saira Condensed",…` | **display register** — condensed heavy grotesque |
| `--font-sans` | `"CR Sans","Archivo",…` | UI / body fallback |
| `--font-mono` | `"CR Mono","JetBrains Mono",…` | data register |
| `--type-display-weight` | `900` | |
| `--type-display-tracking` | `-0.038em` | |
| `--type-display-leading` | `0.9` | clamp to `0.88–0.92` in use |
| `--type-display-transform` | `uppercase` | |
| `--type-data-size` | `13px` | 12–13px range |
| `--type-data-size-sm` | `11px` | labels, chrome |
| `--type-label-tracking` | `0.07em` | |
| `--type-label-transform` | `uppercase` | |

Display, single big number: `font: 900 clamp(28px,5.5vw,52px)/0.9 var(--font-sans);
text-transform: uppercase; letter-spacing: -0.038em;`

Data label: `font: 700 11px/1.2 var(--font-mono); text-transform: uppercase;
letter-spacing: 0.07em; color: var(--muted);`

## Semantic tokens

The value differs per theme; the **meaning never does**. Compose from these, not
from raw values.

### Surfaces (back → front)

| Token | Role |
| --- | --- |
| `--ground` | page background, furthest back |
| `--board` | instrument / work surface |
| `--panel` | raised card / panel |
| `--panel-2` | recessed / inset region |
| `--rail` | navigation rail background |

### Text

| Token | Role |
| --- | --- |
| `--ink` | primary text |
| `--muted` | secondary / label text |
| `--rail-ink` | text on the rail |
| `--on-sig` | text/icon placed on a signal fill (contrast-safe per theme) |
| `--on-err` | text/icon on an error (`--sig-err`) fill — white in light, dark elsewhere |

### Line & mass

| Token | Role |
| --- | --- |
| `--border` | contour / outline (near-black) |
| `--mass` | black as a large fill area (Law 1) |
| `--shadow-col` | hard offset shadow color |

**On pure black (a decision on the record).** In dark/light/extreme, `--border`,
`--mass`, and `--shadow-col` are pure `#000000` — deliberately. Neobrutalism earns the
hard, untinted line; a tinted "rich black" would soften exactly the edge this system
is built on. The phosphor theme is the exception: its line/mass carry a hair of the
green ground (`#031a08` / `#010603`) so the black doesn't fight the CRT wash. If a
future theme reads as harsh, tint *that* theme's line — don't globally soften the
brutalist default.

### Signal ramp (state channel — Law 2)

| Token | State / role |
| --- | --- |
| `--sig-work` | working (also the focus-outline color) |
| `--sig-wait` | waiting / needs input |
| `--sig-done` | done / merged |
| `--sig-err` | error / failing |
| `--sig-idle` | idle |
| `--sig-accent` | attention / primary action |

Text placed **on** any signal fill uses `--on-sig`. The pairing is contrast-safe
per theme (see `references/accessibility.md`).

### Keyed & decay

| Token | Role |
| --- | --- |
| `--stage` | calm / nominal keyed stage flood |
| `--stage-ink` | text on the stage flood |
| `--drip` | house glitch / decay hue (Law 3) |

### Texture

| Token | Role |
| --- | --- |
| `--halftone` | hardware texture — legal **inside a bezel only** (Law 6) |

### Extreme-only extension hues

`--extra-purple` (`#a855f7`) and `--extra-orange` (`#ff6b35`) exist **only** in
the `extreme` theme. **NEVER** reference them from a component that must work in
all themes — they resolve to nothing elsewhere.

## Full per-theme values

The resolved value of every token in every theme lives in the **generated,
authoritative** file **[`dist/tokens.flat.json`](../dist/tokens.flat.json)**
(`{ themes: { dark|light|extreme|phosphor: { "--token": value } } }`) — emitted
from `tokens/tokens.json` by `build:tokens`. It is not reproduced as a hand-typed
table here on purpose: a copied hex matrix silently rots the moment a value
changes (and the grounds/signals are themselves OKLCH-generated — see below). To
read a theme's palette, open `tokens.flat.json`, the Live Gallery's colour-tokens
section (which renders the real values), or `dist/control-room.css`.

## OKLCH-generated palette {#oklch}

The four themes' grounds and signals are authored in **OKLCH** (perceptually
uniform) rather than eyeballed in sRGB, so every theme's signals sit at a
consistent *perceived* lightness/chroma. `build/build-palette.mjs` takes a compact
per-theme spec (ground L/C/H + signal hues + target L/C), gamut-maps to sRGB
(`culori`), and — crucially — **auto-picks each fill's on-colour** (near-black vs
near-white) by WCAG contrast, printing any pair under AA.

```bash
node build/build-palette.mjs           # → tokens/palette.generated.json + contrast report
node build/build-palette.mjs --report  # report only
```

Its output is folded into `tokens/tokens.json` (the hand-editable source of
truth); the generator is provenance + a tuning surface. Per theme it can emit
grounds, signals, and/or the second accent independently:

- **dark / extreme** — grounds + signals generated. The grounds are a **lifted
  deep-violet charcoal** (more lightness *and* more chroma than a dead near-black),
  so the dark theme reads as a rich surface with real colour presence, not a void.
- **light** — signals stay hand-tuned, but the paper is regenerated **cool**
  (violet-grey, `h ≈ 285`) rather than warm cream, so it sits with the neon
  signals instead of fighting them.
- **phosphor** — keeps its green channel; takes only the second accent.

**`--sig-accent-2`** is a **second action key** (acid lime in dark/extreme, a deep
violet on light, an aqua-green in phosphor) with `--on-accent-2`. It is a
*secondary action / brand* accent, **not** a machine state — Law 2 still governs
the state ramp (`--sig-work/wait/done/err/idle`).

## Texture tokens

Three theme-keyed texture backgrounds for **hardware surfaces only** (Law 6):

| Token | Texture |
| --- | --- |
| `--halftone` | neo-print dot pattern |
| `--dither` | ordered 1-bit checker (50% dither) |
| `--scanline` | CRT scanlines |
| `--crosshatch` | ±45° cross-hatch |
| `--field` | whisper block-shade drafting field (dead background space) |

Apply via the `.cr-tex--halftone` / `.cr-tex--dither` / `.cr-tex--scan` /
`.cr-tex--cross` / `.cr-tex--glass` utilities on hardware, and `.cr-bg--field` for
dead background space (see `references/components.md` and `references/decoration.md`)
— never on a flat content field.

## Adding a token

1. Add it to `tokens.json` under the right group, with a `cssVar`, a `role`, and
   a value for **all four themes**.
2. Run `pnpm run build:tokens` to regenerate dist/ and design-tokens/ (DTCG).
3. If it is a new signal hue, verify `--on-sig` contrast against it in every
   theme (`references/accessibility.md`) — or add it to `build/build-palette.mjs`
   and let the generator pick + check the on-colour for you.
4. Reference it from components by variable — never inline the value.
