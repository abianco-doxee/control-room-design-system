# @alebianco/cr-icons

Icon path-data for the [Control Room design system](https://github.com/alebianco/control-room-design-system) —
one importable map per Iconify family, keyed by the house icon names. Ships the
soft pixel-art escape-hatch pack (pixelarticons) today.

```bash
npm i @alebianco/cr-icons
```

```js
import { PIXEL_ICONS } from "@alebianco/cr-icons/pixel";
// PIXEL_ICONS[name] is a single 24×24 `<path>` d string (fill=currentColor).
```

`CrIcon` (in `@alebianco/cr-components`) renders the house geometric set by
default and the pixel pack via `set="pixel"`. For a one-off glyph — from any
Iconify family or hand-drawn — feed a raw path to `CrIcon`'s `path` escape hatch:

```jsx
import { PIXEL_ICONS } from "@alebianco/cr-icons/pixel";
<CrIcon path={PIXEL_ICONS["deploy"]} filled label="deploy" />
```

## Add a family

Add one `@iconify-json/<set>` devDep + a name map to `build/build-icons.mjs`, then
`npm run build`. Every pack stays a single `<path>` on a 24×24 grid so it renders
portably across all six framework targets (no `innerHTML`).
