# Getting started

Control Room ships as a set of scoped packages on GitHub Packages. You can adopt
the whole thing or just the layer you need — tokens alone, tokens plus the CSS
component layer, or the compiled framework components on top.

## Authenticate once

The packages are published **privately** under the `@alebianco` scope, so npm
needs a token with `read:packages` before it can resolve them. Add this to your
project's `.npmrc`:

```ini
@alebianco:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Then export a [personal access token](https://github.com/settings/tokens) with
`read:packages` as `NODE_AUTH_TOKEN`. Never commit the token itself — keep it in
your shell profile or your CI secrets.

## Install

```bash
# the visual foundation: tokens + the cr- component CSS
pnpm add @alebianco/cr-tokens @alebianco/cr-styles

# optional: compiled components for your framework
pnpm add @alebianco/cr-components
```

## The packages

| Package | What it gives you |
| --- | --- |
| `@alebianco/cr-tokens` | The token layer — theme CSS, a Tailwind `@theme` layer, DTCG export, and the machine-readable theme contract. The source of truth for every value. |
| `@alebianco/cr-styles` | The `cr-` component CSS: 70+ parts, framework-agnostic. Works with plain HTML. |
| `@alebianco/cr-components` | Interactive components compiled from one Mitosis source to React, Vue, Svelte, Angular, Solid, and Qwik. |
| `@alebianco/cr-icons` | The pixel icon set. |
| `@alebianco/cr-utils` | Helpers — `cn`, theme switching, duration/time-scale formatting, form validation. |
| `@alebianco/cr-mcp` | An MCP server exposing the catalog, theme contract, and these docs as tools — so an agent can query the system directly. |
| `@alebianco/cr-skill` | The system as an installable agent skill. |

## Wire up the CSS

Import the token layer, then the component layer. Order matters — the components
resolve against token custom properties.

```js
import "@alebianco/cr-tokens/css";          // all four themes + primitives
import "@alebianco/cr-styles/components";   // the cr- component classes
```

That's the whole visual foundation. From here, markup is plain HTML with `cr-`
classes:

```html
<section class="cr-panel">
  <h4 class="cr-panel__title">Sessions</h4>
  <div class="cr-row">
    <span class="cr-sev cr-sev--work" role="img" aria-label="working"></span>
    <span class="cr-row__name">nova-01</span>
    <span class="cr-row__status">streaming</span>
  </div>
  <button type="button" class="cr-btn cr-btn--sig-accent">Escalate</button>
</section>
```

## Pick a theme

Themes are selected with a single attribute on the root element — there is no
per-theme code anywhere in your app:

```html
<html data-theme="dark">
```

Four core themes ship: `dark` (the default), `light`, `extreme`, and `phosphor`.
Seven brand themes are also generated — `aurora`, `aurora-light`, `boardroom`,
`ember`, `harbor`, `porcelain`, `slate`. Load one from
`@alebianco/cr-tokens/themes/*`.

To switch at runtime without a flash of the wrong theme, set the attribute before
first paint:

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem("cr-theme");
      if (t) document.documentElement.setAttribute("data-theme", t);
    } catch (e) {}
  })();
</script>
```

See [theming & branding](theming.md) to build your own theme against the contract.

## Using the framework components

Interactive components (anything with real state, keyboard behaviour, or ARIA) are
authored once and compiled per framework. Import from your framework's subpath:

```jsx
// React
import { CrButton, CrCombobox } from "@alebianco/cr-components/react";
```

```vue
<!-- Vue -->
<script setup>
import { CrButton, CrCombobox } from "@alebianco/cr-components/vue";
</script>
```

The same names exist under `/svelte`, `/angular`, `/solid`, and `/qwik`. The
compiled output applies `cr-` classes and carries no styling of its own, so it
still needs the two CSS imports above.

See [framework components](frameworks.md) for the per-target details, and the
[styling contract](styling-contract.md) for `pt` / `dt` / `unstyled` overrides.

## With Tailwind

The token layer ships a Tailwind v4 `@theme` block, so every token becomes a
Tailwind utility:

```css
@import "tailwindcss";
@import "@alebianco/cr-tokens/tw-theme.css";
```

See [Tailwind-first](tailwind.md).

## For agents

The system is designed to be consumed by tooling, not just read by people:

- **MCP server** — `npx @alebianco/cr-mcp` exposes the component catalog, the
  theme contract, and every reference doc as MCP tools and resources.
- **`llms.txt` / `llms-full.txt`** — the whole system as a single flat document.
- **`catalog.json`** — all 83 components with categories, tokens, variants, and
  keywords, queryable.
- **DTCG tokens** — `@alebianco/cr-tokens/dtcg` for design-tool interop.

## Where to go next

- [Design language — the nine laws](design-language.md) — the decision procedures
  behind every visual choice. Read this first.
- [Component library](components.md) — all 83 components with anatomy, tokens,
  markup, and accessibility notes.
- [Tokens](tokens.md) — the full token reference.
- [Accessibility](accessibility.md) — the contract every component upholds.
