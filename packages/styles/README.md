# @control-room/styles

The component style layer of the [Control Room design system](https://github.com/alebianco/control-room-design-system) —
the `cr-*` classes every component renders. Pairs with `@control-room/tokens`.

```bash
npm i @control-room/styles @control-room/tokens
```

```js
import "@control-room/tokens/css";        // the token layer first
import "@control-room/styles/components";  // the whole component layer (all cr-* classes)
```

Prefer PrimeVue-style import-on-use? Load the thin base once, then only the parts
you render:

```js
import "@control-room/styles/base";            // reset + chassis + shared primitives
import "@control-room/styles/parts/button.css"; // just the button
import "@control-room/styles/parts/panel.css";
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
