# Token Reference

The token layer is the contract between the design language and every component.
**MUST** build on it. **NEVER** hardcode a value that a token already names — a
raw hex or a `border-radius: 4px` is, by definition, a defect, because it will
not survive a theme flip and it breaks the single source of truth.

- Runtime source of truth: `tokens/control-room.css`
- Machine-readable source: `tokens/tokens.json` (parse to generate CSS / Tailwind
  / Style Dictionary / JSON)

Edit `tokens.json` and mirror into `control-room.css` (or regenerate). Never let
the two drift.

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
| `--brd` | `2px` | `3px` | internal dividers, minor panels |
| `--brd-heavy` | `3px` | `4px` | major panels, mastheads, primary buttons |
| `--brd-brush` | `5px` | `6px` | outer chassis, bezels — the "brush stroke" |
| `--shadow-off` | `4px` | `6px` | standard hard drop offset |
| `--shadow-off-lg` | `6px` | `9px` | mastheads, live instruments |
| `--radius` | `0px` | `0px` | **always 0** — exists so the 0 is explicit |
| `--halftone-size` | `7px` | `7px` | halftone cell size (bezels only) |

**The hard-shadow idiom** (memorize it; it is everywhere):

```css
box-shadow: var(--shadow-off) var(--shadow-off) 0 var(--shadow-col);
/* offset-x  offset-y  blur=0  color — blur and spread are ALWAYS 0 */
```

## Typography tokens

Two registers, nothing between (Law 5).

| Token | Value | Notes |
| --- | --- | --- |
| `--font-sans` | `"CR Sans","Archivo",…` | display register |
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
| `--on-sig` | text/icon placed on a signal fill |

### Line & mass

| Token | Role |
| --- | --- |
| `--border` | contour / outline (near-black) |
| `--mass` | black as a large fill area (Law 1) |
| `--shadow-col` | hard offset shadow color |

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

## Full per-theme value matrix

| Token | dark | light | extreme | phosphor |
| --- | --- | --- | --- | --- |
| `--ground` | `#0a0a12` | `#ecebe3` | `#0c0510` | `#020a04` |
| `--board` | `#0e0e18` | `#e4e3d9` | `#12061a` | `#041207` |
| `--panel` | `#14141f` | `#ffffff` | `#18091f` | `#06180a` |
| `--panel-2` | `#191926` | `#f6f5ef` | `#210c2b` | `#0a2210` |
| `--ink` | `#e6e6f2` | `#0b0b12` | `#fdf0ff` | `#43ff7a` |
| `--muted` | `#8a8aa6` | `#55556b` | `#c79ad6` | `#1f8c42` |
| `--border` | `#000000` | `#000000` | `#000000` | `#031a08` |
| `--rail` | `#050509` | `#0b0b12` | `#ff2e97` | `#020a04` |
| `--rail-ink` | `#c8c8de` | `#ecebe3` | `#0c0510` | `#43ff7a` |
| `--sig-work` | `#22d3ee` | `#0891b2` | `#00f0ff` | `#43ff7a` |
| `--sig-accent` | `#ff2e97` | `#e60076` | `#ff2e97` | `#b6ff00` |
| `--sig-done` | `#5eead4` | `#0d9488` | `#c6ff00` | `#00e05a` |
| `--sig-wait` | `#fde047` | `#d97706` | `#ffd400` | `#a8ff3e` |
| `--sig-err` | `#ff3b6b` | `#e11d48` | `#ff4d6d` | `#eaff40` |
| `--sig-idle` | `#6b6b8a` | `#7e7e94` | `#9a7aab` | `#12602c` |
| `--on-sig` | `#050509` | `#ffffff` | `#0c0510` | `#020a04` |
| `--shadow-col` | `#000000` | `#000000` | `#000000` | `#031a08` |
| `--mass` | `#000000` | `#0b0b12` | `#000000` | `#010603` |
| `--stage` | `#00b34a` | `#00a344` | `#c6ff00` | `#0d7a34` |
| `--stage-ink` | `#04140a` | `#04140a` | `#12061a` | `#d9ffe6` |
| `--drip` | `#4affc8` | `#0a7f5c` | `#00f0ff` | `#43ff7a` |

## Adding a token

1. Add it to `tokens.json` under the right group, with a `cssVar`, a `role`, and
   a value for **all four themes**.
2. Mirror it into `tokens/control-room.css` (base `:root` + each theme block).
3. If it is a new signal hue, verify `--on-sig` contrast against it in every
   theme (`references/accessibility.md`).
4. Reference it from components by variable — never inline the value.
