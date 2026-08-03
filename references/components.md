# Component Library

The formal component reference. Every component is specified as: **purpose →
anatomy → tokens → states/variants → copy-ready markup → rules**. Markup is
framework-agnostic HTML + CSS custom properties; port to React/Vue/Svelte by
mapping props to the variants listed.

All components assume `dist/control-room.css` is loaded. All obey the seven
laws (`references/design-language.md`) — the rules here are the laws made
concrete per component. Before shipping any component, run it through
`checklists/component-checklist.md`.

**Naming.** Class names use the `cr-` prefix in production to avoid collisions;
the artifact prototypes used bare names (`.panel`, `.btn`). This reference uses
bare names for readability — prefix them when you ship.

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

---

## Tag

**Purpose.** Inline status label inside dense content (distinct from Chip, which
is a standalone token). Variants map to the signal ramp.

```html
<span class="tag now">Phase 0</span>
```
```css
.tag { font-family: var(--font-mono); font-size: 10px; font-weight: 800;
  padding: 2px 7px; border: 1.5px solid var(--border);
  text-transform: uppercase; letter-spacing: .04em; }
.tag.now  { background: var(--sig-done); color: var(--on-sig); } /* shipped   */
.tag.work { background: var(--sig-work); color: var(--on-sig); }
.tag.later{ background: var(--sig-wait); color: var(--on-sig); } /* pending   */
.tag.no   { background: var(--sig-err);  color: var(--on-sig); } /* ruled out */
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

## Composition example — the instrument

The reference layout: `Rail` + a `board` containing a keyed `Hero` and a `Panel`
of `SessionRow`s, wrapped in the outer instrument chassis.

```html
<div class="cr">
  <nav class="rail"><!-- brand + nav --></nav>
  <div class="board">
    <div class="hero" data-state="wait"><!-- … --></div>
    <section class="panel">
      <h4>Sessions</h4>
      <!-- .srow × N -->
      <div class="chips"><span class="chip">PTL-757</span></div>
      <button class="btn" type="button">RUN SCAN</button>
    </section>
  </div>
</div>
```
```css
.cr { display: flex; border: var(--brd-heavy) solid var(--border);
  box-shadow: var(--shadow-off-lg) var(--shadow-off-lg) 0 var(--shadow-col);
  background: var(--board); overflow: hidden; }
.board { flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
```
