# Building the Figma kit

You don't have a Figma file yet — this is how to create one that matches Control
Room, with the least manual work. **Reality check:** Figma files and components
can only be created in the Figma editor or by a plugin running inside Figma (the
REST API is read-only). So the file itself is a click; but the *tokens* import
almost automatically, and the *components* follow one fixed recipe.

You need a normal editor seat (your company account is fine) — **no Dev seat and
no Code Connect** required for any step here.

## Step 0 — create the file

In Figma: **New → Design file**, name it `Control Room — Kit`. Add pages:
`Tokens`, `Components`, `Playground`. (This is the only irreducibly-manual bit.)

## Step 1 — tokens → Figma Variables (near-automatic)

The DTCG export drives this — you do **not** rebuild tokens by hand.

1. Install the **Tokens Studio for Figma** plugin (free tier is enough).
2. Import `design-tokens/control-room.tokens.json` (this repo's generated DTCG
   file). Its `theme.dark / light / extreme / phosphor` groups become four token
   sets, and `chassis` / `typography` / `motion` are the shared sets.
3. In Tokens Studio, create four **themes** (dark/light/extreme/phosphor), each =
   shared sets + that theme's color set.
4. **Export to Variables** → you get a `Control Room` Variable collection with
   four **modes**, every token as a variable (colors, border widths, radii, type
   sizes). This is the whole token layer, themeable, in minutes.

Re-run any time the tokens change: rebuild here (`npm run build:tokens`),
re-import the DTCG, re-export. The tokens never diverge from code.

## Step 2 — the component recipe (memorize once)

Every Control Room component is the same chassis (the nine laws made physical).
Build it from the Variables above, never raw values:

- **Shape:** rectangle/auto-layout frame, **corner radius 0** (Law 1/token `--radius`).
- **Fill:** bind to a surface variable (`--panel`, `--panel-2`, `--board`) or a
  signal variable for keyed components.
- **Stroke:** bind to `--border`; weight = `--brd` (2) / `--brd-heavy` (3) /
  `--brd-brush` (5).
- **Shadow:** Drop shadow, **blur 0**, X/Y = `--shadow-off` (4), color `--shadow-col`.
  Never a soft/blurred shadow.
- **Text:** two type styles only — **Display** (Archivo 900, uppercase, -3.8%
  tracking) and **Data** (JetBrains Mono, 12–13, labels uppercase +7%). Create
  these as Figma text styles once.
- **Color = state:** any non-neutral fill is a signal variable and means a real
  state; pair it with `--on-sig` text.

Make each component a Figma **Component**, add **Variant properties** matching the
registry (`catalog/registry.json` → each entry's `variants`), e.g. Button gets
`Kind = primary|controls` and `State = rest|active`.

## Step 3 — which components, and their variants

The full list, categories, variants, and the tokens each consumes is the
**catalog** — build straight from it:

- Browse it in the docs: **Component Catalog** page, or read
  `catalog/catalog.json` (the components listed there).
- Each entry gives you the Figma component name, its variant axes, and the exact
  token variables to bind.

Three worked examples (the rest follow the same recipe):

**Panel** — auto-layout frame; fill `--panel`; stroke `--border` @ `--brd`; drop
shadow (0 blur, 4/4, `--shadow-col`); optional mono-uppercase `--ink` heading.
Variant `weight = default|major` (swaps stroke weight to `--brd-heavy`).

**Button** — auto-layout; fill `--sig-wait`; stroke `--border` @ `--brd-heavy`;
hard shadow; Data text in `--on-sig`. Variants `Kind = primary|controls`
(controls = `--panel` fill, `--brd` stroke), `State = rest|active` (active nudges
the layer by the shadow offset and drops the shadow — the snap-press).

**Chip** — auto-layout; fill `--sig-done` (variant `Tone = done|alt` → `--sig-work`);
stroke `--border` @ `--brd`; Data text `--on-sig`.

## Step 4 — close the loop back to code

As you create each Figma component, copy its **component key** (right-click →
Copy link, or via the API) into that entry's `figma` field in
`catalog/registry.json`:

```jsonc
"figma": { "fileKey": "<file>", "componentKey": "<component>", "props": { "Kind": "kind", "State": "state" } }
```

Then `npm run build:catalog`. Now the Figma bridge
(`references/figma-bridge.md`) can resolve a design node → the right Control Room
component, and `npm run figma:pull -- <fileKey>` will list what you've built.

## Optional — generate the kit with a plugin

The token import (Step 1) already automates the tedious part. If you also want
the **components** scaffolded by code, a small Figma **plugin** can read the
catalog + variables and stamp out the component set inside Figma — the only
code-driven way to create Figma components. It needs a test run in your Figma
(the Plugin API varies by version), so it's offered as an add-on rather than part
of the guaranteed path. Ask and I'll generate it.
