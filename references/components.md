# Component Library

The formal component reference. Every component is specified as: **purpose →
anatomy → tokens → states/variants → copy-ready markup → rules**. Markup is
framework-agnostic HTML + CSS custom properties; port to React/Vue/Svelte by
mapping props to the variants listed.

All components assume `dist/control-room.css` is loaded. All obey the eight
laws (`references/design-language.md`) — the rules here are the laws made
concrete per component. Before shipping any component, run it through
`checklists/component-checklist.md`.

**Naming.** This reference uses bare names (`.panel`, `.btn`) for readability, but
the **shipped** classes are `cr-`prefixed (`.cr-panel`, `.cr-btn`, …) and live in
`styles/components.css` — import that after `dist/control-room.css` and use the
`cr-` classes directly rather than copying the CSS below. The snippets here are
the anatomy/spec; `styles/components.css` is the implementation.

---

## Foundations recap (used by every component)

```css
/* chassis idiom — the three lines that make something "Control Room" */
border: var(--brd) solid var(--border);                    /* square, inked   */
box-shadow: var(--shadow-off) var(--shadow-off) 0 var(--shadow-col); /* hard   */
border-radius: 0;                                          /* always          */
```

---

## Panel

**Purpose.** The default container for a group of related data. The system's
workhorse surface.

**Anatomy.** Bordered box · hard offset shadow · optional mono uppercase heading
(`h4`) · body.

**Tokens.** `--panel` bg · `--border` + `--brd` · `--shadow-off`/`--shadow-col` ·
`--ink` heading · `--font-mono` + `--type-label-tracking`.

**Variants.** `weight`: `default` (`--brd`) | `major` (`--brd-heavy`). `inset`:
swap bg to `--panel-2` for a recessed sub-region.

```html
<section class="panel">
  <h4>Sessions</h4>
  <!-- rows / content -->
</section>
```
```css
.panel {
  background: var(--panel);
  border: var(--brd) solid var(--border);
  box-shadow: var(--shadow-off) var(--shadow-off) 0 var(--shadow-col);
  padding: 13px;
}
.panel h4 {
  font-family: var(--font-mono); font-size: 11px; font-weight: 800;
  text-transform: uppercase; letter-spacing: .1em;
  color: var(--ink); margin: 0 0 10px;
}
```

- **MUST** use the hard offset shadow; **NEVER** blur it or round the corners.
- **SHOULD** use `major` weight for a panel that is itself a top-level region.
- **NEVER** nest more than one shadow depth visually — stacking hard shadows
  reads as noise. Use `inset` (`--panel-2`, no shadow) for sub-regions.

---

## Masthead

**Purpose.** The stark title card — the page's identity and headline state, in
the display register (Law 5). Optionally the host for the drip glitch (Law 3).

**Anatomy.** `--brd-heavy` box, `--shadow-off-lg` shadow · mono eyebrow ·
display `h1` · optional lede in the data register · optional ambient scanline.

```html
<header class="mast">
  <p class="eyebrow">DP Control Room · Phase 0</p>
  <h1>14 sessions<br>2 need you</h1>
</header>
```
```css
.mast {
  border: var(--brd-heavy) solid var(--border);
  box-shadow: var(--shadow-off-lg) var(--shadow-off-lg) 0 var(--shadow-col);
  background: var(--panel); padding: 22px 24px; position: relative; overflow: hidden;
}
.eyebrow {
  font-family: var(--font-mono); font-size: 11px; font-weight: 800;
  text-transform: uppercase; letter-spacing: .14em; color: var(--sig-work); margin: 0 0 8px;
}
.mast h1 {
  font-weight: 900; font-size: clamp(28px, 5.5vw, 52px); line-height: .9;
  letter-spacing: -.038em; text-transform: uppercase; margin: 0; text-wrap: balance;
}
```

- **MUST** keep `h1` in the display register only.
- **SHOULD** set the eyebrow in `--sig-work` (or `--stage` when calm).
- **SHOULD** add `.cr-mark` to the primary readout for the signature registration
  ticks (industrial crop marks at opposite corners — structure, not a signal; see
  `design-language.md#signatures`). Ink weight only; **never** on a signal-keyed
  surface where the ticks would read as state.
- **NEVER** put body prose in the masthead — that is a mid-register violation.

---

## Hero (keyed focal region)

**Purpose.** The one region that keys to the state needing attention (Law 2). If
nothing needs attention it keys to `--stage` and stays calm.

**Anatomy.** Signal-filled box · display "big" line + mono sub-line · optional
seeded cat (`references/seeded-cat.md`).

**Variants.** `state`: keys the fill to `--sig-{state}` (or `--stage`).

```html
<div class="hero" data-state="wait">
  <div>
    <div class="big">nova needs you</div>
    <div class="sub2">CR-1130 file picker · paused for input · 6m</div>
  </div>
  <span class="heropet"><!-- cat canvas --></span>
</div>
```
```css
.hero {
  display: flex; align-items: center; gap: 16px;
  background: var(--sig-accent); color: var(--on-sig);
  border: var(--brd) solid var(--border);
  box-shadow: var(--shadow-off) var(--shadow-off) 0 var(--shadow-col);
  padding: 16px; position: relative; overflow: hidden;
}
.hero[data-state="wait"] { background: var(--sig-wait); }
.hero[data-state="err"]  { background: var(--sig-err); }
.hero[data-state="calm"] { background: var(--stage); color: var(--stage-ink); }
.hero .big  { font-weight: 900; font-size: 19px; line-height: 1.05; }
.hero .sub2 { font-family: var(--font-mono); font-size: 12px; opacity: .82; margin-top: 3px; }
```

- **MUST** bind the fill to real state; **NEVER** pick the hero color for looks.
- **NEVER** run two keyed heroes on one screen.

---

## Rail + Nav

**Purpose.** Primary navigation. Persistent chassis on the left.

**Anatomy.** `--rail` background · `--brd-heavy` right border · brand block ·
nav list, active item keyed to `--sig-accent` · optional count `badge`.

```html
<nav class="rail">
  <div class="brand">CONTROL<br><span class="r">ROOM</span></div>
  <ul class="nav">
    <li><a class="active" href="#">◈ Attention <span class="badge">1</span></a></li>
    <li><a href="#">◧ Sessions</a></li>
  </ul>
</nav>
```
```css
.rail { width: 168px; flex-shrink: 0; background: var(--rail);
  border-right: var(--brd-heavy) solid var(--border); padding: 15px 0; }
.brand { font-family: var(--font-mono); font-weight: 900; font-size: 13px;
  padding: 0 15px 16px; line-height: 1.15; color: var(--rail-ink); }
.brand .r { color: var(--sig-work); }
.nav { list-style: none; margin: 0; padding: 0; }
.nav a { display: flex; align-items: center; gap: 9px; padding: 9px 15px;
  color: var(--rail-ink); opacity: .72; text-decoration: none; font-size: 13px;
  font-weight: 700; border-left: 3px solid transparent; cursor: pointer; }
.nav a:hover { opacity: 1; }
.nav a.active { opacity: 1; background: var(--sig-accent); color: var(--on-sig);
  border-left-color: var(--border); }
.nav .badge { margin-left: auto; font-family: var(--font-mono); font-size: 10px;
  font-weight: 800; background: var(--sig-err); color: var(--on-sig);
  padding: 1px 6px; border: 1.5px solid var(--border); }
```

- **MUST** key the active item to `--sig-accent`; **MUST** key the count badge to
  the state it counts (`--sig-err` for attention items).
- **MUST** mark the current item `aria-current="page"`.

---

## SessionRow

**Purpose.** One row of a live list — the densest unit in the system. Calm at
rest; reacts only to a real event (Law 7).

**Anatomy.** Seeded cat (26px, static) · mono name · `StatusDot` · mono status.

**States.** `event`: a one-shot glitch when this row's state changes.

```html
<div class="srow">
  <canvas class="rowcat" width="26" height="26" aria-hidden="true"></canvas>
  <span class="nm">CR-1130 file picker</span>
  <span class="dot" style="background: var(--sig-wait)"></span>
  <span class="st">needs input</span>
</div>
```
```css
.srow { display: flex; align-items: center; gap: 11px; padding: 7px 0;
  border-bottom: 1.5px solid color-mix(in srgb, var(--border) 18%, transparent); }
.srow:last-child { border-bottom: none; }
.srow .nm { flex: 1; font-family: var(--font-mono); font-size: 12px;
  font-weight: 600; color: var(--ink); }
.srow .st { font-family: var(--font-mono); font-size: 11px; color: var(--muted); }
.srow.event { animation: rowglitch .4s steps(3) 1; }
@keyframes rowglitch {
  0%,100% { transform: translateX(0); filter: none; }
  33% { transform: translateX(-2px); filter: hue-rotate(20deg); }
  66% { transform: translateX(2px); }
}
```

- **MUST** keep rows calm at rest — only trigger `.event` on a genuine state
  change, then remove it.
- **NEVER** glitch the numerals or the status text (Law 3); the glitch is on the
  row transform, not the data.

---

## StatusDot

**Purpose.** The smallest state readout. A square (not a circle — Law: radius 0).

```html
<span class="dot" style="background: var(--sig-work)"
      role="img" aria-label="working"></span>
```
```css
.dot { width: 8px; height: 8px; border: 1.5px solid var(--border);
  flex-shrink: 0; display: inline-block; }
```

- **MUST** set the fill from the signal ramp and give it an `aria-label` naming
  the state — color is never the only channel.
- **NEVER** round it.

---

## Chip

**Purpose.** A compact tag/label. Default keys to `done`; `alt` to `work`.

**States.** `stamp`: a one-shot stamp-in when added.

```html
<span class="chip">PTL-757</span>
<span class="chip alt">ui-kit</span>
```
```css
.chip { font-family: var(--font-mono); font-size: 11px; font-weight: 700;
  padding: 3px 9px; background: var(--sig-done); color: var(--on-sig);
  border: var(--brd) solid var(--border); }
.chip.alt { background: var(--sig-work); }
.chip.stamp { animation: stamp .18s ease-out 1; }
@keyframes stamp { 0% { transform: scale(1.18); opacity: .4; } 100% { transform: scale(1); opacity: 1; } }
```

- **SHOULD** reserve the chip color for a real category, not decoration.

---

## Button

**Purpose.** Primary action. Mechanical snap-press (Law 7, tier 0).

**Variants.** primary (`--sig-wait` fill, `--brd-heavy`) · the secondary
"controls" button (`--panel` fill, `--brd`) for utilities.

```html
<button class="btn" type="button">RUN SCAN</button>
```
```css
.btn { font-family: var(--font-mono); font-size: 12px; font-weight: 800;
  letter-spacing: .03em; padding: 9px 15px; cursor: pointer;
  background: var(--sig-wait); color: var(--on-sig);
  border: var(--brd-heavy) solid var(--border);
  box-shadow: var(--shadow-off) var(--shadow-off) 0 var(--shadow-col);
  transition: transform .05s, box-shadow .05s; position: relative; }
.btn:active { transform: translate(var(--shadow-off), var(--shadow-off));
  box-shadow: 0 0 0 var(--shadow-col); }             /* press INTO the shadow */

.controls button { font-family: var(--font-mono); font-size: 11px; font-weight: 800;
  text-transform: uppercase; letter-spacing: .04em; padding: 7px 11px;
  background: var(--panel); color: var(--muted);
  border: 2px solid var(--border); box-shadow: 3px 3px 0 var(--border);
  cursor: pointer; transition: transform .05s, box-shadow .05s; }
.controls button:active { transform: translate(3px, 3px); box-shadow: 0 0 0 var(--border); }
```

- **MUST** implement the snap-press: on `:active` the element translates by the
  shadow offset and the shadow collapses to 0 — it visibly presses into its own
  shadow. This is the system's signature interaction.
- **SHOULD** limit one primary button per region.
- **NEVER** add a hover elevation, a gradient, or a rounded corner.

---

## Bezel + Screen

**Purpose.** The **only** legal host for texture (Law 6). A physical instrument
enclosing a recessed, textured screen.

**Anatomy.** `--brd-brush` casing · corner rivets · inset screen carrying
`--halftone`.

```html
<div class="bezel">
  <div class="rivets" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  <div class="screen">
    <div class="l">&gt; scan complete · 14 sessions · 2 flagged</div>
  </div>
</div>
```
```css
.bezel { border: var(--brd-brush) solid var(--border); background: var(--panel-2);
  padding: 11px; box-shadow: var(--shadow-off) var(--shadow-off) 0 var(--shadow-col); }
.bezel .rivets { display: flex; justify-content: space-between; margin-bottom: 8px; }
.bezel .rivets i { width: 7px; height: 7px; background: var(--border); display: block; }
.bezel .screen { background: var(--board); border: var(--brd) solid var(--border);
  padding: 16px; background-image: var(--halftone);
  background-size: var(--halftone-size) var(--halftone-size); }
.bezel .screen .l { font-family: var(--font-mono); font-size: 12px; color: var(--ink); }
```

- **MUST** confine `--halftone` (and scanlines/grain) to `.screen`.
- **NEVER** nest bezels or place more than one instrument per screen.

---

## Table

**Purpose.** Dense tabular data. Same chassis as a panel.

```css
table { width: 100%; border-collapse: collapse; font-size: 13px;
  border: var(--brd) solid var(--border);
  box-shadow: var(--shadow-off) var(--shadow-off) 0 var(--shadow-col);
  background: var(--panel); }
th, td { text-align: left; padding: 10px 12px;
  border-bottom: 1.5px solid color-mix(in srgb, var(--border) 15%, transparent); }
th { font-family: var(--font-mono); font-size: 11px; text-transform: uppercase;
  letter-spacing: .06em; color: var(--muted); font-weight: 800; }
td b { color: var(--ink); } td .mono { font-family: var(--font-mono); font-size: 12px; }
```

- **MUST** set headers in the mono/label style; body cells in the data register.

**Operator options** (the `CrTable` component). `sortable` makes each header a
button (`aria-sort` + a `.cr-table__ind` arrow); `selectable` adds a leading
checkbox column and toggles `tr[aria-selected]` (the row washes to `--sig-work`);
`sticky` (`.cr-table--sticky`) pins the header — wrap the table in an
`overflow:auto` box for it to bite. Rows hover-highlight via `--state-hover-mix`.

```html
<table class="cr-table cr-table--sticky">
  <thead><tr>
    <th class="cr-table__sel" aria-label="select"></th>
    <th class="cr-table__sortable" aria-sort="ascending">Job<span class="cr-table__ind">▲</span></th>
    …
  </tr></thead>
  <tbody>
    <tr aria-selected="true"><td class="cr-table__sel"><input type="checkbox" class="cr-check" checked /></td>…</tr>
  </tbody>
</table>
```

- **MUST** keep sort/selection reflected in ARIA (`aria-sort`, `aria-selected`) —
  the visual state is never the only channel.

---

## Tabs {#tabs}

**Purpose.** Switch between sibling views. A `role=tablist` of buttons with a
keyed underline on the active tab (scalar active-index state in `CrTabs`).

```html
<div class="cr-tabs" role="tablist">
  <button role="tab" class="cr-tab cr-tab--on" aria-selected="true">queue</button>
  <button role="tab" class="cr-tab" aria-selected="false">workers</button>
</div>
```
```css
.cr-tab--on { color: var(--ink); border-bottom-color: var(--sig-work); }
```

- **MUST** set `aria-selected` on each tab; the underline colour is the ramp
  (`--sig-work`), not decoration.

---

## Meter {#meter}

**Purpose.** Capacity / utilisation as a square, hard-edged bar keyed to a signal
tone. `role=meter` with `aria-valuenow/min/max`.

```html
<div class="cr-meter cr-meter--work">
  <span class="cr-meter__label">cpu</span>
  <span class="cr-meter__track" role="meter" aria-valuenow="72" aria-valuemin="0" aria-valuemax="100" aria-label="cpu">
    <span class="cr-meter__fill" style="width:72%"></span>
  </span>
</div>
```

- **MUST** carry the numeric value in ARIA — the fill width alone is not
  accessible. Tone (`--work/--wait/--done/--err/--idle`) follows Law 2.

---

## Tag

**Purpose.** Inline status label inside dense content (distinct from Chip, which
is a standalone token). Variants map to the signal ramp.

**Tone vocabulary.** Prefer the **canonical ramp words** — the same vocabulary a
StatusDot, Toast, or Chip asserts (Law 2): `done · work · wait · err · idle ·
accent`. The older tell-time aliases (`now`→done, `later`→wait, `no`→err) are
kept so nothing breaks, but new markup should use the canonical names.

```html
<span class="cr-tag cr-tag--done">Phase 0</span>
```
```css
.cr-tag { font-family: var(--font-mono); font-size: var(--text-2xs); font-weight: 800;
  padding: var(--space-0-5) var(--space-2); border: 1.5px solid var(--border);
  text-transform: uppercase; letter-spacing: .04em; }
.cr-tag--done { background: var(--sig-done); color: var(--on-sig); }
.cr-tag--work { background: var(--sig-work); color: var(--on-sig); }
.cr-tag--wait { background: var(--sig-wait); color: var(--on-sig); }
.cr-tag--err  { background: var(--sig-err);  color: var(--on-err); }
/* legacy aliases (retained): .cr-tag--now .cr-tag--later .cr-tag--no */
```

---

## Diagonal primitives (Law 4)

Four shapes, four fixed meanings. Max 15° off-axis. **NEVER** decorative.

| Primitive | Meaning | Mechanism |
| --- | --- | --- |
| `.chev` | direction | left-facing CSS triangle before the label |
| `.notch` | state | `clip-path` corner cut |
| `.wedge` | active-panel focus | accent `clip-path` wedge on the trailing edge |
| `.arrowrail span` | sequence / pipeline step | chevron-clipped, overlapping steps; `.on` = current |

```css
.chev { position: relative; padding-left: 25px; }
.chev::before { content: ""; position: absolute; left: 8px; top: 50%;
  transform: translateY(-50%); width: 0; height: 0;
  border-left: 9px solid var(--sig-work);
  border-top: 6px solid transparent; border-bottom: 6px solid transparent; }
.notch { background: var(--sig-wait); color: var(--on-sig);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 11px), calc(100% - 11px) 100%, 0 100%); }
.arrowrail { display: flex; }
.arrowrail span { font-family: var(--font-mono); font-size: 11px; font-weight: 700;
  padding: 7px 15px 7px 21px; background: var(--panel); color: var(--ink);
  border: var(--brd) solid var(--border); margin-left: -10px;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%); }
.arrowrail span:first-child { margin-left: 0; }
.arrowrail span.on { background: var(--sig-work); color: var(--on-sig); }
```

- **MUST** pick the primitive by meaning, not by looks.
- **NEVER** exceed 15° off-axis on large shapes; the grid must still govern.

---

## Keyed contact sheet (Law 2)

**Purpose.** A grid of state-keyed tiles that reads as one instrument, not
competing stages. Each tile keys to its item's state.

```css
.tiles { display: grid; gap: 0;
  grid-template-columns: repeat(auto-fit, minmax(104px, 1fr));
  border: var(--brd-brush) solid var(--border); }
.tile { aspect-ratio: 1; position: relative; display: flex; align-items: flex-end;
  padding: 7px; overflow: hidden;
  border-right: var(--brd) solid var(--border);
  border-bottom: var(--brd) solid var(--border); }
```

- **MUST** keep tiles uniform in size and gridded — that is what makes many keys
  read as one sheet rather than clutter.

---

## Drip / error surface (Law 3)

**Purpose.** The house glitch for failure. Vertical downward bleed in `--drip`
over a `--sig-err` field. Reserved for error surfaces and the masthead.

```html
<div class="dripbox">
  <div class="dt">connection lost</div>
  <div class="ds">ai-global-chat · SSE closed · retry 3/5</div>
</div>
```
```css
.dripbox { position: relative; overflow: hidden;
  border: var(--brd) solid var(--border);
  background: var(--sig-err); color: #fff; padding: 20px; min-height: 104px; }
.dripbox .dt { font-weight: 900; font-size: 19px; text-transform: uppercase;
  letter-spacing: -.02em; line-height: 1.05; }
.dripbox .ds { font-family: var(--font-mono); font-size: 11.5px; opacity: .85; margin-top: 4px; }
```

- **MUST** reserve drip for real errors; **NEVER** decorate a healthy surface
  with it.

---

## EmptyState / ErrorState

**Purpose.** The zero-data and failure fallbacks for any panel.

- **EmptyState** — data register, `--muted`, a short mono line and one action. No
  glitch (nothing is wrong), keyed to `--stage`/calm if colored at all.
- **ErrorState** — the drip surface above, or a panel keyed to `--sig-err`, with
  the failure named in display and the detail in data.

- **MUST** distinguish "nothing here yet" (calm) from "something failed" (error
  keying + drip). They are different states and must not look alike.

---

## Seeded pixel-cat

The identity+state sprite that appears in the hero, session rows, and the state
strip. It is large enough to warrant its own spec — see
`references/seeded-cat.md` for the deterministic generator, the `paint()`
contract, and the per-state poses.

- **MUST** derive fur/markings from the session id (identity) and pose from state
  — never store a per-session asset.
- **MUST** provide a text equivalent (`aria-label`) naming the session and state;
  the canvas is decorative to a screen reader.

---

## Composition — an operator's screen

The whole vocabulary in one screen, using only the shipped `cr-` classes. It
exercises the nine laws together: the condensed masthead with registration ticks
(`.cr-mark`), a keyed `Hero`, the **severity shapes** beside colour, a seeded
**Sigil** per session, the **arrow-rail**, a **texture + scanline** bezel with the
ambient scan loop, keyed **tiles**, and exactly **one Law-9 breach**. It survives a
theme flip with zero per-theme code — see it live, and toggle dark / light /
extreme / phosphor, in the **Live Gallery** (linked at the top of the sidebar).

```html
<div class="cr-instrument">
  <nav class="cr-nav" aria-label="Primary">
    <div class="cr-nav__brand">CONTROL<br>ROOM</div>
    <ul class="cr-nav__list">
      <li><a class="cr-nav__item cr-nav__item--active" href="#" aria-current="page">◈ Attention <span class="cr-nav__badge">2</span></a></li>
      <li><a class="cr-nav__item" href="#">◧ Sessions</a></li>
      <li><a class="cr-nav__item" href="#">▦ Sprint</a></li>
    </ul>
  </nav>

  <div class="cr-instrument__board">
    <!-- condensed masthead + the one registration mark -->
    <header class="cr-masthead cr-mark">
      <p class="cr-masthead__eyebrow">DP Control Room · Phase 0</p>
      <h1 class="cr-masthead__title">14 sessions<br>2 need you</h1>
    </header>

    <!-- the single keyed focal region -->
    <div class="cr-hero cr-hero--wait">
      <div>
        <div class="cr-hero__big">nova needs you</div>
        <div class="cr-hero__sub">CR-1130 · paused for input · 6m</div>
      </div>
      <!-- <CrSigil seed="nova-01" state="waiting" /> -->
    </div>

    <div class="cr-cols">
      <!-- sessions: severity SHAPE (non-colour) + seeded sigil + status -->
      <section class="cr-panel cr-panel--major">
        <h4 class="cr-panel__title">Sessions</h4>
        <div class="cr-row"><span class="cr-sev cr-sev--work" role="img" aria-label="working"></span><span class="cr-row__name">PTL-757 chat-turn</span><span class="cr-row__status">streaming</span></div>
        <div class="cr-row"><span class="cr-sev cr-sev--warn" role="img" aria-label="attend"></span><span class="cr-row__name">CR-1130 picker</span><span class="cr-row__status">needs input</span></div>
        <div class="cr-row"><span class="cr-sev cr-sev--crit" role="img" aria-label="critical"></span><span class="cr-row__name">rp verify</span><span class="cr-row__status">2 failing</span></div>
        <div class="cr-row"><span class="cr-sev cr-sev--ok" role="img" aria-label="nominal"></span><span class="cr-row__name">atlas deploy</span><span class="cr-row__status">merged</span></div>
      </section>

      <!-- pipeline: arrow-rail + hardware bezel (texture + scan loop) + chrome -->
      <section class="cr-panel">
        <h4 class="cr-panel__title">Pipeline</h4>
        <div class="cr-rail">
          <span class="cr-rail__step cr-rail__step--on">scan</span>
          <span class="cr-rail__step">triage</span>
          <span class="cr-rail__step">fix</span>
          <span class="cr-rail__step">verify</span>
        </div>
        <div class="cr-bezel cr-anim-scan">
          <div class="cr-bezel__rivets" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          <div class="cr-bezel__screen cr-tex--glass">&gt; scan complete · 14 sessions · 2 flagged</div>
        </div>
        <div class="cr-hw-row"><span class="cr-plate">UNIT · CR-00 · REV.C</span><span class="cr-tally">▐▐▐ ▌ 14</span></div>
      </section>
    </div>

    <!-- the ONE breach: the exceptional item, softened + glowing (Law 9) -->
    <div class="cr-breach cr-breach--wash cr-breach--alive">
      <p class="cr-masthead__eyebrow">Milestone</p>
      <div class="cr-hero__big">Sprint 41 shipped</div>
      <div class="cr-hero__sub">38 tasks · 0 regressions · 2 days early</div>
    </div>

    <!-- keyed contact sheet -->
    <div class="cr-tiles">
      <div class="cr-tile cr-tile--work">nova</div>
      <div class="cr-tile cr-tile--wait">atlas</div>
      <div class="cr-tile cr-tile--done">echo</div>
      <div class="cr-tile cr-tile--err">rhea</div>
      <div class="cr-tile cr-tile--idle">kite</div>
      <div class="cr-tile cr-tile--stage">calm</div>
    </div>
  </div>
</div>
```

The only page-level CSS is layout glue (the token layer + `styles/components.css`
carry everything else):

```css
.cr-cols   { display: grid; grid-template-columns: 1.25fr 1fr; gap: var(--space-3); }
.cr-hw-row { display: flex; gap: var(--space-3); align-items: center; margin-top: var(--space-3); }
/* .cr-breach carries its own panel background + padding; add only your own spacing */
```

- **MUST** keep to **one** keyed hero and **one** breach per screen (Laws 2 + 9).
- **MUST** pair each row's colour with its severity **shape** so state survives the
  monochrome phosphor theme (Law 4 / accessibility).
- Everything above is theme-independent — the same markup renders in all four
  themes with zero overrides.

---

## Form controls

Neobrutalist inputs on the recessed board surface — square, inked, mono, with the
system focus ring. Every control needs an associated label; error state is shown
with a non-color `✗` marker as well as the `--sig-err` border (never color alone).

**Field wrapper** — label + control + hint/error.

```html
<div class="cr-field">
  <label class="cr-field__label" for="name">Session name</label>
  <input id="name" class="cr-input" placeholder="nova-01" />
  <span class="cr-field__hint">lowercase, no spaces</span>
</div>

<div class="cr-field cr-field--error">
  <label class="cr-field__label" for="ep">Endpoint</label>
  <input id="ep" class="cr-input" aria-invalid="true" />
  <span class="cr-field__error">must be a valid URL</span>
</div>
```

**Input / textarea / select** — `.cr-input`, `.cr-textarea`, `.cr-select`.
**Checkbox / radio** — square (radius 0); checked fills `--sig-work` with an
`--on-sig` mark:

```html
<label class="cr-check"><input type="checkbox" checked /> Auto-scan</label>
<label class="cr-check"><input type="radio" name="hue" checked /> Cyan</label>
```

**Switch** — a real `button[role="switch"]` so it's keyboard-operable and named:

```html
<button type="button" role="switch" aria-checked="true" class="cr-switch">
  <span class="cr-switch__track" aria-hidden="true"></span> Live
</button>
```

- **MUST** give every control a label (`<label for>` or a wrapping `<label>`).
- **MUST** signal error with the `✗` marker + border, not color alone.
- **NEVER** round a control; disabled uses opacity, not a new color.

## Instrument shell

`cr-instrument` is the dashboard chassis: a `--brd-brush` frame with a hard
shadow, composing the **Nav rail** and a **board** (masthead/hero + panels).

```html
<div class="cr-instrument">
  <nav class="cr-nav" aria-label="Primary">
    <div class="cr-nav__brand">CONTROL<br>ROOM</div>
    <ul class="cr-nav__list">
      <li><a class="cr-nav__item cr-nav__item--active" href="#">◈ Attention <span class="cr-nav__badge">2</span></a></li>
      <li><a class="cr-nav__item" href="#">◧ Sessions</a></li>
    </ul>
  </nav>
  <div class="cr-instrument__board">
    <div class="cr-hero cr-hero--wait">…</div>
    <section class="cr-panel"><h4 class="cr-panel__title">Sessions</h4>…</section>
  </div>
</div>
```

- **MUST** keep one keyed focal region (Law 2) in the board — one Hero, not many.
- **SHOULD** let the board scroll; the rail stays fixed-width (`--cr-nav-w`).

## Overlays

Three surfaces that sit above the board. All three are square, inked, hard-shadowed
like every other surface — an overlay is not a soft floating card, it's another
panel that happens to stack on top. They obey the same laws (radius 0, hard offset
shadow, texture only on hardware) and survive every theme flip.

## Modal

A blocking dialog built on the **native `<dialog>` element**, so the browser owns
the focus-trap, `Escape`-to-close, and the `::backdrop` scrim — behaviour that is
notoriously easy to get wrong is delegated to the platform and is identical in
every framework target. The Mitosis component (`CrModal`) drives
`showModal()`/`close()` imperatively from a single `open` prop and reports the
native `close` event back through `onClose`.

```html
<dialog class="cr-modal">
  <div class="cr-modal__head">
    <h2 class="cr-modal__title">Kill session?</h2>
    <button type="button" class="cr-modal__close" aria-label="Close">✕</button>
  </div>
  <div class="cr-modal__body">CR-1130 is streaming. Terminating drops the turn.</div>
</dialog>
```
```tsx
<CrModal open={open} title="Kill session?" onClose={() => setOpen(false)}>
  CR-1130 is streaming. Terminating drops the turn.
</CrModal>
```

- **MUST** open with `showModal()` (not the `open` attribute) so the backdrop and
  focus-trap engage; the component does this for you.
- **MUST** name the dialog — `title` becomes `aria-label`; the `✕` is labelled
  `Close`.
- The `::backdrop` is `--mass` at 72% — the black *is* the scrim (Law 1), never a
  blur.
- **NEVER** round the frame or nest a second modal; one blocking surface at a time.

## Toast

A transient status readout **keyed to a machine signal** (Law 2) — the fill is the
signal colour, so a toast asserts the same state vocabulary as a StatusDot or a
Hero. Errors announce assertively; everything else is polite.

```html
<div class="cr-toast cr-toast--done" role="status">
  <span class="cr-toast__msg">3 sessions cleared</span>
  <button type="button" class="cr-toast__close" aria-label="Dismiss">✕</button>
</div>
<div class="cr-toast cr-toast--err" role="alert">
  <span class="cr-toast__msg">Endpoint unreachable</span>
</div>
```
```tsx
<CrToast signal="err" message="Endpoint unreachable" duration={6000} onClose={dismiss} />
```

- **MUST** map the fill to a real signal (`work`/`wait`/`done`/`err`) — a toast is
  state, not chrome. `err` uses `--on-err` text; the rest use `--on-sig`.
- **MUST** use `role="alert"` + `aria-live="assertive"` for `err`, `role="status"`
  + `polite` otherwise — the component picks this from `signal`.
- **SHOULD** auto-dismiss non-critical toasts (`duration`); keep errors sticky so
  they can't be missed.

---

## Toast region {#toast-region}

**Purpose.** A fixed screen corner that **stacks** live toasts. The parent owns
the list (`CrToastRegion` is presentational); each toast stays its own live region
so nothing double-announces. Bottom corners stack newest nearest the edge.

```tsx
<CrToastRegion position="br" toasts={list} onDismiss={remove} />
```
```css
.cr-toast-region { position: fixed; display: flex; flex-direction: column; gap: var(--space-2); }
.cr-toast-region--br { bottom: var(--space-4); right: var(--space-4); flex-direction: column-reverse; }
```

- **MUST** keep each toast's own `role`/`aria-live` (don't wrap the region in a
  second live region — that double-announces).
- **SHOULD** cap how many stack at once and drop oldest, so a burst can't bury the
  screen.

---

## Menu {#menu}

**Purpose.** A dropdown of actions. A trigger toggles a `role=menu` panel; a
transparent full-viewport **scrim** closes it on outside click — no global
listeners, so every framework target behaves the same.

```tsx
<CrMenu label="actions ▾" align="right" onSelect={run}
  items={[{ label: "pause all" }, { label: "kill all", danger: true }]} />
```
```css
.cr-menu__panel { position: absolute; z-index: calc(var(--z-overlay) + 1);
  box-shadow: var(--shadow-off-sm) var(--shadow-off-sm) 0 var(--shadow-col); }
.cr-menu__item--danger { color: var(--sig-err); }
```

- **MUST** set `aria-haspopup="menu"` + `aria-expanded` on the trigger and
  `role="menuitem"` on each item.
- **SHOULD** reserve `--danger` for destructive actions only (Law 2).

---

## Pagination {#pagination}

**Purpose.** Move through pages of a table/list. Controlled: it renders from
`page`/`total` and emits `onChange`; the parent owns the page. Prev/next plus a
windowed run of numbers with ellipses; the current page is keyed and
`aria-current="page"`.

```tsx
<CrPagination page={page} total={9} onChange={setPage} />
```
```css
.cr-pager__btn--on { background: var(--sig-work); color: var(--on-sig); }
.cr-pager__btn[disabled] { opacity: var(--state-disabled-op); }
```

- **MUST** disable prev at page 1 and next at the last page, and mark the current
  page with `aria-current`.
- **SHOULD** keep the number window small (first · current±1 · last) so the control
  stays one line at any page count.

---

## Key hint {#key-hint}

**Purpose.** A keycap badge announcing a keyboard shortcut. It is **decorative**
(`aria-hidden`) — the real binding rides `aria-keyshortcuts` on the action. Two
registers, matching how prominent the action is:

- **Main actions** show the keycap **always** (`<CrKbd keys="I" />`).
- **Secondary / bulk actions** use the **hint** variant — hidden until the user
  hovers/focuses a `.cr-keys-host`, or **peeks all** by holding a key (default
  `Alt`) via the headless `CrKeyHints` behavior.

```tsx
<CrButton keyshortcuts="i" onClick$={openIncident}>open incident <CrKbd keys="I" on /></CrButton>

<div class="cr-keys-host">
  <CrButton keyshortcuts="1">dark <CrKbd keys="1" hint /></CrButton>
</div>

<CrKeyHints />            {/* hold Alt to reveal every hint badge at once */}
```
```css
.cr-kbd--hint { opacity: 0; }
.cr-keys-host:hover .cr-kbd--hint,
:root[data-cr-keys="on"] .cr-kbd--hint { opacity: 1; }   /* no layout shift */
```

- **MUST** pair the badge with `aria-keyshortcuts` on the actual control — the
  keycap is a visual, not the accessible name.
- **SHOULD** reserve always-on badges for the few primary actions; everything else
  is a hint, so the chrome stays quiet until asked.

---

## Command palette {#command-palette}

**Purpose.** A ⌘K quick-open for every operator action. Built on the native
`<dialog>` (focus-trap, `Esc`, backdrop). The search field is a **combobox**
driving a **listbox**: focus stays in the input while `↑`/`↓` move the active
option (`aria-activedescendant`), `Enter` runs it. Live query filter; each row can
show a keycap hint.

```tsx
const commands = [
  { id: "incident", label: "Open incident", hint: "I", group: "action" },
  { id: "theme:light", label: "Theme: Light", hint: "2", group: "theme" },
];
<CrPalette open={open} commands={commands} onRun={run} onClose={close} />
```
```js
// host binds the opener
if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); open = !open; }
```

- **MUST** drive selection with `aria-activedescendant` (focus stays in the input),
  and give each option `role="option"` + `aria-selected`.
- **SHOULD** filter on both label and group, and reset the query + active row each
  time it opens.
- **NEVER** trap the user — `Esc` and the backdrop always close it (the dialog owns
  this).

---

## Alert {#alert}

**Purpose.** An inline callout keyed to a signal (Law 2) — a left brush-bar in the
signal hue. `err` announces assertively (`role=alert`); the rest are polite.

```tsx
<CrAlert signal="wait" title="Scheduled maintenance" message="Workers restart at 02:00 UTC." dismissible />
```

- **MUST** map `signal` to a real state; `err` uses `role="alert"` + assertive.
- **SHOULD** carry a title only when it adds information — a one-line notice is fine
  as `message` alone.

---

## Radio group {#radio-group}

**Purpose.** Single choice from a small set. `role=radiogroup` with roving
tabindex: only the checked radio (or the first) is tabbable, `↑`/`↓`/`←`/`→` move
selection. Square radios (radius 0) — a filled inner square marks the choice.

```tsx
<CrRadioGroup value={density} row
  options={[{ value: "cozy", label: "cozy" }, { value: "compact", label: "compact" }]}
  onChange={setDensity} />
```

- **MUST** keep it controlled (`value` in, `onChange` out) and set `aria-checked`
  on each radio.
- **NEVER** round it — the mark is a square, not a dot (Law: radius 0).

---

## Slider {#slider}

**Purpose.** A numeric operator control (threshold, interval). A **styled native
`<input type=range>`**, so keyboard (arrows, `Home`/`End`, `PageUp`/`Down`) and
screen-reader support come for free.

```tsx
<CrSlider value={refresh} min={5} max={120} step={5} label="Refresh interval" onChange={setRefresh} />
```

- **MUST** give it an `aria-label` (or visible label) — the value alone isn't a name.

---

## Progress {#progress}

**Purpose.** Task progress. **Determinate** fills to `value/max`; **indeterminate**
runs an animated hazard sweep and drops the numeric ARIA values. Distinct from
**Meter** (a static capacity reading, not a running task).

```tsx
<CrProgress value={64} label="Indexing" />
<CrProgress indeterminate tone="wait" label="Syncing" />
```

- **MUST** use `role="progressbar"`; set `aria-valuenow/min/max` only when
  determinate. Both stop animating under `prefers-reduced-motion`.

---

## Skeleton {#skeleton}

**Purpose.** A loading placeholder — a blocky pulse (never rounded). Sizes:
`--line`, `--text`, `--block`; set the width inline.

```html
<span class="cr-skeleton cr-skeleton--text" style="width:70%"></span>
```

- **SHOULD** mirror the shape of the content it stands in for; **MUST** be
  `aria-hidden` (it carries no information) and it freezes under reduced-motion.

---

## Data list {#data-list}

**Purpose.** A key → value readout for detail panels — `dl`/`dt`/`dd` on a
two-column grid, mono/label keys and data-register values.

```html
<dl class="cr-dl">
  <dt class="cr-dl__k">worker</dt><dd class="cr-dl__v">nova-01</dd>
  <dt class="cr-dl__k">uptime</dt><dd class="cr-dl__v">41h 12m</dd>
</dl>
```

- **SHOULD** keep keys in the label register (mono, uppercase, `--muted`) and
  values in the data register — the same split the rest of the system uses.

---

## Accordion {#accordion}

**Purpose.** Fold dense sections (logs, config, details). Each header is a button
(`aria-expanded` + `aria-controls`); the panel is a `role=region`. `single` makes
it exclusive; `↑`/`↓`/`Home`/`End` move between headers (`Enter`/`Space` toggle).

```tsx
<CrAccordion single defaultOpen={[0]} items={[
  { title: "Stack trace", body: "SSEError: stream closed at turn 42" },
  { title: "Config", body: "model=opus · timeout=30s" },
]} />
```

- **MUST** tie header → panel with `aria-controls`/`aria-labelledby` and keep
  `aria-expanded` in sync; **NEVER** animate height in a way that breaks reduced-
  motion (only the chevron rotates, and it freezes under the preference).

---

## Popover {#popover}

**Purpose.** A generic anchored overlay for arbitrary content. A trigger toggles a
floating panel; a transparent full-viewport scrim closes it on outside click, `Esc`
closes and returns focus to the trigger. Use **Menu** for a list of actions.

```tsx
<CrPopover label="filters ▾" title="Queue filters">
  <label><input type="checkbox" class="cr-check" /> failing</label>
</CrPopover>
```

- **MUST** set `aria-expanded` on the trigger and give the panel an accessible name
  (`title`); focus moves into the panel on open.

---

## Drawer {#drawer}

**Purpose.** An edge sheet for detail/inspector panels. Built on the native
`<dialog>` (focus-trap, `Esc`, backdrop); slides from the left or right, full
height. Controlled via `open` (like Modal).

```tsx
<CrDrawer open={open} side="right" title="cr-1130 · inspect" onClose={close}>
  <dl class="cr-dl">…</dl>
  <CrAccordion single items={sections} />
</CrDrawer>
```

- **MUST** drive it from `open` and handle `onClose` (the dialog fires it on `Esc`
  and backdrop click); the slide-in animation is off under reduced-motion.

---

## Breadcrumb {#breadcrumb}

**Purpose.** A navigation trail. Separators are ascii `/` drawn from CSS; the last
crumb is the current page (`aria-current="page"`).

```tsx
<CrBreadcrumb items={[{ label: "control room", href: "#" }, { label: "sessions", href: "#" }, { label: "cr-1130" }]} />
```

- **MUST** wrap it in `<nav aria-label>` and mark the last crumb `aria-current` (it
  is not a link).

---

## Segmented control {#segmented}

**Purpose.** A single choice shown as a connected button bar (filters, scopes).
`role=radiogroup` + roving tabindex (`←`/`→`/`Home`/`End`) — the same semantics as
a radio group, a distinct connected visual.

```tsx
<CrSegmented value={scope} options={[{ value: "all", label: "all" }, { value: "mine", label: "mine" }]} onChange={setScope} />
```

- **SHOULD** reach for this over a radio group when the options are few, short, and
  mutually exclusive; keep it to one line.

---

## Combobox {#combobox}

**Purpose.** An autocomplete form field: an input (`role=combobox`) filtering a
listbox. Focus stays in the input; `↑`/`↓` move the active option
(`aria-activedescendant`), `Enter` selects, `Esc` closes; a scrim closes on
outside click. The active row shows an ascii `▸` marker.

```tsx
<CrCombobox value={worker} options={workers} placeholder="worker…" onChange={setWorker} />
```

- **MUST** keep `aria-expanded`/`aria-activedescendant` in sync and give each option
  `role="option"`. It seeds its text from `value` on mount; selecting emits the
  value.

---

## Number field {#number-field}

**Purpose.** A number input with `−`/`+` steppers, clamped to `min`/`max`. The
native input keeps its own keyboard; the buttons step by `step` and disable at the
bounds.

```tsx
<CrNumberField value={retries} min={0} max={10} onChange={setRetries} />
```

- **MUST** clamp on both button and typed input; give it an `aria-label`.

---

## ASCII separators & lists {#ascii-detail}

Character-flavored detail, drawn from the same FUI vocabulary as the decoration
layer (`references/decoration.md`). Structure, never a signal.

| Class | What |
| --- | --- |
| `.cr-sep` (`--dot`, `--double`) | a horizontal rule — dashed / dotted / double box-line |
| `.cr-sep-label` | a labeled rule — `── LABEL ──` (dashed flanks, mono label) |
| `.cr-list` (`--dot` `--tick` `--plus`) | an ascii-marker list — `▸` / `·` / `»` / `+` before each item |
| `.cr-leader` | a dot-leader row — `label ········· value` (`__k` / `__fill` / `__v`) |

```html
<p class="cr-sep-label">recent events</p>
<ul class="cr-list cr-list--tick"><li class="cr-list__item">SSE closed · retry 3/5</li></ul>
<div class="cr-leader"><span class="cr-leader__k">uptime</span><span class="cr-leader__fill"></span><span class="cr-leader__v">41h 12m</span></div>
```

- **SHOULD** keep these to structure and dead space — the markers are ink/`--muted`,
  never a signal hue used to imply state.

---

## Hover card {#hover-card}

**Purpose.** A rich card revealed on hover/focus — like Tooltip but for structured
content (a stat block, a preview). CSS-driven with an open delay; the trigger is
focusable so keyboard users get it too. For plain text use Tooltip; for actions use
Menu.

```tsx
<CrHoverCard label="health" title="Fleet health">
  <dl class="cr-dl"><dt class="cr-dl__k">workers</dt><dd class="cr-dl__v">4 online</dd></dl>
</CrHoverCard>
```

- **SHOULD** keep the content glanceable; the card is supplementary, not a place for
  primary actions (it dismisses on blur).

---

## Tree {#tree}

**Purpose.** Hierarchical data — a worker→session fleet, a config tree. `role=tree`
rendered as a flat list of the currently-visible rows (each with `aria-level` /
`aria-expanded`). Full keyboard: `↑`/`↓`/`Home`/`End` move, `→` expands or steps in,
`←` collapses or steps out, `Enter`/`Space` toggle+select.

```tsx
<CrTree label="Fleet" defaultExpanded={["nova"]} nodes={[
  { id: "nova", label: "nova (pool)", children: [{ id: "nova-01", label: "nova-01" }] },
]} />
```

- **MUST** keep `aria-level`/`aria-expanded` correct and a single tab stop (roving
  tabindex). Selecting a node emits `onSelect`.

---

## Date-time {#datetime}

**Purpose.** A styled native `datetime-local` / `date` / `time` input — the browser
owns the picker, keyboard, and locale.

```tsx
<CrDateTime kind="datetime-local" value={startAt} onChange={setStartAt} />
```

- **MUST** give it an `aria-label` (or a visible label). Prefer native over a custom
  calendar unless you truly need one.

---

## Cron field {#cron-field}

**Purpose.** A cron-expression field for scheduling, with quick presets and a live
**human-readable** readout. The translation is **injected** as `description` — the
host computes it (e.g. with [cronstrue](https://github.com/bradymholt/cronstrue)) so
the design system stays dependency-free.

```tsx
// host
const d = (() => { try { return { text: cronstrue.toString(cron), bad: false }; }
                   catch { return { text: "unrecognized", bad: true }; } })();
<CrCronField value={cron} description={d.text} invalid={d.bad} onChange={setCron}
  presets={[{ label: "nightly 2am", cron: "0 2 * * *" }]} />
```

- **SHOULD** compute `description` reactively (a `useComputed$` in Qwik, `useMemo` in
  React) so it tracks the value; mark `invalid` on a parse failure.

---

## Keyboard navigation {#keyboard-nav}

The interactive widgets follow the WAI-ARIA patterns, so they work without a mouse:

| Widget | Keys |
| --- | --- |
| **Tabs** | roving tabindex — `←`/`→` (and `↑`/`↓`) move, `Home`/`End` jump to ends; only the active tab is in the tab order |
| **Menu** | trigger opens on click or `↓`; then `↑`/`↓` move, `Home`/`End` jump, `Esc` closes and returns focus to the trigger; `Enter`/`Space` select |
| **Table** | sortable headers are real `<button>`s (operable with `Enter`/`Space`), selection checkboxes are in the tab order |
| **Command palette** | `⌘K`/`Ctrl+K` opens; `↑`/`↓`/`Home`/`End` move the active option, `Enter` runs, `Esc` closes (focus stays in the search field) |
| **Tree** | `↑`/`↓`/`Home`/`End` move; `→` expands or steps into children, `←` collapses or steps to parent; `Enter`/`Space` toggle+select |
| **Accordion** | `↑`/`↓`/`Home`/`End` move between headers; `Enter`/`Space` toggle a panel |
| **Popover / Drawer** | `Esc` closes (drawer traps focus natively); popover returns focus to its trigger |
| **Segmented control** | roving tabindex — `←`/`→`/`Home`/`End` move and select (radiogroup semantics) |
| **Combobox** | `↑`/`↓` move the active option, `Enter` selects, `Esc` closes; focus stays in the input |
| **Radio group** | roving tabindex — `↑`/`↓`/`←`/`→` move and select; only the checked radio is tabbable |
| **Slider** | native range — `←`/`→` step, `Home`/`End` to ends, `PageUp`/`PageDown` jump |
| **Modal / Switch / Pagination** | native focus-trap (dialog), `Space` toggle, `Tab` between page buttons |

Focus is always visible (`*:focus-visible` → a `--sig-work` outline, system-wide).

## Tooltip

A hint bubble revealed on hover **and** keyboard focus, wired to its trigger with
`aria-describedby` so it's announced without stealing focus. The reveal is **pure
CSS** (`:hover` / `:focus-within`) — no JS state, no positioning library — so it
works in a server-rendered page with no component at all.

```html
<span class="cr-tooltip">
  <span class="cr-tooltip__trigger" tabindex="0" aria-describedby="tt-drift">drifting</span>
  <span class="cr-tooltip__bubble" role="tooltip" id="tt-drift">latency &gt; SLA for 3 turns</span>
</span>
```
```tsx
<CrTooltip id="tt-drift" label="latency > SLA for 3 turns">drifting</CrTooltip>
```

- **MUST** give the trigger `tabindex="0"` (or use a natively focusable element) so
  the hint is reachable by keyboard, and point `aria-describedby` at the bubble's
  `id`.
- **MUST** keep the bubble a **sibling** of the trigger, not a child — nesting folds
  the hint into the trigger's accessible name.
- **SHOULD** keep tooltips short; anything longer than a line belongs in a Panel or
  a Modal, not a hovering bubble.

## Texture utilities (hardware only)

Neo-print / CRT grain for **hardware** surfaces (a bezel, screen, or hero) —
**never** a flat content field (Law 6). Theme-keyed via the texture tokens
(`references/tokens.md`).

| Class | Texture |
| --- | --- |
| `.cr-tex--halftone` | dot pattern |
| `.cr-tex--dither` | ordered 1-bit checker |
| `.cr-tex--scan` | CRT scanlines |
| `.cr-tex--glass` | scanlines + halftone (the house "aged glass" wash) |

```html
<div class="cr-bezel cr-anim-scan">
  <div class="cr-bezel__screen cr-tex--glass">&gt; streaming · 14 sessions</div>
</div>
```

- **MUST** apply only to hardware; a textured flat panel violates Law 6.
- Ambient loop classes (`.cr-anim-scan/-pulse/-drift/-flick`) are documented in
  `references/motion.md` — low, slow, hardware-bound, reduced-motion-off.

## Sigil (seeded pixel-glyph)

A retro-futuristic **cyber-sigil** generated from a seed — a per-entity identity
mark that pairs with the pixel-cat. Full contract in `references/seeded-sigil.md`.

```tsx
import { CrSigil } from "@control-room/design-system/react";
<CrSigil seed="nova-01" state="working" />
```

- **MUST** key the hue to a signal (Law 2); the glyph is identity + state.
- **NEVER** use it as the only affordance for an action — it is a mark, not a
  button.

## Severity shapes {#severity-shapes}

A **shape channel** beside the colour channel (Law 4): a regular polygon's
side-count encodes danger/focus *inversely* — fewer sides = more urgent. Colour
says *what* state; shape says *how much it needs you*. Crucially the meaning is in
the geometry, so it reads in the phosphor CRT (one colour) and for colour-blind
operators — it **is** the non-colour backup the a11y contract requires.

```html
<span class="cr-sev cr-sev--crit" role="img" aria-label="critical"></span>  <!-- ▲ 3 -->
<span class="cr-sev cr-sev--warn" role="img" aria-label="attend"></span>    <!-- ◆ 4 -->
<span class="cr-sev cr-sev--work" role="img" aria-label="working"></span>   <!-- ⬠ 5 -->
<span class="cr-sev cr-sev--ok"   role="img" aria-label="nominal"></span>   <!-- ⬡ 6 -->
<span class="cr-sev cr-sev--idle" role="img" aria-label="idle"></span>      <!-- ● ∞ -->
```
```tsx
import { CrShape } from "@control-room/design-system/react";
<CrShape severity="crit" label="build failing" />
```

- **MUST** give it an accessible `label` — shape/colour is never the only carrier.
- **MUST** keep the scale monotonic: triangle is never calm, circle never critical.
- Colour defaults to the matching signal; override with `--cr-sev-fill` to decouple
  the two channels.

## Hardware chrome

Industrial detail that proves there is real hardware (Law 6) — apply on a bezel,
rail, or masthead, **never** on a flat data field, and keep it `aria-hidden`
(it carries nothing a label doesn't).

| Class | Part |
| --- | --- |
| `.cr-rivet` · `--hex` · `--slot` | round rivet · hex bolt · slot screw |
| `.cr-screw` · `--x` | slot screw · phillips (cross) screw |
| `.cr-bolt` | square bolt head |
| `.cr-led` · `--wait/-done/-err/-idle` | indicator LED, keyed to a signal (solid, no glow) |
| `.cr-vent` · `.cr-grille` | louvred vent (horizontal) · grille (vertical) |
| `.cr-port` | connector port |
| `.cr-stripe` | hazard tape (`--sig-wait` diagonal) |
| `.cr-seam` | panel seam (a hairline groove) |
| `.cr-plate` | stamped ID plate (`UNIT · CR-00 · REV.C`) |
| `.cr-tally` | tally-mark count readout |

- **MUST** confine chrome to hardware surfaces; a riveted flat panel is noise.
- **SHOULD** use it sparingly — one plate, a few rivets. Chrome is seasoning.

### Seeded chrome strip {#seeded-chrome}

For a whole varied hardware bar, `CrChrome` paints a **seeded** pixel-art metal
strip — a deterministic mix of fasteners (rivets / hex bolts / slot + phillips
screws), panel seams, wear scratches, and one indicator LED. Same seed → same
strip, so a rack/unit gets a stable, distinct face (like the seeded cat/sigil).

```tsx
import { CrChrome } from "@control-room/design-system/react";
<CrChrome seed="nova-rack" width={440} />
```

- Decorative hardware (Law 6); it is `aria-hidden`/`role=img` with the seed as its
  name and carries no information a label doesn't.
- **NEVER** put it behind data; it is a bezel/rail/rack surface, not a content field.

## Richer textures

Beyond the halftone dots: `.cr-tex--cross` is a ±45° **crosshatch** (Law 4
diagonals as grain), and `.cr-tex--duo` is a **duotone** ordered dither mixing two
signals (`--cr-duo-a` / `--cr-duo-b`, default accent + accent-2) — "cross-colours".
Both are hardware-only like the rest of the `.cr-tex--*` family. For freeform
**symbol / ASCII dithering**, paint it on a `<canvas>` (the seeded-cat / sigil
engine) — CSS covers the regular patterns; canvas covers the generative ones.

## The Breach {#breach}

The **one sanctioned rule-break per screen** (Law 9). `.cr-breach` licenses the
forbidden vocabulary on a single element — a soft corner (`--breach-radius`), a
**rotating neon gradient rim** with bright spots riding the border, and a
**dual-hue glow** in the house **magenta → acid** neon pairing (`--cr-breach` /
`--cr-breach-2`), plus an optional interior `--wash` — to spotlight the most
exceptional thing. The interior stays dark and legible; the *strike* is the rim +
glow. Rotation speed is `--breach-spin` (default 9s), off under reduced motion. It
only reads because everything around it obeys, so **use it at most once per
screen.**

```html
<div class="cr-breach cr-breach--wash cr-breach--alive" style="background:var(--panel)">
  <div class="cr-masthead__eyebrow">Milestone</div>
  <h2 class="cr-masthead__title">Sprint shipped</h2>
  <p>14 sessions · 0 failing · on time</p>
</div>
<span class="cr-blob" aria-hidden="true"></span>  <!-- standalone soft accent -->
```
```tsx
import { CrBreach } from "@control-room/design-system/react";
<CrBreach signal="done" wash alive>…the one exceptional thing…</CrBreach>
```

| Class | Effect |
| --- | --- |
| `.cr-breach` | soft corner + neon gradient rim + dual-hue glow (magenta → acid) |
| `.cr-breach--wash` | tints the interior with the pair (kept dark; `--ink` stays legible) |
| `.cr-breach--alive` | slow breathing dual glow (off under reduced motion) |
| `.cr-breach--work/-wait/-done/-err/-accent2` | re-key the primary hue to a signal |
| `.cr-blob` | a standalone soft luminous accent (decorative, `aria-hidden`) |

- **MUST** use one breach per screen, keyed to a signal, with everything else
  hard-edged.
- **MUST** keep breach text within contrast; the `--alive` glow honors reduced
  motion.
- **NEVER** breach data, tables, dense lists, or routine chrome — the breach is
  for the exceptional only.

## Icon {#icon}

`CrIcon` is the house operational glyph set — the one place the system reaches for
an icon instead of a text glyph, a canvas sigil, or ASCII.

**Contract.** Every icon is 24×24, drawn with a single 2px stroke in `currentColor`
(no fill), with **square caps and miter joins** so the geometry stays hard-edged and
consistent with the neobrutalist line. Icons inherit text colour and size on the
space grid via `size` (default 20).

**Accessibility.** Decorative by default (`aria-hidden`); pass `label` to expose the
icon as an image with an accessible name. Pair an icon-only control with a `label`
or visually-hidden text.

**API.** `name` (glyph id), `size` (px, default 20), `label` (optional accessible
name). The set: `play · pause · stop · retry · deploy · scan · search · alert ·
error · done · clock · cpu · logs · filter · sliders · close · chevron · plus ·
minus · trash · external · copy · session · menu`. Add one by adding a single-`d`,
square-geometry path to the map in `components/CrIcon.lite.tsx`.
