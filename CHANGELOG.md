# Changelog

## 2.0.0

### Major Changes

- baabf91: Prune the deprecated back-compat props; retune the chrome to neo-brutalist cyberpunk.

  **Breaking — legacy props/classes removed** (there is now one canonical way):

  - `CrButton.kind` → use `emphasis` (solid·outline·ghost·link) + `signal`.
  - `CrTag.tone` / `CrStatusDot.state` / `CrSessionRow.state` / `CrMeter.tone` /
    `CrProgress.tone` → all use `signal` (work·wait·done·err·idle·accent).
  - CSS: dropped `.cr-btn--{controls,work,accent,accent2,err}` and the
    `.cr-tag--{now,later,no}` aliases. Use `.cr-btn--{outline,ghost,link}` +
    `.cr-btn--sig-*`, and the canonical `.cr-tag--*` signal words.

  All consumers (gallery, component browser, `examples/console`, catalog) migrated.

  **Chrome** — the seeded decorative strip is now blocky neo-brutalist cyberpunk (hard
  neon frame, chunky corner brackets, a stamped ID slab, a hazard block, chunky bars,
  segmented register cells, an RGB-split glitch block, big blocky LEDs) rather than the
  delicate NERV-style HUD (reticle / ruler ticks / fine grid removed).

  verify, verify:types, a11y (gallery + showcase), responsive pass; visual baselines
  refreshed.

### Minor Changes

- 2619463: Disclosure & overlay components (the shadcn/PrimeVue trio):

  - **CrAccordion** — collapsible sections; header buttons (`aria-expanded` +
    `aria-controls`) reveal `role=region` panels. `single` makes it exclusive;
    `↑`/`↓`/`Home`/`End` move between headers. Only the chevron animates (frozen
    under reduced-motion).
  - **CrPopover** — a generic anchored overlay for arbitrary content: a trigger
    toggles a floating panel, a transparent scrim closes it on outside click, `Esc`
    closes and returns focus to the trigger (no global listeners). Use Menu for a
    list of actions.
  - **CrDrawer** — an edge sheet on the native `<dialog>` (focus-trap + `Esc` +
    backdrop); slides from left or right, full height, for detail/inspector panels.

  All three demoed in the gallery (four themes), cataloged, documented (+ keyboard-nav
  table rows), and composed into `examples/console` — the breach panel's "inspect ▸"
  opens a right drawer containing a data list and a single-open accordion, and the
  masthead gains a "filters ▾" popover. Verified open/close/focus/keyboard end to end.

- 33b382f: Angular runtime verification — the sixth target. Full Angular SSR isn't viable in
  plain Node (its distributed packages are partially-compiled and need the Angular
  build linker), so `test:frameworks` now executes the Angular component's **logic** on
  the real `@angular/core`: it transpiles the component (esbuild, legacy decorators),
  stubs the metadata-only `@angular/common` import, instantiates it, applies `@Input`
  props, and asserts the `@Input`-driven class getter, the `@Output` `EventEmitter`,
  and the `@Component` template's `cr-` markup. Harness in `build/render-fw.mjs`
  (`instantiateAngular`).

  With this, **all six framework targets are verified at runtime** — React (render),
  Vue/Svelte/Solid (SSR render), Qwik (import), Angular (logic on @angular/core).
  frameworks.md's matrix updated.

- def8b15: Four motion/detail upgrades from review:

  - **Rotating breach rim + riding spots** — the breach's neon rim now rotates
    (`@property --cr-breach-angle` → a conic gradient) with bright spots
    counter-riding the border. Speed via `--breach-spin` (9s); off under reduced
    motion.
  - **Pure-CSS scroll binding** — new `.cr-scrollbar` progress rail bound to scroll
    via `animation-timeline: scroll()` (no JS); `.cr-scrollbar--local` binds to the
    nearest scroll container. Hidden under reduced motion (the global `animation:
none` would otherwise freeze it empty).
  - **Textures fill + visible** — halftone/dither/scanline/crosshatch alphas raised
    (~2–3×) and dots enlarged; the `.cr-tex--*` utilities now repeat/fill edge to
    edge.
  - **Seeded chrome** — new `CrChrome` component paints a deterministic pixel-art
    metal strip (varied fasteners, seams, wear scratches, an LED). Plus new kit
    pieces: `.cr-screw`/`--x`, `.cr-bolt`, `.cr-led`(+signal), `.cr-grille`.

  Docs: motion (scroll-bound + rotating rim), components (#seeded-chrome, breach
  rim, expanded kit). Catalog +1 (30 components). a11y passes all four themes;
  baselines refreshed.

- 8e8104d: Add an ASCII / pixel **decoration system** for dead space (researched from the
  block-elements + Braille + FUI/NERV vocabulary). All decoration is aria-hidden,
  non-interactive, whisper-contrast, and mask-faded off content — atmosphere, never
  data.

  - **CrAscii** — seeded canvas density field (braille / block `░▒▓` / ascii ramp),
    value-noise driven; `.cr-ascii` + `--mask-l/-r/-edge` position/fade helpers.
  - **CrTelemetry** + `.cr-telemetry` — seeded NERV-style readout string
    (`SEED 2E7A · 0x4F · 12ms ▮▮▮▯▯`) for a frame corner. Decoration, not data.
  - **Telemetry trim** — `.cr-trim` (2 corners) / `.cr-trim--4` (all four brackets)
    and `.cr-ruler` (FUI tick-ruler edge).
  - **Drafting field** — `--field` token + `.cr-bg--field` for dead background space.
  - **Empty states** — an aria-hidden field behind a mono label (`░ NO SIGNAL ░`).

  New `references/decoration.md` (system + the decorative-only contract); composed
  masthead now carries a mask-faded braille field + corner telemetry. Catalog +2
  (32 components). a11y passes all four themes; baselines refreshed.

- 13792a0: Lean into ASCII: first-class rules, meters, spinner, and an empty/loading backdrop.

  - **ASCII rules** — `.cr-rule` (solid ──), `--hatch` (▓▒░), `--dot` (· · ·) as real
    character dividers, not borders.
  - **ASCII meter** — `.cr-ascii-bar` with `--v` (0..1) renders a genuine block-glyph
    progress bar (▰ fill over ▱ track), keyed to `--sig-work`.
  - **ASCII spinner** — `.cr-ascii-spin` cycles braille frames; honors reduced motion.
  - **Empty / loading backdrop** — `.cr-empty` lays a masked braille density tile behind
    the content (themed to `--muted`, follows `--decoration-intensity`); CrEmptyState now
    uses it. The braille field is the default texture for zero-data and loading states.

  Demoed in the gallery's decoration section (four themes). a11y + responsive pass;
  visual baselines refreshed for the new section.

- e5218ea: Branding: auto-derived on-colours + a second worked brand.

  A brand author rarely needs to hand-pick the text colour that sits on each fill.
  The theme core now derives them: `autoOnColor(fill)` picks the more legible ink
  (near-black vs near-white by WCAG contrast), and `deriveOnColors(vars, { changed })`
  fills every `--on-*` a brand omits **and re-derives** any it inherited from an
  `$extends` base when the brand recoloured the fill underneath — so an inherited
  `--on-accent` can't go stale after `--sig-accent` changes. Hand-set on-colours are
  always preserved. `defineTheme` and `build:theme` run this automatically
  (`defineTheme(..., { deriveOnColors: false })` opts out).

  New brand **`brands/porcelain.json`** — a light corporate re-skin on the **light**
  base that declares only surfaces + the signal ramp and lets the build derive all
  five on-colours; it proves both bases (`dark` via slate, `light` via porcelain) and
  the derivation path end to end. The component browser's theme switch now picks up
  every `brands/*.json` automatically (**slate ▸**, **porcelain ▸**).

  Docs: theming.md "Auto-derived on-colours". Tests: `autoOnColor`, `deriveOnColors`
  (fill / re-derive / preserve), and porcelain validates + every derived on-colour
  clears AA-large against its fill. All gates green.

- 94b18a0: Branding: dark+light pairing (`$modes`) and contrast-fitting signals (`$fitSignals`).

  **`$modes`** lets one brand file emit several themes — most usefully a dark + light
  pair. Shared identity stays at the top level; each mode adds only its deltas. The
  first mode is primary (`dist/themes/<name>.css`), the rest are `<name>-<mode>.css`
  (select with `data-theme="<name>-<mode>"`).

  **`$fitSignals`** (`true` or a target ratio) nudges each signal's OKLCH lightness
  (hue + chroma held) until it clears a minimum contrast against `--panel` — the fix
  for reusing a dark-tuned neon ramp on light surfaces. It only touches signals that
  fall short and never a hand-set one; runs after toning, before on-colour derivation.

  New brand **`brands/aurora.json`** — one definition, both modes: the same
  indigo/cyan brand in dark and light, the light mode (`aurora-light`) auto-darkening
  the shared neon signals to stay legible on its near-white surfaces. Full pipeline is
  now `$extends` < `$ramp` surfaces < toned (`$signalTone`) / fitted (`$fitSignals`)
  signals < explicit roles, then auto on-colours.

  Generators in `build/signals.mjs` (fit) and `build/build-theme.mjs` (modes). Docs:
  theming.md "Fit signals" + "One brand, many modes". Tests cover `fitSignals` and the
  aurora pair. All gates green.

- dd81787: Branding: OKLCH surface ramp — derive the whole surface ladder from one tone.

  A brand can now give `$ramp` (a single base surface tone) and the build derives
  `--ground` / `--board` / `--panel` / `--panel-2` / `--rail` by walking **OKLCH
  lightness** (perceptually even), keeping the tone's hue and a whisper of its chroma
  so the surfaces read as one tinted material at different depths. Direction follows
  `$scheme` (dark: ground deepest, panels lift; light: ground bright, panel
  near-white); `--rail` stays a deep tone. Precedence is `$extends` base < `$ramp`
  surfaces < explicit role overrides, so any surface can still be set by hand.

  New brand **`brands/ember.json`** — a warm-dark theme authored from essentially a
  base tone plus an accent (surfaces from `$ramp`, signals inherited from `dark`,
  on-colours auto-derived). Combined with auto on-colours, a coherent brand is now
  "one tone + one accent." The generator lives in `build/ramp.mjs` (build-time; uses
  culori/OKLCH). The component browser auto-discovers it (**ember ▸** alongside slate
  and porcelain).

  Docs: theming.md "Surface ramp from one tone". Tests: `surfaceRamp` ordering
  (dark + light) and ember end-to-end (ramp surfaces applied, complete + legible).
  All gates green.

- 3913c1d: Branding: a brand preview proof-sheet. `npm run build:brand-preview` →
  `public/brands.html` renders **every** theme (built-in + brand, including `$modes`
  variants) from its shipped appearance file: the surface ladder, the signal ramp
  with its on-colour text and **measured WCAG contrast** (green = ok, red = below
  target), and a strip of live components — each theme scoped to its own container so
  they all render on one page. It reads only the built `dist/themes/*.css`, so it
  always reflects exactly what ships.

  Wired into `build` and `pretest:e2e`; the responsive gate now covers `brands.html`.
  The component browser's theme switch also wraps now (it had grown past one row).
  Docs: theming.md "Preview (proof sheet)". All gates green.

- fa58cc4: Branding: signal voice (`$signalTone`) — re-tone the state ramp without breaking
  its meaning. The signal roles are a state channel (`--sig-err` _means_ failing), so
  a brand can't freely recolour them — but it can change how loud they read.
  `$signalTone` re-voices the inherited/derived signal ramp in OKLCH by scaling
  chroma (and, for pastel, lifting lightness) while holding hue: `"neon"` (default),
  `"muted"` (calm ops voice), `"pastel"` (soft/light). Explicitly-set signals are
  never toned; toning runs before on-colour derivation so on-colours match the
  re-voiced fills.

  New brand **`brands/harbor.json`** — a calm cool-dark theme: surfaces from `$ramp`,
  the neon ramp re-voiced to `muted` (cyan stays cyan, red stays red — just calmer),
  accent + ink set, on-colours derived. The component browser auto-discovers it
  (**harbor ▸**, now alongside slate/porcelain/ember).

  Generator in `build/signals.mjs`; docs in theming.md "Signal voice". Tests cover
  `toneSignals` (chroma drops, hue preserved, skip honoured) and harbor end-to-end.
  All gates green.

- db3156c: Branding: structural theming — rounding, borders, shadows, density (not just colour).

  Borders (`--brd-*`) and hard shadows (`--shadow-off-*`) were already tokenised, so
  overriding them worked; **rounding is now wired too** — the rectangular surfaces
  (buttons, inputs, selects, textareas, panels, chips, menus, popovers, toasts,
  modals, drawers, the command palette, …) reference a brandable `--radius` (default
  `0px`, so zero visual change out of the box). Circular indicators, decorative shapes
  and the sanctioned breach keep their own radius.

  Two convenience knobs, plus explicit control:

  - **`$shape`** — `"sharp"` (0) · `"soft"` (6px) · `"round"` (12px) → `--radius`.
  - **`$weight`** — `"hairline"` · `"regular"` · `"heavy"` → the `--brd-*` and
    `--shadow-off-*` scales.
  - Any chassis token may be set directly (wins over a preset): `--radius`, the
    border + shadow scales, `--focus-w`, `--focus-offset`, `--row-h` (density).

  `CHASSIS_OVERRIDABLE` and the published theme-contract's `chassisOverridable` list
  grew to match, so these are known (not "unknown") to `validateTheme`. New brand
  **`brands/boardroom.json`** — a light theme with soft corners + a heavy chassis +
  roomier rows — shows structural branding end to end; the preview and switch pick it
  up automatically. **House-style note:** the Control Room identity is square corners
  and hard shadows; `$shape`/`$weight` deliberately relax that, changing a brand's
  character. Presets in `build/chassis.mjs`; docs in theming.md "Structure". All gates
  green (visual unchanged — `--radius` defaults to 0).

- 1eebe8e: Branding: type — fonts & display character (the last non-colour identity axis).

  A brand can now set its **font families** with `$fonts` (`{ display, sans, mono }`
  → `--font-display` / `--font-sans` / `--font-mono`) and tune the display/label
  **character** by setting the type tokens directly: `--type-display-weight` /
  `-tracking` / `-leading` / `-transform`, `--type-label-tracking` / `-transform`.
  Base type sizes stay in the structure layer (they carry density/layout, not brand).
  `TYPE_OVERRIDABLE` and the theme-contract's new `typeOverridable` list make these
  known to `validateTheme`; `themeCss` emits them in the theme block.

  `brands/boardroom.json` gains a soft, mixed-case corporate voice (a system sans
  display, `type-display-transform: none`) to demonstrate. The brand **preview** now
  shows a per-theme **type specimen** (`Aa` + a data line) so font/character branding
  is visible at a glance. A brand supplying a custom family must load that font
  itself — the value is just a CSS font stack (keep a fallback).

  Generator in `build/type.mjs`; docs in theming.md "Type". Theme tests cover
  `typeFrom`, type-token validation, and boardroom's type. This completes the branding
  system — every non-colour axis (surfaces, chassis, signals, type, modes) is now
  brandable, contract-validated, contrast-checked, previewable, and separation-guarded.
  All gates green (visual unchanged — defaults untouched).

- e3a60a1: Button emphasis (gravity) + a digital/terminal chrome.

  - **Button hierarchy.** CrButton gains an `emphasis` axis — `solid` (primary,
    filled + hard shadow) · `outline` (secondary) · `ghost` (inline/tertiary) ·
    `link` (text) — so weight is carried by FORM, not only colour. `signal` stays the
    independent colour key (work/wait/done/err/accent/accent2): a destructive secondary
    is `emphasis="outline" signal="err"`. Legacy `kind` (primary/controls/work/accent/
    err) still works, mapped to the new axes. For outline/ghost/link the text is shifted
    toward the theme ink so a signal colour stays AA on any surface while the pure signal
    reads on the border/hover.
  - **Chrome is digital now.** The seeded chrome strip was physical (brushed metal, screws,
    bolts, vents). Rebuilt it as a terminal/NERV-style HUD readout: faint grid, ruler
    ticks, corner brackets, an amber hazard block, a cyan equalizer, a `0x…//SYS` hex
    readout, a reticle, and glowing indicator LEDs.

  verify + verify:types + a11y (gallery + showcase, four themes) + responsive pass;
  visual baselines refreshed for the new chrome.

- 6d6ccdd: The calendar time axis (`CrLineChart` with `xTime`) can now be expressed the way a
  team reads it, via three optional props (and matching `timeTicks` options):

  - **`xLocale`** — month-name language: `"en"` (default) or `"it"` (`gen · feb …`).
  - **`xWeek`** — weekly ticks as dates (`3 Mar`, default) or **ISO week numbers**
    (`W10`, still Monday-based).
  - **`xFiscalStart`** — fiscal year start month `1–12` (default `1` = calendar). Year
    and quarter ticks then anchor to it and label **`FY`/`Q`** (FY named by the ending
    calendar year), e.g. `xFiscalStart={4}` → `Q1 FY26 · Q2 · Q3 · Q4`, years on 1 Apr.

  Defaults reproduce the previous Gregorian output exactly (backward-compatible). The
  `time-scale` export gains `locale` / `week` / `fiscalStart` options with unit tests
  (Italian labels, ISO weeks on Mondays, April fiscal FY/Q anchoring, backward-compat).
  The line-chart showcase gains span / locale / week / fiscal controls.

- ff5cb8a: CrLineChart's time axis is now **timezone-aware and calendar-based**. With `xTime`,
  tick granularity auto-scales to the span — clock intervals for sub-day ranges, then
  day → week (Mondays) → month → year — and each calendar tick lands on a real
  boundary in `xZone` (a new prop; IANA zone, default `"UTC"`), DST included. A
  five-month chart ticks on the 1st of each month in local time; a multi-week chart on
  local Mondays; a multi-year chart on Jan 1. Labels format per unit (`09:30`,
  `3 Mar`, `Mar`, `Jan '25`, `2025`) and the hover tooltip shows a fuller stamp.

  The scale logic ships as a new pure, dependency-free export
  `@control-room/design-system/time-scale` (`timeTicks(lo, hi, { zone, target })`),
  unit-tested (`test:timescale`, incl. non-UTC zones and a DST transition) and shared
  with the static gallery so hand-rendered and live charts agree. The line-chart
  showcase gains an `xScale` selector (categorical / clock / calendar); the gallery
  gains a five-month calendar demo. No date library — it uses the built-in `Intl`
  zone database.

- 510e5da: Telemetry & charts — a four-form chart family, built on the signal palette and
  the data-viz house rules (thin marks, crisp non-scaling 2px strokes, a recessive
  grid, baseline-anchored bars, a 2px surface gap, one y-axis, labels/legends in
  text ink — never the series colour).

  - **CrSparkline** — inline micro line/area for a KPI or table cell; no axes, a
    data-end dot, stretches to fill its box.
  - **CrLineChart** — time series: recessive grid, a 2px line + data-end dot per
    series, tick labels, and a legend for ≥2 series. One shared y-scale (no
    dual-axis).
  - **CrBarChart** — categorical magnitude: rounded data-ends, a 2px gap, an
    optional dashed **target** line, monospace value + category labels.
  - **CrStackedBar** — composition ("stacked progress"): signal-toned segments
    sized by share, with a legend (label · value · %). Compose several for a
    per-row comparison.

  Series colour follows the entity — a `signal` tone or the next hue in a **fixed
  categorical order** (`work · accent-2 · accent · wait · done`), chosen so adjacent
  hues stay separable under colour-vision deficiency (validated with the palette
  checker against each theme surface). Every figure is `role="img"` with a spoken
  summary; the SVG is `aria-hidden`. Identity is never colour-alone (legend +
  direct labels), which also supplies the required relief for the palette's few
  CVD/contrast warnings; the max-neon lightness is an accepted, documented house
  deviation.

  Authored once in Mitosis → all six targets; live editable-prop playgrounds in the
  component browser (new **chart** category) with generated prop tables; a
  "Telemetry & charts" section in the gallery, rendered by the same geometry.
  Catalog +4 (64 components). Docs: components.md charts section (+anchors). Type,
  a11y (4 themes), responsive, islands gates green; visual baselines refreshed.

- 8a91522: Chart hover layer — crosshair + tooltips on the line and bar charts (the data-viz
  method ships interactive charts by default).

  - **CrLineChart** — a pointer over the plot snaps a dashed crosshair to the
    nearest sample, drops a cursor dot on every series, and docks a tooltip reading
    each series' value at that x.
  - **CrBarChart** — the nearest bar stays lit while the rest dim, with a tooltip
    reading its label + value.

  Progressive enhancement: the layer renders nothing at rest, so it never touches
  the static page, the visual baselines, or the a11y tree — keyboard / AT users get
  the same numbers from each figure's `role="img"` spoken summary. It stays on under
  the `calm` intensity profile (interaction feedback, not idle motion).

  Build plumbing: the React target now runs with Mitosis's formatter disabled
  (`prettier: false`) plus a new `build/build-fix-react.mjs` post-step, because
  Mitosis's bundled prettier 2.8.8 collapses a component onto one line when the
  props interface has several JSDoc'd members and emits `useState(...)` without a
  trailing semicolon — together, unparseable. The fixer restores the semicolons and
  formats with the project's prettier 3. a11y (4 themes), responsive, islands, and
  visual gates all green; type gate green.

- 5c6f009: CrLineChart and CrBarChart now draw a numbered y-axis. The scale is derived with
  the "nice number" algorithm (domain rounded out to whole 1/2/5×10ᵏ tick steps),
  so gridlines land on human values instead of raw data extremes. Each gridline is
  labelled in the left gutter, formatted compactly (`1.5k`, `2M`), with an optional
  `unit` suffix; `axis={false}` returns the bare plot. The static gallery SVG
  generator shares the same nice-scale math, so hand-rendered and live charts agree.
- 2b92585: CrCombobox: async source. The standalone combobox now takes an async
  `source(query) => Promise<{value,label}[]>` in addition to a static `options`
  list. When `source` is set it supplies (and filters) results per keystroke and a
  `searching…` row shows while it resolves — the same source model as `CrForm`'s
  `autocomplete` field. `options` becomes optional (either mode). The component
  browser's Combobox playground gains an `async` toggle. Docs updated; a11y,
  responsive, islands, and type gates green.
- 130da5d: **CrPalette** — a ⌘K command palette, the capstone that ties the shortcuts together.

  Built on the native `<dialog>` (browser focus-trap, `Esc`, backdrop). The search
  field is a **combobox** driving a **listbox**: focus stays in the input while
  `↑`/`↓`/`Home`/`End` move the active option (`aria-activedescendant`), `Enter`
  runs it, mouse hover/click work too. Live query filter over label + group, with a
  per-command keycap hint on each row.

  - Derived results are a `useStore` **method** (not a getter) — a getter compiles to
    a Qwik `useComputed` that runs before the store exists (TDZ crash); the method
    is lazy and safe across all six targets.
  - Gallery demo (all four themes) + a "Command palette" reference spec, and it's
    wired into `examples/console`: `⌘K`/`Ctrl+K` opens it, commands run the incident,
    notify, restart, and theme actions. Verified open/filter/nav/run/close end to end.

- b9e12b1: Per-component browser + fixed doc anchors (no more 404s clicking around).

  - **Component Browser** (`public/components.html`) — the Doxee-hub-style page where
    every catalogued component is rendered and exercised in all its states, the way
    the original hub had it. Generated by `build/build-showcase.mjs` from
    `catalog/catalog.json`: a sticky category index, one card per component (name,
    category/kind/lifecycle badges, description, a **stage** showing each state, plus
    its variants and tokens), and the same four-theme switcher as the gallery. 59
    cards, 47 with live in-page examples; the rest link into the Live Gallery. Wired
    into `npm run build` and `pretest:e2e`, linked from the sidebar
    ("Component Browser ↗") and from every row of the generated Component Catalog
    ("Live → open ↗", deep-linking to `components.html#c-<id>`).
  - **Doc anchors resolve** — added a small remark plugin (`remarkHeadingIds`) so
    `## Heading {#custom-id}` in the reference Markdown emits a real heading `id`.
    Cross-doc links like `components.md#cron-field` (and every catalog spec link) now
    land on the right heading instead of 404-ing at a non-existent slug. The literal
    `{#id}` is stripped from the rendered text.
  - **Shared browser script** — extracted the gallery's theme switcher + seeded canvas
    painters into `build/gallery-scripts.mjs`; both the gallery and the component
    browser import it, so the two stay in lockstep.
  - **A11y fix (found by the new gate).** A new axe gate over the component browser
    (`tests/a11y-showcase.spec.mjs`, all four themes) caught a latent contrast bug the
    gallery never rendered: the idle `Tag` used `--on-sig` instead of the
    purpose-built `--on-idle`, so in the phosphor theme dark text sat on the dark idle
    green at 2.61:1. Wired `.cr-tag--idle` to `--on-idle` (as `--err`/`--accent`
    already do, and as `.cr-tile--idle` already did) — now ≥4.5:1 in every theme.

  Verify (tokens/palette/catalog/skills), both a11y gates, and the visual baselines
  all pass; the full site builds.

- df7de45: Per-component **playground with editable props** in the Component Browser.

  Each live island is now a playground (the Doxee-hub model): a typed controls panel
  edits the real compiled component's props and re-renders it live, alongside a code
  snippet that reflects the current props.

  - `build/showcase-islands.jsx` gains a `Playground` harness — controls are declared
    per component as typed defs (`boolean` → checkbox, `number` → number input with
    min/max/step, `enum` → select, `text` → text input). Editing a control updates
    state and re-renders the actual `dist/frameworks/react` component; controlled
    props (slider value, segmented value, switch checked, pagination page, cron/date
    value…) are two-way, so dragging the component and editing the control stay in
    sync. A `<CrX … />` snippet updates with the props.
  - All 22 islands are playgrounds: accordion (`single`), tabs (`active`), menu
    (`label`/`align`), combobox, palette (`open`), tree, drawer (`open`/`side`),
    popover/hover-card (`align`…), segmented, radio-group (`row`), slider &
    number-field (`value`/`min`/`max`/`step`/`disabled`), pagination, date-time
    (`kind`…), cron-field, modal, switch, select, tooltip, table
    (`sortable`/`selectable`/`sticky`), toast-region (`position` + a push button).
  - Controls use implicit label association (no ids), so nothing collides across the
    independently-mounted roots and every input keeps an accessible name; the showcase
    a11y gate stays green in all four themes.
  - `tests/showcase-islands.spec.mjs` adds a gate that editing a control re-renders the
    live component (segmented value via the select, slider `disabled` via the checkbox)
    and that the code snippet reflects it.

  Verified: full build, verify, and the whole e2e suite (a11y + islands + visual, four
  themes — 15 tests) pass.

- 2dba26a: Add a full **composition example** so the combined vocabulary is reviewable as
  both pixels and code:

  - The gallery leads with a **composed operator's screen** — condensed masthead +
    registration ticks, keyed hero, severity shapes beside colour, seeded sigils per
    session, arrow-rail, a texture + scanline bezel, chrome (plate/tally), keyed
    tiles, and exactly one Law-9 breach — inside `.demogrid` so it's contrast-gated
    in every theme.
  - `references/components.md` — the thin "instrument" example is replaced with the
    identical copy-ready `cr-` markup for that screen, plus the minimal layout glue.
  - Fix: `.cr-tally` now uses `--ink` (was `--sig-done`, which failed AA on the light
    paper ground).

  All four themes pass the a11y gate; visual baselines refreshed.

- 64c5f26: Consolidations from the critic review (capability-preserving — nothing lost):

  - **`.cr-mark` is now a preset of `.cr-trim`.** The two corner-bracket primitives
    shared an implementation; `.cr-trim` gains a `--cr-trim-off` offset var and
    `.cr-mark` is the ink-weight registration preset that reuses the same rules.
  - **Shipped the specced-but-missing diagonal primitives** `.cr-chev` (direction),
    `.cr-notch` (state), and `.cr-wedge` (active-panel focus) — the catalog already
    listed all four (with the arrow-rail); now the CSS exists and there is a live
    gallery demo across all four themes.
  - **Canonical tag tone vocabulary.** `.cr-tag--done/--work/--wait/--err/--idle/
--accent` match the signal ramp (the same words a StatusDot/Toast asserts). The
    older tell-time aliases (`--now/--later/--no`) are retained.
  - **Wired the `--dur-press` motion token** into the switch and tooltip transitions
    (it was defined but unreferenced).
  - **Cataloged the orphan decoration utilities** (`cr-scrollbar`, `cr-ruler`,
    `cr-bg--field`, `cr-stripe`, `cr-blob`, `cr-trim`, `cr-mark`) under a new
    `decoration-utilities` catalog entry.

- 805d345: `CrCronField` is now a proper, message-driven form field — the last field still
  carrying the old hand-set `invalid` boolean. **Breaking (pre-1.0):** `invalid?:
boolean` is replaced by `error?: string`, and `id` is now required.

  It now matches the `CrField` contract exactly: a real `<label for>` (with the
  required marker), `error` as the single source of truth (drives `aria-invalid`,
  renders the message as `role="alert"`, links it via `aria-describedby`), the live
  human-readable `description` readout linked as a description, plus `required`,
  `disabled`, `name`, and `onBlur`. Validity comes from the host's parser as a
  message (pass `error` when cronstrue throws, `description` when it parses) — never a
  guessed boolean.

  Callers updated (component browser playground, console example); registry + spec
  (components.md) updated; CSS gains the error border + disabled state. All gates
  green (islands, a11y, responsive, visual, verify).

- ee9fbbe: `CrDataGrid`: full keyboard navigation (closing the documented follow-up). The grid
  is a single tab stop and implements the WAI-ARIA **active-descendant** grid pattern
  — Arrow keys, Home/End, and PageUp/PageDown move an active cell tracked in state and
  surfaced via `aria-activedescendant`, ringed with `.cr-grid__cell--active`. Because
  navigation is coordinate-based (not per-cell `focus()`), it survives virtualization:
  moving to a row that was windowed out scrolls it into view first. Header sort buttons
  and row checkboxes remain natively Tab-focusable.

  New islands e2e drives the keys (active cell moves, gets the ring, and PageDown pages
  past the first window with the target scrolled into the rendered set). Docs updated.
  All gates green.

- 3fa9a4d: CrDataGrid now supports variable-height rows. `rowHeight` accepts either a
  fixed `number` (the fast O(1) virtualization path) or a `(row, index) => number`
  function. In variable mode, row offsets come from a prefix-sum and the visible
  window is located with a binary search, so the grid stays virtualized —
  thousands of differently-sized rows render only the on-screen slice. Keyboard
  navigation and `scrollRowIntoView` are height-aware in both modes.
- 57947b3: New component: **`CrDataGrid`** — a dense, **virtualized** data grid, the deep data
  component the dashboard vertical was missing. Only the rows in (or near) the
  viewport are in the DOM (fixed row height; a sizer preserves scroll height and the
  window is offset with `translateY`), so thousands of rows scroll smoothly.

  - **Sortable** headers (asc → desc → none, stable, non-mutating) with `onSortChange`.
  - **Selectable** — checkbox column + select-all + `onSelectionChange`, keyed by `rowKey`.
  - **Sticky header**; grid a11y (`role=grid`/`row`/`columnheader`/`gridcell`,
    `aria-sort`, `aria-rowcount`, `aria-selected`). Div-grid (not `<table>`) so the
    virtualization offset composes across all six targets. Full arrow-key cell
    navigation is a documented follow-up.

  Ships across the toolchain: compiles cleanly (verify:types), SSR-renders under
  Vue/Svelte/Solid (framework gate), and a new islands e2e drives a **2,000-row**
  demo — asserting the DOM holds only a small window, that sorting/scrolling shift it,
  and that select-all reports the full count. Registry + `components.md#data-grid`
  added; gallery visual baseline refreshed. Fixes another Mitosis/React stale-read
  (selection callback read state right after setting it) by passing the next map
  explicitly. All gates green.

- a0650ad: Deepen the component layer from the original dashboard: ship the cataloged-but-
  unshipped instrument pieces — Masthead (`cr-masthead`), Nav rail (`cr-nav` with
  brand, items, active state, count badge), Table (`cr-table`), and the keyed
  contact sheet (`cr-tiles`/`cr-tile` in all six states) — plus interaction states
  (`cr-row--event`, `cr-chip--stamp`, `cr-btn--kick`) and Button sizes/signal
  variants. Adds `--on-accent` and `--on-idle` contrast-safe on-colors so accent
  and idle fills clear WCAG AA in every theme; all four themes pass the a11y gate.
- 603a0bb: Strengthen and characterize the design language. Add **Law 8 — "The machine
  reports; it does not chat"**, a voice/microcopy law (present tense, datum first,
  no apology or cheer, never first-person), grounded in the operational-readout
  references (Pip-Boy, NERV telemetry). Add **"The stance"** preamble (the system is
  an operator's instrument) and a **"Signatures — the tells"** identity checklist —
  the nine concrete marks that make a screen unmistakably Control Room. Add the
  `.cr-mark` registration-tick motif (industrial crop marks; ink weight, never a
  signal) and apply it to the masthead. "Seven laws" → "eight laws" throughout;
  checklist gains L8 + a Signatures gate. a11y passes all four themes; baselines
  refreshed.
- 2005dad: Extend the Component Browser playgrounds to 39 components.

  Added editable-props playgrounds for the presentational and form components, on top
  of the 22 interactive ones:

  - **Button** (kind/size/disabled + text), **Tag** (tone + text), **Chip** (tone +
    text), **StatusDot** (state/label), **Kbd** (keys/hint/on), **Checkbox/Radio**
    (type/label/checked/disabled), **Alert** (signal/title/message/dismissible),
    **Toast** (signal/message), **Meter** (value/max/tone/label), **Progress**
    (value/max/indeterminate/tone/label), **Text Input** (placeholder/disabled/invalid),
    **Textarea** (same), **Form Field** (label/value/placeholder/hint/error),
    **Breadcrumb** (label), **SessionRow** (name/status/state/event), **EmptyState**
    (message), **Panel** (title/weight/inset + body).

  - The harness gained a `children` control type so components whose content is
    children (Button, Tag, Chip, Panel) get an editable text/body field, and the code
    snippet renders it as inner text (`<CrTag tone="done">shipped</CrTag>`).

  - Bare inputs (`CrInput`, `CrTextarea`) are composed with an associated `<label>` for
    an accessible name, matching the `CrSelect` pattern; the showcase a11y gate stays
    green across all four themes with 39 live components on the page.

  The drift guard (registry ↔ emitted mounts) and the control-edit gate cover the
  expanded set. Full build, verify, and the e2e suite (a11y + islands + visual) pass.

- 661919a: Forms: conditional fields. A field may carry a `when(values) => boolean`
  predicate (via `overrides`) — it renders **and validates only when the predicate
  holds** for the current values. Hidden fields are pruned from the validated
  payload, so a hidden required field never errors and its stale value isn't
  submitted. `when` reads the whole form's values, so visibility can depend on any
  other field (including across groups and array items).

  Component browser Form playground gains a conditional `contact email` shown only
  when `notify` is checked. Docs: forms.md "Conditional fields". New forms-core
  passthrough test + an islands e2e that toggles the field, validates it while
  shown, and confirms it's pruned when hidden. All gates green.

- 046f47d: Forms: controlled `errors` prop + prove the schema-driven form in the real app.

  - **`CrForm` controlled `errors`** — besides the synchronous `validate` prop,
    `CrForm` now accepts an `errors` map (dotted path → message) that is always
    shown, merged over the internal validator's. Use it for server-side errors, or
    to drive validation from the parent. This is also what makes `CrForm` usable
    under **Qwik**, whose function props are async QRLs that can't return a value —
    so instead of a synchronous `validate`, you validate in the async
    `onChange`/`onSubmit` handler and feed the result back through `errors`.
  - **`examples/console` integration** — the Qwik dashboard gains a "provision a
    session" form: one ArkType schema drives the render model and validation; the
    inline disclosure validates in its QRL handlers and feeds errors back via the
    controlled prop. The Form Model is plain serializable data, so it crosses Qwik's
    SSR boundary, and ArkType is code-split into a chunk Qwik lazy-loads only when
    the form validates.

  Verified via the console's client + SSR vite builds (both green) and the
  design-system gates (forms unit, React islands, a11y, type). Note: the full
  `qwik build` type-check is slow because ArkType's type-level inference is heavy —
  a known ArkType tradeoff — so the console is validated through the vite
  client/server builds rather than that bundled tsc pass. Docs: forms.md gains a
  "Controlled errors (server-side & Qwik)" section.

- 110f2b2: Forms: configurable validation modes + dirty tracking & reset. `<CrForm>` gains
  `mode` (`"blur"` default · `"change"` · `"submit"`) for when a field **first**
  validates and `revalidateMode` (`"change"` default · `"blur"`) for when an
  already-validated field re-checks — matching React-Hook-Form's model. A showing
  error always clears on change so a fix registers immediately; a submit always
  validates every visible field regardless of mode.

  The form now tracks **dirty** state against the seed `values` and, while dirty,
  renders a **Reset** button that restores those seed values and clears all
  error / touched / pending state. Toggle it with `resettable={false}`, relabel via
  `resetLabel`, and hook `onReset`. Docs: forms.md "Validation modes" and
  "Dirty & reset". New islands e2e asserts the default blur-first mode (a pristine
  field doesn't error until blur) and the dirty→Reset→pristine cycle. All gates green.

- 4500d81: Forms: async validation, submit lifecycle, and a form-level error summary.

  - **Async `validate` / `onSubmit`** — both may now return a Promise (server-side
    uniqueness checks, remote submit). `CrForm` normalises sync and async the same
    way.
  - **Pending submit state** — while validation or submit is in flight the submit
    button is disabled, `aria-busy`, and shows `pendingLabel` (default "Submitting…"),
    so a slow submit can't be double-fired.
  - **Error summary** — after a failed submit `CrForm` renders a form-level
    `role="alert"` region listing every problem with an in-page link to the field;
    it clears once the form validates. Opt out with `errorSummary={false}`.

  Docs: forms.md "Submit lifecycle, async validation & error summary". Islands e2e
  asserts the summary appears on a failed submit (with per-error links) and clears
  on a valid one. a11y (4 themes), responsive, visual, islands, forms, and type
  gates all green.

- 6c74435: Forms: autocomplete sources for select fields. A `select` can now draw its options
  from a **source** instead of a fixed list — a searchable combobox.

  - New field `kind: "autocomplete"`. The source is a **static array**, the field's
    own **enum** (making a plain select searchable, no `source` needed), or an
    **async** `(query) => Promise<{value,label}[]>` for a remote lookup. Setting a
    `source` on a field implies `kind: "autocomplete"`.
  - `CrForm` renders it as a `role="combobox"` (aria-expanded / aria-controls) over
    a `role="listbox"`: type to filter or trigger the async load, `↑`/`↓` move the
    active option, `Enter` selects, `Esc` closes. The picked option's **value** is
    stored (and schema-validated) while its **label** is shown. Per-field query /
    open / results / loading state is keyed by dotted path, so autocompletes inside
    groups and array items work too.

  Component browser Form playground: `region` is now a searchable enum and a new
  `owner` field uses an async source (a simulated remote person lookup). Docs updated
  (new Autocomplete section). Islands e2e extended to drive both the static and async
  autocompletes end to end (pick stores the value, not the label). a11y (4 themes),
  responsive, islands, visual, type, and forms gates all green.

  Build note: converted the CrForm source's inline `//` comments to block comments —
  with Mitosis's React formatter off, a `//` comment can collapse onto one line and
  comment out the code after it.

- 43b2068: Forms & feedback components (the shadcn/PrimeVue gaps for an operator dashboard):

  - **CrRadioGroup** — single-choice group (`role=radiogroup`) with roving tabindex
    and `↑`/`↓`/`←`/`→` selection; square radios (radius 0, filled inner square).
  - **CrSlider** — a styled native range input, so keyboard + AT support come free.
  - **CrProgress** — task progress (`role=progressbar`): determinate fill or an
    indeterminate hazard sweep; distinct from Meter (a static capacity reading).
  - **CrAlert** — inline callout keyed to a signal (info/wait/done/err) with a left
    brush-bar; `err` announces assertively; optional dismiss.
  - **`.cr-skeleton`** — a blocky loading pulse (line/text/block), frozen under
    reduced-motion.
  - **`.cr-dl`** — a key→value data/description list for detail panels.

  All demoed in the gallery (four themes), cataloged, documented (with a
  keyboard-nav table update), and composed into `examples/console`. Verified end to
  end: radio arrow-select, slider keyboard, alert dismiss, both progress modes.

- 595c56a: Add form controls and the instrument shell. Form controls: Field wrapper
  (label + hint + non-color ✗ error), Text Input, Textarea, Select, square
  Checkbox/Radio, and a keyboard-operable Switch (`button[role=switch]`) — all on
  the recessed board surface with the system focus ring, disabled + error states.
  `cr-instrument` composes the Nav rail and a board (masthead/hero + panels) into
  the full dashboard chassis. All demoed in the gallery and passing the a11y gate
  in every theme; cataloged (23 components) and documented.
- af2ed27: Forms core: JSON-Schema **composition**. `defineForm` (and the underlying
  converter) now resolve the three composition keywords when normalising a JSON
  Schema — including the `$ref`/`$defs` ArkType itself emits for reused types:

  - **`$ref`** — local pointers (`#/$defs/…`, `#/definitions/…`) resolve against the
    root schema, so shared definitions render + validate wherever referenced (remote
    URLs are not fetched).
  - **`allOf`** — branches merge into one schema (`properties` combine, `required`
    unions): the extend-a-base pattern.
  - **`oneOf`/`anyOf`** — compile to a validating ArkType union; the field renders as
    its first non-null branch's widget while validation honours the whole union.

  Detection (`isJsonSchema`) now recognises a schema expressed purely through
  composition. Cyclic `$ref` is intentionally not expanded (the Form Model stays
  finite) — documented in forms.md "Composition". Three new forms-core node tests
  ($ref group + nested error path, allOf merge of properties/required, anyOf union).
  All gates green.

- 031003e: Forms: nested objects & arrays. The schema-driven form now handles structure, not
  just flat records.

  - **Core (`lib/forms`)** — `toFormModel` recurses: an object property becomes a
    `group` field (with `fields`), an array becomes an `array` field (with an `item`
    descriptor — a scalar field or a group). `jsonSchemaToArkDef` and coercion
    recurse to match, and validation error keys are the full dotted instance path
    with array indices (`limits.cpu`, `members.1.email`). Nested overrides use the
    dotted path (`overrides["hooks.url"]`), and an array override may set
    `itemLabel`.
  - **`CrForm`** — renders nesting from a FLAT render-list built by walking the
    model + current values; the recursion is in JS, the DOM stays flat and indented
    by depth. Groups render a labelled section; arrays render add / remove controls
    and repeat their item (scalar rows carry an inline remove, object items get a
    header). State is keyed by dotted path, so one array item's field validates
    independently. Depth is unbounded — no component self-recursion. Still never
    imports ArkType.

  The component browser's Form playground gains a nested `limits` group, a scalar
  `tags` array, and an object `hooks` array (with an ArkType ⇄ JSON Schema toggle).
  Docs updated (removed the old "flat records only" limitation). New forms-core unit
  tests for nesting + a nested-form path in the islands e2e. a11y (4 themes),
  responsive, islands, type, and forms gates all green.

- 16ed8e4: Add per-framework package export entries. Apps can now
  `import { CrSwitch, CrModal } from "@control-room/design-system/react"` (and
  `/vue`, `/svelte`, `/angular`, `/solid`) instead of reaching into
  `.../frameworks/<t>/components/<Name>`. A generated barrel per target
  (`build/build-barrels.mjs`, chained into `build:components`) re-exports every
  compiled component's default (Angular also re-exports each `<Name>Module`); the
  deep single-component path still resolves via `./frameworks/*`. Barrels ship as
  source under the git-ignored `dist/frameworks/**` and regenerate on every compile.
- 14d237d: Governed motion: glitch, idle attention, keyed interaction, and a sanctioned 3D break.

  Fills the gap between the "keyed motion" law and the implementation. New tokens
  (`--dur-fast|med|ambient`, `--ease-snap|step`) and four opt-in utilities, all
  transform/opacity/shadow-only (60fps) and silenced by both `prefers-reduced-motion`
  and the `calm` intensity profile (idle loops stop; interaction feedback stays):

  - **`.cr-glitch`** (`data-text`) — RGB-split datamosh on hover; `--on` for continuous alerts.
  - **`.cr-attention`** — a slow breathing glow to pull the eye to the one primary/"needs you"
    action (keys to `--cr-attn`).
  - **`.cr-keyed`** — a keyed edge-sweep on hover/focus for interactive rows/cards/nav.
  - **`.cr-tilt` / `--live`** — a perspective hover tilt (with optional idle float): a
    sanctioned break of the flat plane, used sparingly like the Law-9 breach.

  Demoed in the gallery (four themes) and documented in `references/motion.md` with the
  governance + restraint rules. verify, verify:types, a11y (gallery + showcase), and
  responsive pass; visual baselines refreshed.

- 6a029a0: Hover card, tree, and date/time + cron scheduling.

  - **CrHoverCard** — a rich hover/focus card for structured content (Tooltip is for
    plain text, Menu for actions). CSS-driven reveal with an open delay; the trigger
    is focusable so keyboard users get it too.
  - **CrTree** — a hierarchical `role=tree` (worker→session fleets, config trees),
    rendered as a flat list of visible rows with full keyboard nav (`↑`/`↓`/`Home`/
    `End`, `→` expand/step-in, `←` collapse/step-out, `Enter`/`Space` toggle+select)
    and correct `aria-level` / `aria-expanded`.
  - **CrDateTime** — a styled native `datetime-local` / `date` / `time` input.
  - **CrCronField** — a cron-expression field with quick presets and a live
    human-readable readout. The translation is **injected** as `description` so the
    design system stays dependency-free; the `examples/console` app wires
    **cronstrue** and derives it reactively with `useComputed$`.

  All demoed in the gallery (four themes), cataloged, and documented (+ keyboard-nav
  rows). In `examples/console`: a breadcrumb-adjacent `health` hover card, a
  worker→session tree in the inspector drawer, and a maintenance-schedule panel where
  the cron expression is translated live (e.g. `0 9 * * 1-5` → "At 09:00 AM, Monday
  through Friday") next to a first-run date-time. Verified end to end; a11y + baselines
  refreshed.

  Note: authoring guard — keep `.lite.tsx` header comments to plain ASCII; slashes and
  arrow glyphs (↑ → etc.) in a JSDoc block can make the Mitosis codegen collapse
  statement newlines and break the React output.

- bddb959: Add CrIcon — the house operational icon set.

  The system had no icon primitive (only text glyphs, canvas sigils, ASCII), which is a
  gap for an operational product and the one place it would otherwise reach for emoji or
  a mismatched library. Ship a bespoke set that fits the neobrutalist geometry rather
  than adopting a rounded library:

  - **Contract:** 24×24, single 2px stroke, `currentColor`, no fill, square caps + miter
    joins. Sizes on the space grid via `size` (default 20). Decorative by default
    (`aria-hidden`); pass `label` to expose it as a named image.
  - **24 operational glyphs:** play, pause, stop, retry, deploy, scan, search, alert,
    error, done, clock, cpu, logs, filter, sliders, close, chevron, plus, minus, trash,
    external, copy, session, menu. Add one = one single-`d` path in the map.
  - Cataloged (media), documented (components.md#icon), and exercised in the component
    browser as a playground (name/size/label) plus a live grid of the whole set.

  Compiles clean to React/Vue/Qwik (the path map lives in a store getter so codegen keeps
  it), type-check + a11y + responsive + islands gates pass.

- 759bd73: Loudness dials — a `calm` operations profile alongside the default showcase look.

  The system is deliberately loud (texture, per-row decoration, keyed motion). That's
  right for a showcase and can be a notch much for 8-hour operational use. Make loudness
  a **product setting**, not a global redesign:

  - New tokens `--motion-intensity` and `--decoration-intensity` (both `1` by default).
  - Set `data-intensity="calm"` on `<html>` for the ops profile: non-essential animation
    is dialed to a reduced-motion equivalent and decorative texture layers (`.cr-tex--*`,
    which follow `--decoration-intensity`) are toned down. The default (no attribute) is
    the unchanged loud/showcase profile, so nothing regresses.

  Verified: the default gallery is byte-identical in visual regression (all four themes);
  a new gate confirms the `calm` profile flips both tokens.

- 5a3ab78: Keyboard navigation + a key-hint (keycap) badge system.

  - **Keyboard nav** on the interactive widgets (WAI-ARIA patterns):
    - **CrTabs** — roving tabindex: `←`/`→`/`↑`/`↓` move, `Home`/`End` jump; only the
      active tab is tabbable.
    - **CrMenu** — opens on click or `↓`, then `↑`/`↓`/`Home`/`End` move between items,
      `Esc` closes and restores focus to the trigger, first item is focused on open.
    - **CrTable** — sortable headers are now real `<button>`s, so sorting is operable
      with `Enter`/`Space` (previously mouse-only).
    - (Nav resolves elements via `closest()`, not `event.currentTarget`, so it works
      under Qwik's delegated events.)
  - **Key hints**: new **`CrKbd`** keycap badge — always-on for main actions, a
    `--hint` variant for secondary actions that reveals on host hover/focus or a
    global peek; new headless **`CrKeyHints`** behavior (hold `Alt` to reveal every
    hint at once via `:root[data-cr-keys]`). Badges are `aria-hidden`; the real
    binding rides **`aria-keyshortcuts`** — `CrButton` gained a `keyshortcuts` prop.
  - New CSS: `.cr-kbd` / `--hint` / `--on`, `.cr-keys-host`, and a button-reset
    `.cr-table__sortable`. Gallery demos (all four themes) + a "Keyboard navigation"
    reference table; all three wired into `examples/console` with real shortcuts
    (`i` incident, `n` notify, `1–4` theme) and verified end to end.

- bd8124b: Add **Law 9 — The Breach**: the one sanctioned rule-break per screen. A system of
  hard laws earns a single licensed transgression, and the transgression is what
  makes the rigor felt.

  - `.cr-breach` licenses the forbidden vocabulary on ONE element — a soft corner
    (`--breach-radius`), a colour glow, a blurred blob (`::before`), an optional
    `--wash` gradient, and an `--alive` breathing glow (off under reduced motion) —
    keyed to a signal (default accent). `.cr-blob` is a standalone soft accent.
  - `CrBreach` component (all 5 targets, class-only — no inline style).
  - New `--breach-radius/-blur/-glow-size` chassis tokens: the only place radius,
    blur, and a soft glow are licensed, kept explicit and greppable.
  - Docs: Law 9 in design-language (+ "one breach per screen" rule, applying-the-laws
    step 9), components #breach, tokens, and the ship checklist now note the single
    exception on the square/shadow/gradient rules. "Eight laws" → "nine laws"
    throughout. Catalog +1 (29 components). a11y passes all four themes.

- afd2eb5: CrLineChart gains a **gap-collapse ("market-hours") axis**: set `xBreak` on a
  continuous `x` (sorted ascending) to compress idle gaps — nights, weekends,
  holidays — so session data reads without empty stretches, the way a trading chart
  does. Any gap larger than `xBreakGap` (default ~3× the typical sample gap) is
  collapsed and marked with a dashed break line, and the axis shows one tick per
  session day. It works from the data's own gaps — a series carrying only session
  points drops its closed periods automatically, no exchange calendar required. The
  compression is ordinal (within-session spacing stays proportional; collapsed gaps
  are not to scale). Adds a `market` showcase option (session-only Thu/Fri/Mon demo)
  and an islands test asserting break markers appear and ticks are per-day.
- fd8cd10: CrLineChart gains a base-10 **log y-scale** (`yScale="log"`) for metrics that span
  orders of magnitude (latency p50→p99, payload sizes). The domain snaps to powers of
  ten; ticks are `1·2·5×10ᵏ` for a few decades or plain powers of ten for many, with
  the usual compact labels (`10`, `1k`, `100k`). Non-positive values are clamped to
  the axis floor, and a series with no positive data falls back to linear. Default
  stays linear (backward-compatible). Bar charts remain linear (baseline-anchored at
  zero, where log is undefined). Adds a `yScale` showcase control (with a wide-range
  demo series) and an islands test asserting the axis spans decades on powers of ten.
- b5d250a: CrLineChart gains a continuous/time x-axis and an interactive legend.

  - **Continuous x-axis:** pass `x` (numbers parallel to each sample) to place points
    by value on a real linear x-scale with nice ticks and faint vertical gridlines;
    add `xTime` to treat `x` as epoch-ms and label ticks at round clock intervals
    (`HH:MM`, UTC). Without `x` the axis stays categorical (`labels`).
  - **Interactive legend:** for ≥ 2 series the legend keys are keyboard-operable
    buttons — click to isolate/restore a series. Hidden series leave the plot, the
    tooltip, and the auto y-domain, so isolating one refits the y-scale. `role="img"`
    and the spoken summary moved to a graphic wrapper so the legend buttons are never
    nested inside an image subtree (axe `nested-interactive`-clean).

  The static gallery generator mirrors both (a time-axis demo card; legend rendered
  as buttons). Adds islands tests for legend isolate/restore and clock-time ticks.

- c6a0657: CrLineChart gains an **`xFormat` escape hatch** — `xFormat={(value) => string}`
  relabels the chosen tick positions and the hover stamp when no preset fits (ISO
  variants, relative stamps, retail-calendar labels, other locales). It sits at the top
  of label precedence, overriding `xLocale` / `xWeek` / `xFiscalStart` / clock format;
  positions still come from the active scale. The same hook is on the util:
  `timeTicks(lo, hi, { format })`.

  Also hardens option interactions so a flat bag of axis props can't produce garbled
  output: options outside their mode are inert, `xBreak` on non-time numeric `x` now
  labels ticks by value (no bogus calendar interpretation), and the resolution order is
  documented (which x-axis → tick-text precedence → granularity picks the sub-option;
  `yScale` orthogonal). Adds `format` unit-test coverage, a `customLabels` showcase
  toggle, and an islands test for the override.

- 2df9b57: Component Browser demos are now the **real compiled components**, live and interactive.

  Previously each demo was hand-authored static HTML styled with the shipped CSS —
  faithful to the look, but not the actual component, and not interactive. Now the
  browser mounts the genuine compiled React output (`dist/frameworks/react`) as
  client-side islands:

  - **22 live islands** — accordion, tabs, menu, combobox, command palette, tree,
    drawer, popover, hover-card, segmented, radio-group, slider, number-field,
    pagination, date-time, cron-field, modal, switch, select, tooltip, table, and
    toast-region — each the shipped component with a tiny stateful wrapper so
    `onChange` actually drives it. Controlled inputs update, tabs switch, the tree
    expands, overlays open, toasts stack and dismiss. Purely-presentational
    components keep their static all-states grid (clearer as a states catalog).
  - `build/showcase-islands.jsx` imports the real components; `build/build-showcase.mjs`
    esbuild-bundles it (minified IIFE) and inlines it, so `components.html` stays a
    single self-contained file for GitHub Pages. A live cell is marked
    "live · interactive"; markup is never hand-written — no drift.
  - **Codegen fix (surfaced by bundling).** The compiled React output for
    `CrCombobox` and `CrPalette` didn't compile: a store method `setQuery` collided
    with the `[query, setQuery] = useState()` setter Mitosis generates. Renamed the
    method to `onQuery` in both sources. Nothing type-checked the React output before,
    so this had shipped broken.
  - **a11y (found by the new live gate).** The real `CrSelect` is a bare `<select>`
    with no label prop — flagged for a missing accessible name — so the demo now
    composes it with an associated `<label>` (correct real-world usage).
  - New gate `tests/showcase-islands.spec.mjs`: asserts all islands mount error-free,
    that the registry matches the emitted mount points (drift guard), and that they
    stay interactive (tabs/switch/accordion driven). Wired into CI. The showcase a11y
    gate now covers the live components too.

  Tooling: `react`/`react-dom`/`esbuild` added as devDependencies (build-time only,
  not shipped); `build:components` now runs before `build:showcase` in `build` and
  `pretest:e2e`.

- f3dd192: Overlay + navigation essentials: menu, pagination, and a toast region.

  - **New `CrMenu`** — a dropdown of actions. The trigger toggles a `role=menu`
    panel; a transparent full-viewport scrim closes it on outside click (no global
    listeners, so every framework target behaves identically). Optional `danger`
    items and left/right alignment.
  - **New `CrPagination`** — a controlled pager: prev/next plus a windowed run of
    page numbers with ellipses; current page keyed and `aria-current`, prev/next
    disabled at the bounds.
  - **New `CrToastRegion`** — a fixed screen corner that stacks live toasts (parent
    owns the list); each toast stays its own live region so nothing double-announces,
    and bottom corners stack newest nearest the edge.
  - All three are demoed in the gallery (all four themes) and composed into the
    `examples/console/` Qwik app — verified toggling, paging, and dismissing end to
    end.

- 44d2f37: Every component is now authored once in Mitosis (`components/*.lite.tsx`) and
  compiles to idiomatic React, Vue, Svelte, Angular, and Solid
  (`npm run build:components` → `dist/frameworks/`). 23 components total — the full
  library, including the imperative seeded pixel-cat (`<canvas>` painted in
  onMount, ref resolved correctly per target). Components apply the `cr-` classes
  and carry no styling, so all targets are identical and the token/CSS layer stays
  the single source; static components remain usable as plain classes for
  server-rendered / uncompiled contexts. CI compiles all targets on every push.
  Docs: `references/frameworks.md`.
- c6b8c37: Navigation & input components, with ASCII detailing in lists and separators.

  - **CrBreadcrumb** — navigation trail with ascii `/` separators and `aria-current`.
  - **CrSegmented** — single-select connected button bar (radiogroup semantics +
    roving tabindex: `←`/`→`/`Home`/`End`).
  - **CrCombobox** — autocomplete: an input (`role=combobox`) filtering a listbox,
    `aria-activedescendant` nav, scrim outside-close; the active option shows an
    ascii `▸` marker.
  - **CrNumberField** — number input with `−`/`+` steppers, clamped to min/max.

  **ASCII detail utilities** (structure, never a signal):
  - `.cr-sep` / `.cr-sep--dot` / `--double` and `.cr-sep-label` — box-rule separators
    (dashed/dotted/double; labeled `── LABEL ──`).
  - `.cr-list` (`--dot` `--tick` `--plus`) — ascii-marker lists (`▸ · » +`).
  - `.cr-leader` — dot-leader rows (`label ········· value`).

  All demoed in the gallery (four themes), cataloged, documented (+ keyboard-nav
  rows), and composed into `examples/console` — a breadcrumb above the masthead, a
  scope segmented + worker combobox + max-retries number field in the queue controls,
  and the inspector drawer rebuilt with dot-leaders, a labeled rule, and a marker
  list. Verified end to end.

- 42531e7: Characterize the system (2026 refresh, batch): a bolder, more distinctive look
  grounded in current trends.

  - **OKLCH palette** (`build/build-palette.mjs`, culori): grounds become chromatic
    near-black (violet-biased), signals are regenerated vibrant at consistent
    perceived lightness/chroma, and each fill's on-colour is auto-picked by WCAG
    contrast. Dark + extreme fully regenerated; light + phosphor keep character.
  - **`--sig-accent-2`** — a second action key (acid / violet / aqua-green per
    theme) with `--on-accent-2`, wired through tokens, Tailwind, and DTCG.
  - **Texture tokens + utilities** — `--dither`, `--scanline` (+ existing halftone)
    with `.cr-tex--halftone/-dither/-scan/-glass` for neo-print / CRT grain on
    hardware surfaces only (Law 6).
  - **Seeded cyber-sigil** — `CrSigil` (all 5 targets), a retro-futuristic
    identity-from-seed pixel glyph (cyber-sigilism), state-keyed; catalog + docs.
  - **Ambient loops** — `.cr-anim-scan/-pulse/-drift/-flick`, low/slow, hardware-
    bound, reduced-motion-off (Law 7 ambient floor).
  - **`cn()` helper** (`@control-room/design-system/cn`, clsx + tailwind-merge) for
    composing/de-conflicting classes with Tailwind utilities.

  Docs: design-language (chromatic black, second key, +2 tells), tokens (OKLCH +
  textures), motion (loops), new seeded-sigil reference. All four themes pass the
  a11y gate.

- 2a2cc3d: Operator essentials — a real table, tabs, meters, and the tokens they need.

  - **`CrTable` is now a real operator table**: optional column **sort** (`aria-sort`
    - indicator), row **selection** (checkbox column + `tr[aria-selected]` wash), and
      a **sticky** header. Row hover keys to `--state-hover-mix`.
  - **New `CrTabs`** — `role=tablist` with a keyed active underline.
  - **New `CrMeter`** — a token-driven capacity bar (`role=meter`, aria value attrs)
    keyed to a signal tone.
  - **New chassis / interaction tokens**: `--brd-hair` (1.5px hairline),
    `--shadow-off-sm` (small floating pieces), and theme-independent interaction
    constants `--state-disabled-op`, `--state-hover-mix`, `--row-h`.
  - The **`examples/console/`** Qwik app now composes all three in a Queue panel,
    verified building and resuming (sort, select, tab-switch, meters) end to end.

  Also hardened the Qwik codegen fixup: it now repairs the return-less IIFE bug for
  **any** computed attribute (it was hitting `aria-selected`, not just `class`).

- 25e262b: Overlays: collision-aware positioning (a Floating-UI-lite, no dependency). New
  `@control-room/design-system/position` — `computePosition` (pure geometry: anchor +
  floating + viewport → coords, with **flip** to the opposite side when there's no
  room and **shift** along the cross axis to stay on-screen), plus `place` /
  `autoPlace` (DOM helpers; autoPlace keeps a panel pinned on scroll/resize). Fully
  unit-tested (`test:position`, 7 cases).

  `CrPopover` now uses it: on open the panel anchors to the trigger, flips above when
  needed, and shifts to never clip off the viewport, tagging `data-placement`. A new
  islands e2e opens the popover and asserts fixed positioning + in-viewport bounds.

  Also fixes a latent Mitosis/React stale-read bug in `CrPopover.toggle()` (it read
  `state.open` right after setting it, so `focusPanel` — focus-move-into-panel on open
  — only fired on close); computing the next value once restores focus-on-open across
  targets. Docs: components.md "Popover · Positioning". All gates green.

- e7e891c: Add the overlay family — Modal, Toast, and Tooltip — as `cr-` classes and Mitosis
  components (all five framework targets). Modal is built on the native `<dialog>`
  element so the browser owns the focus-trap, Escape, and backdrop; Toast is keyed to
  a machine signal (work/wait/done/err) with the correct `role`/`aria-live`; Tooltip
  reveals on hover **and** focus via pure CSS and is wired with `aria-describedby`.
  All three pass the a11y gate in every theme. Catalog +3 (new `overlay` category).
- 6ea1e01: Palette + breach retune from review feedback (too black / too cream / not enough
  neon; breach not striking):

  - **Dark grounds lifted** — regenerated in OKLCH as a deep-violet charcoal (more
    lightness _and_ chroma), so the default theme reads as a rich surface, not a
    void. Extreme deepened to match.
  - **Light paper cooled** — the warm cream is gone; grounds regenerate as a cool
    violet-grey (`h ≈ 285`) that sits with the neon signals. (Light `--sig-accent`
    nudged darker to hold AA on the near-white panel.)
  - **Neon/acid pairings** — the breach is now the house **magenta → acid** pair
    made literal; new `.cr-btn--accent2` (acid) action; the composed scene shows an
    accent + accent-2 button pair.
  - **Striking breach** — `.cr-breach` rebuilt: a rounded **neon gradient rim**
    (padding-box/border-box) + a **dual-hue glow halo**, keyed magenta→acid, with a
    legible dark interior (the earlier flood washed out text — and axe couldn't see
    it, since it reads `background-color`). `--wash` is now a subtle tint.

  `build/build-palette.mjs` now emits grounds / signals / accent independently per
  theme. a11y passes all four themes; visual baselines refreshed.

- 240e9ce: Establish the professional, code-first workflow: Style Dictionary token build
  (CSS + Tailwind + flat JSON + DTCG), a shipped `cr-` component layer, a
  generated component catalog, an Astro + Starlight docs site with a living
  gallery, a Playwright + axe accessibility gate (WCAG AA across all four themes)
  and visual regression, the optional free Figma bridge, and multi-provider skill
  install. Includes the contrast fixes the a11y gate surfaced (`--on-err`, light
  `--on-sig`, phosphor `--muted`).
- f11ad9f: Auto-generated prop tables in the Component Browser.

  Each component card now shows a **props** table generated from the compiled TypeScript
  interface (`dist/frameworks/react/…Props`): prop name, required flag, type, and the
  JSDoc description — including `@deprecated` notes. 55 of 60 cards have one (the rest
  are utility/decoration entries with no single Props interface). Because it's derived
  from the real interface, it can't drift from the shipped API.

- 6919ce6: Qwik is now a first-class framework target, and there's a real app built on it.

  - **Added Qwik to the Mitosis targets** (`react/vue/svelte/angular/solid/qwik`) —
    all 32 components compile. New `./qwik` package export + barrel entry.
  - **Fixed a Qwik codegen bug** in a post-build step (`build/build-fix-qwik.mjs`,
    wired into `build:components`): the Qwik generator emitted the root element's
    computed `class` as an IIFE with no `return`, so 5 components shipped without
    their classes. The fixup adds the `return`; a `--check` mode guards it.
  - **`examples/console/`** — a real Qwik City dashboard consuming the tokens, the
    `cr-` classes, and the compiled Qwik components (`CrButton`, `CrSwitch`,
    `CrModal`, `CrShape`, `CrSigil`, `CrChip`). Live theme switching across all four
    themes, per-session toggles, the Law-9 Breach, seeded sigils + severity shapes,
    and a modal — verified building and resuming (events work) end to end.

- a64231b: Distribution: real Qwik and Vue named-export entries (package stays private).

  **Qwik** joins React as a **compiled** package — `build:pkg` now also emits
  `dist/pkg/qwik` (ESM JS + `.d.ts`, JSX via Qwik's automatic runtime, relative
  `.tsx → .js` specifiers rewritten). Prop types are re-exported from the barrel, so
  consumers get `import { CrButton, type CrButtonProps } from
"@control-room/design-system/qwik"`. `@builder.io/qwik` is an (optional) peer dep;
  the consumer's Qwik optimizer still adds QRL lazy-loading when it processes the
  package. tsc's loose ref-typing notes on the generated Qwik code are tolerated (the
  emit is correct), mirroring `verify:types`' leniency for React.

  **Vue** is elevated to a first-class entry, distributed as **SFC source** (the
  idiomatic Vue-library model — the consumer's bundler compiles the `.vue` files and
  Volar types them). `./vue` gains proper `types`/`vue`/`import` export conditions and
  `vue` as an (optional) peer dep.

  `./react`, `./qwik`, `./vue` peers are all optional (you pull in only the framework
  you use). `test:pkg` now covers all three — React renders via `react-dom/server`,
  Qwik imports + loads its named exports, Vue's SFCs are structurally verified — and
  each asserts typed declarations ship with no `.tsx` leaking. Docs: frameworks.md
  "Consuming the packages". All gates green.

- 5d7acb6: More glitch, used randomly — plus the long-documented cursed text, finally implemented.

  - **Random glitch driver** — a governed ambient driver in the shared browser
    script fires brief bursts on **opt-in** `.cr-glitch-auto` elements, **one at a
    time**, ~0.2–0.5s each, every ~2.4–5s. Never glitches the whole screen; off
    under `prefers-reduced-motion` and the `calm` intensity profile.
  - **`.cr-glitch--chroma`** — a faint always-on RGB fringe (fades with
    `--decoration-intensity`) so a readout feels unstable at rest; the slice
    animation still fires on hover / `--on`.
  - **Cursed text (`.cr-cursed`)** — Law 3's T3 decay, implemented at last: zalgo
    combining marks capped at 2/glyph, seeded (deterministic), density scaled by
    `--decoration-intensity`. The painter moves the clean string to `aria-label`,
    stamps `role="img"`, and hides the corrupted glyphs (`aria-hidden`) — so AT
    announces the clean word and never the noise.

  Gallery gains a T3-decay row (`CORRUPTED`, `CHECKSUM FAIL`, `DAEMON`) and a
  chroma-fringe auto-glitch (`SIGNAL LOST`). Docs: motion.md governed-effects table
  (+chroma, +auto, +cursed) and the restraint note. a11y passes all four themes
  (cursed text is a labeled graphic, not prohibited-attr noise); visual baselines
  refreshed; responsive + islands gates green.

- 44acd1d: Distribution: the React entry is now a **real compiled, typed package** (the
  package stays private — this just makes its framework entry point genuinely
  consumable). `build:pkg` compiles `dist/frameworks/react` into `dist/pkg/react`:
  ESM JS + `.d.ts` declarations, with relative import extensions rewritten `.tsx →
.js` so the emit resolves in both Node ESM and bundlers. `react`/`react-dom` stay
  external (declared as peer deps).

  The barrel now re-exports prop types too, so consumers get fully-typed named
  exports from one entry: `import { CrButton, type CrButtonProps } from
"@control-room/design-system/react"`. The `./react` export gained proper
  `types`/`import` conditions pointing at the compiled output; a `prepack` builds it
  so `npm pack` / workspace linking ships a usable package.

  New `build:pkg` (in the `build` chain) + `verify:pkg` (compile-only type gate) and
  a `test:pkg` consumability suite that imports the built package exactly as a
  consumer would and renders components through `react-dom/server` (asserting the
  Control Room markup + that typed `.d.ts` ship with no `.tsx` specifiers leaking).
  CI runs it. The other five framework entries remain source exports for now.

- f1bc168: RTL support + interaction-a11y verification (completing the overlay/a11y gap).

  **RTL:** the component stylesheet is now direction-agnostic — 36 physical flow
  declarations converted to CSS **logical** properties (`margin-inline-*`,
  `padding-inline-*`, `border-inline-*`, `text-align: start/end`), so the system
  mirrors under `dir="rtl"`. Pixel-identical in LTR (visual baselines unchanged). A
  guard (`test:rtl`) fails the build if a physical flow property returns, and the
  responsive gate now also checks no horizontal overflow under RTL.

  **Focus & keyboard (verified + documented):** the dialog overlays (Modal, Drawer,
  Command palette) use native `<dialog>` + `showModal()`, so focus trap and
  focus-return come from the platform; Popover moves focus in on open and returns it
  on Esc (the stale-read fix in the previous change restored focus-on-open); roving
  focus / `aria-activedescendant` is in place for Tabs, Radio group, Segmented,
  Combobox and the palette. Documented in accessibility.md ("Direction (RTL)",
  "Focus management & keyboard"). All gates green.

- 15aec65: Make the "six frameworks" claim true at runtime. Previously only React was
  runtime-tested and the other targets were type-checked only. New `test:frameworks`
  gate (harness in `build/render-fw.mjs`) compiles each target's output with its
  **own** toolchain and SSR-renders it in Node:

  - **Vue** — compiled SFC → `@vue/server-renderer`
  - **Svelte** — `svelte/compiler` (ssr) → `.render()`
  - **Solid** — `babel-preset-solid` (ssr) → `renderToString`

  Each asserts real Control Room markup with props driving the output (so a component
  that renders under React but breaks elsewhere can't slip through). Combined with the
  existing gates, verification now stands at: React (render), Vue/Svelte/Solid (SSR
  render), Qwik (import) — five of six at runtime; Angular remains build-verified only
  (its runtime needs a heavier platform-server harness), documented as the one honest
  gap. Wired into CI; frameworks.md gains a verification matrix.

- dd22c40: Schema-driven forms — standard validation from ArkType **or** JSON Schema, and a
  `<CrForm>` that builds itself from a schema. Replaces the old story where fields
  took a hand-set `invalid` boolean disconnected from any real validation.

  - **`lib/forms` (headless core)** — a framework-agnostic bridge. Feed it an
    ArkType type OR a JSON Schema and it returns a **Form Model** (plain field
    descriptors), a **validate(values)** function (backed by ArkType), the exported
    **JSON Schema**, and the ArkType type. The bridge runs **both ways**: ArkType →
    `.toJsonSchema()` → JSON Schema, and JSON Schema → an ArkType definition →
    ArkType type; the Form Model is derived from the JSON Schema so either source
    yields the same form. Coerces input strings to the schema's types (number,
    boolean); an unchecked required checkbox is a valid `false`, not "missing".
    Predicate constraints (e.g. `string.url`) degrade gracefully on export and still
    validate at runtime. Exposed as `@control-room/design-system/forms`.
  - **`CrForm`** — a schema-driven form. Give it a Form Model + a validate callback
    and it owns value/touched/error state, validates on **blur + submit**, and
    re-checks a field on change once touched. Renders text/email/url/number/select/
    textarea/checkbox by field `kind`. It never imports ArkType, so it stays portable
    across all six framework targets. (Fixed a stale-state read that made validation
    lag a field behind after the first submit.)
  - **Field primitives hardened** — `CrField` is now fully validated (controlled
    value, live `onChange`, `required` + `aria-required`, error-driven `aria-invalid`
    - `aria-describedby` + `role="alert"`, no hand-set `invalid`). `CrInput` /
      `CrTextarea` are now properly controlled (value/onChange/name/required) instead of
      uncontrolled shells.

  Component browser gains a live **Form** playground (real ArkType validation in the
  browser, with an ArkType ⇄ JSON Schema source toggle and the exported JSON Schema
  shown); gallery gets a static form snapshot. New `references/forms.md`. Catalog +1
  (65). New `lib/forms` unit tests (`npm run test:forms`) wired into CI. Build note:
  the React target runs Mitosis's formatter off + `build-fix-react.mjs` — extended
  here for the new stateful components. a11y (4 themes), responsive, islands (incl. a
  new form end-to-end test), visual, type, and forms gates all green.

- 2de5fed: Add Tailwind-first authoring: a Tailwind v4 `@theme` generated from the tokens
  (`dist/tw-theme.css`, colors reference the runtime vars so utilities follow
  `html[data-theme]`), a consumer entry (`styles/tailwind.css`,
  `@control-room/design-system/tailwind.css`), a `build:tw` script that emits a
  prebuilt token-driven utility set (`dist/utilities.css`), and
  `references/tailwind.md`. Utilities like `bg-work`, `text-on-err`, `p-3`,
  `text-sm` resolve to the design tokens and re-theme automatically. The v3 preset
  remains available as `./tailwind-preset`.
- 32a0631: Theming & branding: a first-class **feature ⇄ appearance** split.

  The token layer now ships as two independent layers so a consumer can keep the
  system's structure and swap only its look:

  - **`dist/structure.css`** — the brand-agnostic _feature_ layer (spacing, borders,
    shadows, typography, motion, per-component tokens + the global baseline). Ship it
    once; it never changes with the brand.
  - **`dist/themes/<name>.css`** — one file per theme (`dark`/`light`/`extreme`/
    `phosphor`), containing _only_ the semantic role values. Swapping the appearance
    is swapping this one file. `dist/control-room.css` stays the all-in-one bundle
    (byte-identical) for back-compat.

  **The theme contract** (`dist/theme-contract.json`) is the machine-readable
  appearance surface — every semantic role a complete theme must define. Components
  reference only these roles, never a colour, so any complete theme reskins the whole
  system.

  **Author a brand without forking.** New framework-agnostic core at
  `@control-room/design-system/theme` (`lib/theme`): `validateTheme`, `mergeTheme`,
  `themeCss`, `applyTheme` (runtime inject), `defineTheme`, and a WCAG
  `contrastRatio`/`checkThemeContrast`. A brand file (`brands/*.json`) states just an
  `$extends` base plus the roles it overrides; `npm run build:theme` validates it
  against the contract, contrast-checks it, and emits `dist/themes/<name>.css` through
  the same renderer the built-in themes use. Worked example: **`brands/slate.json`**
  — a neutral corporate re-skin that touches no component CSS and no structure token.

  New exports: `./structure.css`, `./themes/*`, `./theme-contract`, `./theme`. New
  `build:theme` + `verify:theme` scripts (verify: wired into `npm run verify` and
  CI), and a `test:theme` node suite (9 tests): contract triangulation
  (tokens.json ≡ lib ≡ generated), validation, extends/merge, contrast, and the
  slate brand. All gates green.

- 2de92c0: Theming: lock the feature ⇄ appearance separation and document it end to end.

  - **Appearance-separation guard** (`test:separation`, wired into CI): fails the
    build if a raw brand colour (hex other than physical black/white, or any
    `rgb()/hsl()/oklch()…` literal) appears in the feature layer — `components.css`
    or a component source. The only sanctioned palette-bearers are the four
    generative-`<canvas>` components (`CrSigil`/`CrCat`/`CrChrome`/`CrAscii`), which
    read the theme at runtime via `getComputedStyle` and keep a hex only as a
    fallback; that set is pinned, so a new component can't quietly hardcode a colour.
  - **`references/theming.md`** — the branding guide: the two-layer split, the theme
    contract, authoring a brand (`brands/*.json` + the `@control-room/design-system/theme`
    API), contrast, per-component overrides, and the honest generative-art note.
    Linked from SKILL.md.
  - **Showcase** gains a **slate ▸** switch that loads the external brand
    (`brands/slate.json` → `dist/themes/slate.css`) and reskins the whole component
    browser from that one appearance file. New islands e2e asserts the reskin (roles
    flip to slate's values; the live React islands stay mounted, just re-themed).

  All gates green (separation + theme + forms + islands + a11y + full `verify`).

- e4c261b: Add the missing token tiers: a **primitive** scale layer (4px-base spacing
  `--space-*`, type scale `--text-*`, `--leading-*`, `--radius-none`, `--z-*`) and
  a **component** token tier (`--cr-btn-*`, `--cr-panel-*`, …). The component layer
  now consumes scales + component tokens instead of hardcoded px, so components are
  overridable via their `--cr-*` tokens and the system follows the standard
  global → semantic → component model.
- aec623f: Trim over-built machinery (from the critic review; nothing that carried real
  capability was removed):

  - **Figma track removed** — `references/figma-bridge.md`, `references/figma-kit-build.md`,
    `scripts/figma-pull.mjs`, `.github/workflows/figma.yml`, `.mcp.json`, the
    `figma:pull` script, the registry `figma` field, and all doc/sidebar/SKILL
    references. It was a code↔design bridge for a Figma file that doesn't exist
    (populated on 1 of 32 entries).
  - **Style Dictionary + `tailwind-preset.cjs` dropped** — `build-tokens.mjs` now
    emits the CSS vars with a plain map (SD was used as a glorified `.map()`), and
    the unused Tailwind **v3** preset (which conflicted with the shipped v4
    `dist/tw-theme.css`) is gone, along with the `./tailwind-preset` export and the
    `style-dictionary` dependency. Tailwind v4 `@theme` is the single integration.
  - **Skill install → `.claude` only** — dropped the `.cursor` / `.opencode`
    fan-out (solo repo; one provider).

  Kept: DTCG export, Astro/Starlight docs, the full Mitosis multi-target compile.
  a11y passes all four themes.

- 51a78ac: Tracks 4 + 5 and two new distinctive systems.

  - **Condensed display register** (track 4): new `--font-display` (Saira Condensed
    900, Archivo Narrow / Oswald fallbacks). The display register (masthead, hero,
    drip, modal titles) is now a tight condensed grotesque — reads as instrument
    stencil, not a rounded brand headline. Inlined in the gallery, imported on the
    docs site. Law 5 updated.
  - **Shape-as-severity scale** (new, Law 4): a polygon's side-count encodes
    danger/focus _inversely_ — triangle (crit) → diamond (warn) → pentagon (work)
    → hexagon (ok) → circle (idle). A second channel beside colour that survives
    the monochrome phosphor theme and colour-blindness — the built-in non-colour
    backup. Shipped as `.cr-sev--*` and the `CrShape` component (all 5 targets).
  - **Expanded hardware chrome** (track 5): `.cr-rivet`/`--hex`/`--slot`, `.cr-vent`,
    `.cr-port`, `.cr-stripe`, `.cr-seam`, `.cr-plate`, `.cr-tally` — richer bezel
    detail (Law 6).
  - **Richer texture** (beyond dots): `.cr-tex--cross` (±45° crosshatch) and
    `.cr-tex--duo` (two-signal duotone dither, "cross-colours"), plus `--crosshatch`
    token; ASCII/symbol dithering documented via the canvas engine.

  Docs: design-language (Law 4 severity scale + expanded diagonals, Law 5 condensed
  display), components (severity shapes, hardware chrome, richer textures), tokens
  (`--font-display`, `--crosshatch`), accessibility (shape as non-colour backup),
  frameworks (+Shape), catalog +1. a11y passes all four themes.

- 6d7739e: Unify the state/signal prop across components on one name + one vocabulary.

  The same concept — which signal a component carries — was expressed four ways
  (`tone`/`state`/`signal`) with divergent value sets. Standardize on **`signal`** with
  the canonical vocabulary **work · wait · done · err · idle · accent**:

  - CrTag, CrStatusDot, CrSessionRow, CrMeter, CrProgress now take `signal`. The legacy
    props (`tone`/`state`) still work — they're marked `@deprecated` and resolve as a
    fallback — so existing consumers don't break.
  - CrAlert and CrToast already used `signal` (unchanged). CrButton (`kind`) and CrChip
    (`tone`) keep their names: those axes are genuinely structural (button variant /
    chip style), not the signal vocabulary.
  - Reference app, playground demos, and the catalog variant descriptors updated to the
    canonical `signal`; the playground code snippets now teach it.

  No behavior change — the legacy values still resolve (Tag's now/later/no via the
  existing CSS aliases). Type-check, catalog drift, a11y, and islands gates all pass.

### Patch Changes

- ce9b39b: Correctness & credibility pass (from the four-critic review):

  - **Theme-blind canvases fixed.** CrCat / CrSigil / CrChrome / CrAscii now read
    their palette from the resolved CSS custom properties at paint time instead of
    hardcoding neon hex — so they honour every theme (they no longer render
    full-colour in monochrome phosphor, which the "survives a theme flip / phosphor
    a11y" claim required). The gallery painters do the same and repaint on
    theme-switch.
  - **Component bugs.** CrField gains an onChange (was a read-only controlled input
    in React); CrChoice uses event.target.checked (radios no longer toggle off);
    CrModal names the dialog (aria-label fallback, no empty h2); CrToast is
    self-dismissable so a sticky err can always be cleared; CrSessionRow labels the
    dot with the human status, not the raw state code.
  - **Contradictions.** Display face reconciled to Saira Condensed everywhere
    (SKILL + tells said Archivo); README law-count fixed to nine + stale file-tree
    rewritten; Figma guide "16 components" → the catalog.
  - **Drift gates.** New `verify:palette` (build-palette --check) confirms the
    committed palette AND that tokens.json matches the OKLCH generator — closing the
    orphan-generator drift trap; wired into `verify`. The stale hand-typed per-theme
    hex matrix in tokens.md (every row wrong) is replaced by a pointer to the
    generated tokens.flat.json.

  a11y passes all four themes; visual baselines refreshed (canvases changed).

- 711c3eb: Forms: stop the error-summary machinery from walking the whole render-list on the
  typing path. A new cheap `hasSummary()` gate scans only the (small) error maps —
  no model walk — so the full `errorList()` (which walks the render-list to pair
  each error with its field label) now runs _only when a summary is actually shown_,
  not on every keystroke.

  Docs gain an honest "Controlled re-render (by design)" note: `CrForm` is a
  controlled form (per-render work is O(visible fields)); React-Hook-Form's
  uncontrolled + per-field-subscription approach has no portable equivalent across
  the six compile targets, so we accept the trade and give guidance for very large
  forms (split into steps; hidden `when` fields already drop out of the render).
  All gates green.

- fcbe279: Governance + polish (design review P2): a written **deprecation policy** and a
  **design-review gate** for new components in CONTRIBUTING (naming vocabulary, states,
  accessible-name rule, tokens-only, must-type-check). Record the **pure-black** line/
  mass decision on the record in the tokens reference (intentional; phosphor is the
  tinted exception). Contain the component browser's toast-region demo so its
  `position:fixed` toasts no longer float over the whole page.

All notable changes to the Control Room design system are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Accessibility gate + visual regression (Playwright + axe-core)** —
  `test:a11y` fails CI on any serious/critical WCAG 2.1 A/AA violation across all
  four themes (hard gate, blocks deploy); `test:visual` snapshots the gallery per
  theme (informational; baselines in `tests/*-snapshots/`). Wired into
  `.github/workflows/deploy.yml`.
- **`--on-err` token** — contrast-safe foreground for error (`--sig-err`) fills
  (white in light, dark elsewhere).

### Fixed

- **Contrast (WCAG AA) across all four themes**, found by the new a11y gate:
  light `--on-sig` corrected from white to dark (black passes on light signals);
  phosphor `--muted` brightened (`#1f8c42` → `#2fac55`) to clear AA on panels;
  the drip/error surfaces now use `--on-err` instead of hardcoded `#fff`; removed
  contrast-eroding opacity on hero/drip sub-text.

- **Shipped component layer** — `styles/components.css`: consumable `cr-`prefixed
  component classes (`.cr-panel`, `.cr-btn`, `.cr-chip`, `.cr-tag`, `.cr-dot`,
  `.cr-row`, `.cr-hero`, `.cr-bezel`, `.cr-rail`, `.cr-drip`) built entirely on
  the token layer. Exposed via the `./components` package export; the living
  gallery now consumes this exact file (single source — no separate demo CSS).

### Changed

- **Docs re-platformed to Astro + Starlight** (from VitePress) to match the Doxee
  `Design-System-Hub` stack, enabling eventual fold-in. Reference Markdown is
  generated into Starlight content by `build:content` (source of truth stays in
  `references/`); a neon-noir skin maps `--sl-*` onto the Control Room tokens.
  Astro output goes to `site-dist/`; Pages workflow updated accordingly.

### Added

- **Figma kit build guide** — `references/figma-kit-build.md`: create the Figma
  file from scratch, near-automatic token import (DTCG → Figma Variables via
  Tokens Studio), the neobrutalist component recipe, worked examples, and the
  loop back to the catalog `figma` map.
- **Figma token check in CI** — `.github/workflows/figma.yml` (manual
  `workflow_dispatch`) validates `FIGMA_TOKEN` (a repo Actions secret) and can
  list a file's top-level nodes, plus `scripts/figma-pull.mjs` / `npm run
figma:pull` for the same locally or in the Claude Code environment. No laptop
  required — the token lives in the Claude Code env settings and/or an Actions
  secret.
- **Figma bridge (optional, free)** — `references/figma-bridge.md` + a `.mcp.json`
  wiring the open-source Framelink Figma MCP (reads a read-only `FIGMA_TOKEN` from
  env), an optional `figma` map on catalog entries (passed through by
  `build:catalog`), and the node → component agent workflow. Reproduces Figma
  Code Connect's result without a paid seat; secrets stay in env, never committed
  (`.gitignore` blocks `.env*`/`*.pat`/`*.secret`; `.env.example` documents it).
- **Component catalog** — `catalog/registry.json` (source) → `catalog/catalog.json`
  (generated, deterministic, drift-gated via `verify:catalog`), plus a rendered
  catalog page. Mirrors the hub's registry → catalog model.
- Brand fonts (Archivo, JetBrains Mono) bundled for the docs site.

- **DTCG token export** — `design-tokens/control-room.tokens.json` in the Design
  Tokens Community Group format with the `com.doxee.cssVar` extension, mirroring
  the Doxee `Design-System-Hub` convention. Emitted by `build:tokens` and covered
  by the `verify:tokens` drift gate.
- **Multi-provider skill install** — `skills/manifest.json` +
  `scripts/skills-sync.mjs` (`skills:sync` / `skills:check`) install the skill
  into `.claude` / `.cursor` / `.opencode` from a single source, with a
  validity/drift gate wired into CI.
- `metadata` (version / license / bundle) on the SKILL.md frontmatter.

### Changed

- `dist/control-room.css` is now the generated runtime stylesheet; the
  hand-written `tokens/control-room.css` was removed to keep one source of truth.
  Consumers now load `dist/control-room.css`.

## [1.0.0] — 2026-08-03

### Added

- **Design language** — the seven laws formalized with research grounding and
  `MUST` / `SHOULD` / `NEVER` rules (`references/design-language.md`).
- **Token layer** — machine-readable `tokens/tokens.json` covering four themes
  (dark / light / extreme / phosphor) plus theme-independent chassis, typography,
  and motion tokens.
- **Token build** — Style Dictionary pipeline generating `dist/control-room.css`,
  `dist/tailwind-preset.cjs`, and `dist/tokens.flat.json`, with a
  `verify:tokens` drift check.
- **Component library** — formal specs + copy-ready markup for Panel, Masthead,
  Hero, Rail, SessionRow, StatusDot, Chip, Button, Bezel, Table, Tag, the four
  diagonal primitives, keyed tiles, drip, and empty/error states
  (`references/components.md`).
- **Motion** — four-tier motion architecture, the glitch/CRT vocabulary, and the
  reduced-motion contract (`references/motion.md`).
- **Accessibility** — WCAG 2.1 AA contract for the aesthetic
  (`references/accessibility.md`).
- **Seeded pixel-cat** — deterministic identity+state sprite generator
  (`references/seeded-cat.md`).
- **Living gallery** — self-contained page demoing tokens, typography, and
  components live across all four themes (`/gallery.html`).
- **Docs site** — VitePress site publishing the references, deployed to GitHub
  Pages.
- **Governance** — component authoring template, ship checklist, and this
  changelog.
- Published as a Claude Code skill (`SKILL.md`).

[Unreleased]: https://github.com/abianco-doxee/control-room-design-system/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/abianco-doxee/control-room-design-system/releases/tag/v1.0.0
