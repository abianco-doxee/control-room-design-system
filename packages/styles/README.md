# @alebianco/cr-styles

The component style layer of the [Control Room design system](https://github.com/alebianco/control-room-design-system) —
the `cr-*` classes every component renders. Pairs with `@alebianco/cr-tokens`.

```bash
npm i @alebianco/cr-styles @alebianco/cr-tokens
```

```js
import "@alebianco/cr-tokens/css";        // the token layer first
import "@alebianco/cr-styles/components";  // the whole component layer (all cr-* classes)
```

Prefer PrimeVue-style import-on-use? Load the thin base once, then only the parts
you render:

```js
import "@alebianco/cr-styles/base";            // reset + chassis + shared primitives
import "@alebianco/cr-styles/parts/button.css"; // just the button
import "@alebianco/cr-styles/parts/panel.css";
```

## Exports

| Subpath | What |
| --- | --- |
| `./components` | The authored all-in-one bundle (`components.css`). |
| `./base` | The thin global/base layer. |
| `./parts/<name>.css` | One component's styles (import-on-use). |
| `./tailwind.css` | The Tailwind v4 entry (`@import`s the token `@theme`). |

The bundle is the authored source; `base` + `parts/*` are a lossless partition of
it (byte-for-byte), so the two paths never drift.
