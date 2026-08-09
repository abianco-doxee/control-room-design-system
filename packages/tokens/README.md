# @control-room/tokens

The design-token layer of the [Control Room design system](https://github.com/abianco-doxee/control-room-design-system) —
the single source of truth (`tokens/tokens.json`) for four themes on an intensity
dial, plus every generated form of them.

```bash
npm i @control-room/tokens
```

```js
import "@control-room/tokens/css";        // all four themes as CSS custom properties
import "@control-room/tokens/structure.css"; // brand-agnostic structure layer (pair with one theme)
import contract from "@control-room/tokens/theme-contract" assert { type: "json" };
```

```html
<html data-theme="dark"> <!-- dark | light | extreme | phosphor -->
```

## Exports

| Subpath | What |
| --- | --- |
| `./css` | All themes + baseline, one bundle (`control-room.css`). |
| `./structure.css` | Brand-agnostic structure (scales, chassis, type, motion). |
| `./themes/<name>.css` | One theme's appearance layer — swap to reskin. |
| `./theme-contract` | The required semantic roles a valid theme/brand must define. |
| `./tw-theme.css` | Tailwind v4 `@theme` (colours resolve to the CSS vars). |
| `./flat` | Resolved `cssVar → value`, per theme (JSON). |
| `./dtcg` | DTCG export (`design-tokens/control-room.tokens.json`). |
| `./tokens.json` | The machine-readable source of truth. |

Author a brand without forking with `brands/*.json` (see the theming reference).
Never hardcode a colour — style against the semantic roles.
