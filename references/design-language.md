# Design Language — The Eight Laws

The visual language of Control Room is not a mood board. It is eight decision
procedures, each grounded in what real productions are *documented* to do (not
in what their marketing posters look like), and each written so the next
component doesn't need a taste debate.

Read this file first when building anything new. Given a component, these laws
should settle the visual — and verbal — questions before you write a line of CSS.
Laws 1–7 govern how a surface *looks*; Law 8 governs how it *speaks*, and it runs
through all of them.

**Research note.** Researching the references overturned two laws that were
originally written from images alone and added one that was missed entirely. The
corrections are flagged inline. A promotional poster is a marketing artifact and
not always the work's actual direction — so the laws cite the mechanism, not the
poster.

---

## The stance — an operator's instrument

Before the laws, the posture they all serve. **Control Room is addressed to one
operator, under load, scanning for the one thing that needs them.** It is not a
site to browse, a brand to admire, or a canvas — it is an *instrument*: the panel
in front of someone who is responsible for machines that are running right now.

Every law falls out of that stance. The black mass (Law 1) is the unlit hardware.
The single key (Law 2) is the one stage light that turns on when a machine changes
state. Decay (Law 3) is a gauge, not a filter. Two type registers (Law 5) are a
readout, not a document. Texture (Law 6) is on the glass because there is real
glass. Motion (Law 7) is calm until something happens. And the voice (Law 8) is a
machine reporting its own state to the person watching it.

So the test for anything new is not "is this beautiful" but **"would this help an
operator find the one thing that needs them, faster?"** If a decoration doesn't
survive that question, it isn't Control Room — it's an admin template wearing the
colors.

---

## Law 1 — Black is a *mass*, not an outline.

The single biggest correction from research. The signature of Takeshi Koike
(*Redline*) is not flat color bounded by a thin line — it is **large areas of
solid black standing in for shading entirely**. Depth comes from a hard boundary
between lit and unlit, never from a gradient. That is what makes the look read as
*ink* rather than *render*. Koike's influences are named explicitly as Frank
Miller and Mike Mignola: black as a compositional mass.

> Evidence: Koike's use of *heavy black lines and shadow instead of graded
> shading* gives designs a *very unusual, non-anime look* — characters shadowed
> in solid black, backgrounds painted to match.

**Rules**

- **MUST** shade a surface with exactly two tones and a hard boundary: one lit
  flat color and a black mass. `--mass` is a *fill* token, distinct from
  `--border`; black is allowed to occupy large area, not only the perimeter.
- **MUST** treat line weight as hierarchy: `--brd-brush` (5px) outer chassis ·
  `--brd-heavy` (3px) major panel · `--brd` (2px) internal divider. This matches
  the documented neobrutalist 2–4px spec.
- **NEVER** use a third mid-tone on a surface — that is exactly the graded
  shading being replaced.
- **NEVER** apply a gradient, blur, soft shadow, or inner glow to a surface. The
  hard offset shadow (`box-shadow: var(--shadow-off) var(--shadow-off) 0
  var(--shadow-col)`) is the *only* shadow in the system.

*Sources: Koike · Miller · Mignola · neobrutalism.*

---

## Law 2 — One hue *keys* the scene, and it means something.

*Dandadan*'s actual mechanism (director Fuga Yamashiro): each entity is assigned
a hue, and when that entity is present **the screen floods with its color, "like
changing stage lights."** It is semantic, not decorative — one key at a time. For
a dashboard this is almost too apt: the key hue becomes **the state of the thing
you are looking at**. Color stops being decoration and becomes the primary state
channel.

> Evidence: Yamashiro *flushes the screen with theme colours, like changing
> stage lights for different characters* — worked out per cut with the studio's
> color designer.

**The signal ramp** (the keys, each bound to a state):

| Token | State | Dark value |
| --- | --- | --- |
| `--sig-work` | working | `#22d3ee` cyan |
| `--sig-wait` | waiting / needs input | `#fde047` yellow |
| `--sig-done` | done / merged | `#5eead4` aqua |
| `--sig-err` | error / failing | `#ff3b6b` red |
| `--sig-idle` | idle | `#6b6b8a` grey |
| `--sig-accent` | attention / primary action | `#ff2e97` magenta |
| `--stage` | calm / nominal (nothing needs attention) | `#00b34a` green |

**Rules**

- **MUST** bind every keyed region to real state. A flooded panel means "this is
  the state of this thing," never "this looked nice here."
- **MUST** key the focal region to the state that *needs attention*. If nothing
  needs attention, it keys to `--stage` and stays calm.
- **SHOULD** render many keyed cells as a uniform, gridded contact sheet — equal
  size and gridding make it read as one instrument, not competing stages.
- **NEVER** key a region to a hue that does not correspond to real state.
- **NEVER** put two full-bleed keys competing on one screen. One key per region.

*Sources: Yamashiro · Science SARU.*

---

## Law 3 — Decay is *information*. Corruption escalates with severity.

The Pip-Boy (*Fallout*) reframed this completely. Its degradation is not
texture-for-mood — it is a **diegetic status readout**: the device is aging
infrastructure, so it glitches and reacts to damage. And the low-res look is
documented as **reducing cognitive noise**. So decay earns its place only by
carrying information — which is also what gives the hard rule about where it may
*not* go.

> Evidence: modeled on the Apple II green-phosphor CRT. *Low resolution, visible
> pixels, and minimal color reduce cognitive noise and create a sense of
> clarity.* *The screen glitches, degrades, and reacts to physical impact* —
> aging infrastructure, not a sleek assistant.

**The three glitch tiers** map to severity:

| Tier | Name | Meaning | Technique |
| --- | --- | --- | --- |
| T1 | split | nominal | RGB text-shadow: `-2px 0 accent, 2px 0 work` |
| T2 | slice | degraded | clip-path top/bottom offset in `--drip` + `--sig-accent` |
| T3 | cursed | failed | zalgo combining marks, **max 2 per glyph** |

**Rules**

- **MUST** map glitch intensity to severity — the intensity *is* the readout.
- **MUST** reserve **drip** (vertical, downward, in `--drip`) as the house glitch
  for error surfaces and the masthead only.
- **MUST**, for cursed unicode, let the clean string own `aria-label` and mark
  the corruption `aria-hidden`; cap combining marks at 2 per glyph or it
  overflows neighbouring lines.
- **NEVER** glitch data, numerals, labels, or anything under 18px — that *adds*
  cognitive noise, inverting the documented purpose.
- **NEVER** ambient-glitch a whole screen. Corruption that is always on carries
  zero information.

*Sources: Pip-Boy · GitS 2026.*

---

## Law 4 — The grid governs; *diagonals* carry meaning.

Koike's documented mechanism is **"negative space foreshortening"** and severely
deformed perspective — the loose keyword "extreme foreshortening" has a real
technique behind it. The chassis is otherwise 100% right angles, so diagonals are
the system's only kinetic energy — and they are *structural*: each shape has one
fixed meaning or it does not ship.

> Evidence: Koike's style is *negative space foreshortening and harsh shading* —
> *frenetic action, severely deformed perspectives, extremely fluid motion*,
> anchored by a rigorous underlying perspective grid.

**Four primitives, four fixed meanings:**

| Shape | Meaning |
| --- | --- |
| chevron | direction |
| notch | state |
| wedge | active-panel focus |
| arrow-rail | sequence / pipeline step |

**Rules**

- **MUST** give every diagonal one of the four meanings above. Four shapes, four
  meanings, no exceptions.
- **MUST** keep large shapes within **15°** off-axis — the orthogonal grid must
  still visibly govern. Koike's deformation works *because* it is anchored.
- **SHOULD** signal speed by cutting a shape away (negative space) rather than by
  adding motion lines.
- **NEVER** add a decorative triangle. If it does not encode direction, state,
  focus, or sequence, delete it.

*Sources: Koike · Madhouse.*

---

## Law 5 — Macro or data. *Nothing between.*

Reinforced by the Khara finding: the Evangelion lineage's most-copied device is
the **stark typographic title card** — enormous heavy type, flat black ground,
nothing else. Two registers only. (*GQuuuuuuX* is Tsurumaki-directed and
Anno-written — the Rebuild-of-Evangelion staff.) This law is what stops the scale
contrast from eroding as components accumulate.

> Evidence: neobrutalism calls for *big, no-nonsense typography* where type is
> *both functional text and visual focal point*.

**The two registers:**

- **Display** — Archivo 900, uppercase, `-0.038em` tracking, `0.88–0.92`
  leading. Headers and single big numbers only.
- **Data** — JetBrains Mono, 12–13px; labels uppercase at `0.07em`. Everything
  operational. Prose lives here at sentence case.

**Rules**

- **MUST** restrict text to these two registers.
- **SHOULD** keep prose short enough to live in the data register. If a paragraph
  needs 16px to be readable, it is too long for a tool.
- **NEVER** introduce 18–24px sans body text. That middle register is precisely
  what makes dashboards look like generic admin templates.

*Sources: Khara / Anno · neobrutalism spec.*

---

## Law 6 — Texture belongs to *hardware*, never to content.

This resolves the apparent contradiction between "weathered industrial" and
"flat cel-shaded": both are true, of *different layers*. The Pip-Boy is a screen
inside a physical object, and the grime is on the **glass**. Texture lives on the
casing and the recessed screen; content stays flat per Law 1.

> Evidence: grime and fingerprint smudges were *the final touch* on the screen;
> the device is framed as *aging infrastructure*, in *sharp contrast to modern
> wearables that aim to disappear*.

**Rules**

- **MUST** confine halftone, scanlines, grain, and CRT wash to the inside of a
  bezel (`--halftone` on a recessed screen).
- **MUST** build a bezel from the bezel vocabulary: `--brd-brush` casing, corner
  rivets, a visibly inset screen. One instrument per screen (mirrors Law 2's
  one-key discipline).
- **NEVER** put texture on a flat content field.
- **NEVER** nest bezels or bezel every panel — a page of hardware is noise.

*Sources: Pip-Boy · Apple II.*

---

## Law 7 — Alive at rest. *Explosive on event.* Always settles.

*Redline* is 100,000 hand-drawn frames over seven years, and the reason it reads
as fast is **contrast**: extreme motion against held, stable compositions.
Constant motion everywhere would read as nothing. So the system is alive at a low
ambient level, erupts on a real event, and always returns to rest.

> Evidence: *over 100,000 hand-drawn frames* across a seven-year production;
> *squash-and-stretch to conjure the appearance of mind-melting speed.*

**Rules**

- **MUST** keep ambient motion low (the shared ~180ms / ~5.5fps ticker) and
  reserve 60fps choreography for a single focal event at a time.
- **MUST** make every animation settle back to a rest state.
- **MUST** honor `prefers-reduced-motion: reduce` — all animation and transition
  off (already enforced globally in `control-room.css`).
- **NEVER** run continuous high-frame motion across the whole screen — it erases
  the contrast that makes an event legible.

See `references/motion.md` for the full four-tier motion architecture.

*Sources: Redline · Koike.*

---

## Law 8 — The machine reports; it does not chat.

The most characteristic thing about Control Room is not a color — it's the
**voice**. Every reference here is an instrument that narrates its own state to an
operator: the Pip-Boy prints terse diegetic readouts, NERV's HUDs in *Evangelion*
are dense telemetry (`PATTERN BLUE`, `A.T. FIELD`, countdown clocks), a terminal
log states what happened and stops. None of them make small talk. So Control Room
writes like a machine reporting to the person responsible for it: **present tense,
no subject, no apology, no adjective that isn't a measurement.**

> Evidence: the Pip-Boy is framed as a diegetic *status readout* on aging
> infrastructure; the Evangelion/NERV interface lineage is defined by *stark,
> information-dense telemetry* as on-screen language; neobrutalism calls for
> *no-nonsense* copy where the text is functional, not persuasive.

**The register**

| Write | Not |
| --- | --- |
| `streaming` · `2 failing` · `paused · 6m` | `Your session is currently streaming!` |
| `nova needs you` | `Attention required` / `Oops!` |
| `endpoint unreachable` | `Something went wrong` |
| `3 sessions cleared` | `Successfully cleared 3 sessions 🎉` |
| `kill session?` | `Are you sure you want to proceed?` |

**Rules**

- **MUST** write status in the **present tense, third-person-dropped** — the state
  of the machine, not a sentence about it (`2 failing`, not "There are 2 tests
  that are failing").
- **MUST** lead with the **datum**: the number, the state word, the identifier.
  Labels are uppercase mono (Law 5's data register); values are the point.
- **MUST** name a failure by **what broke**, concretely (`endpoint unreachable`),
  never with a generic apology (`Something went wrong`) — an operator needs the
  fault, not the sympathy.
- **SHOULD** keep any single readout to a **line**. If it needs a sentence, it's
  documentation, and documentation doesn't live on the instrument.
- **SHOULD** phrase a destructive confirm as the **stakes in the operator's
  words** (`kill session?` → "CR-1130 is streaming. Terminating drops the turn."),
  not as a politeness ritual.
- **NEVER** use exclamation marks, emoji, mascots-as-punctuation, or celebratory
  copy. `done` is done; it does not cheer. (The seeded cat carries personality so
  the *words* don't have to — see `references/seeded-cat.md`.)
- **NEVER** address the product in the first person ("I've cleared your
  sessions"). The machine reports; it is not a companion.

*Sources: Pip-Boy · Evangelion/NERV HUD · neobrutalism spec.*

---

## Signatures — the tells

The laws are the *why*. These are the **tells**: the concrete marks that, present
together, make a screen unmistakably Control Room — and whose absence means it
isn't, whatever the palette. Use this as the identity checklist.

1. **The hard offset shadow.** Every raised surface casts the same solid,
   un-blurred shadow at one fixed offset (`--shadow-off`), and pressing a control
   *moves into* it (`:active` translates by the offset, shadow to zero). No other
   shadow exists. This one detail reads as "Control Room" before the color does.
2. **Absolute square.** `--radius` is `0` everywhere, forever. A single rounded
   corner breaks the spell.
3. **Color is state, never chrome.** A hue on screen is a machine state or a
   primary action — never a mood, a zebra-stripe, or a brand flourish (Law 2).
4. **Two registers, no middle.** Archivo-900 display for the one big thing; mono
   12–13px for everything operational. The absent 18–24px "body" register is a
   tell in the negative (Law 5).
5. **Texture only on hardware.** Halftone / scanlines / CRT wash appear *only*
   inside a bezel, with corner rivets and a visibly inset screen. A flat content
   field is never textured (Law 6).
6. **Geometric-glyph iconography.** Icons are hard geometric glyphs from the mono
   font (`◈ ◧ ▦ ▸ ✕ ◆`), not a rounded icon-font set. It costs nothing, never
   de-syncs from a CDN, and reads as instrument etching. **NEVER** pull in
   Lucide/Heroicons/Font-Awesome — a soft icon set fights every other tell.
7. **Registration marks.** The industrial framing tick — a `--border`-weight
   crop mark at opposite corners of a title surface (`.cr-mark`) — is structure,
   not signal, and marks "this is the primary readout." Ink weight only; **never**
   a signal hue (that would fake a state).
8. **The drip and the arrow-rail.** Corruption drips *downward* in `--drip` on
   error/masthead surfaces only (Law 3); sequence is carried by the chevron-cut
   arrow-rail (Law 4). Both are house shapes with one fixed meaning each.
9. **The seeded pixel-cat.** Identity-from-seed, pose-is-state — the system's one
   sanctioned piece of warmth, and the reason the *copy* stays cold (Law 8).

If a screen has the palette but none of tells 1, 2, 5, and 6, it is cosplaying
Control Room. If it has all nine, it could carry no logo and still be recognized.

---

## Applying the laws to a new component

1. **Law 1** — Two tones, hard boundary, correct border weight. No gradient, no
   blur, no soft shadow, no rounded corner.
2. **Law 5** — Every string is display or data. No mid-register.
3. **Law 2** — Any color that is not surface/ink/border is a signal, and it
   asserts real state.
4. **Law 4** — Any diagonal encodes direction, state, focus, or sequence.
5. **Law 6** — Texture only if the component is literally a bezel/screen.
6. **Law 3** — Glitch only on error/masthead surfaces, proportional to severity,
   never on data.
7. **Law 7** — Ambient calm; event-driven eruption; always settles;
   reduced-motion respected.
8. **Law 8** — Every string reports state in the machine voice: present tense,
   datum first, no apology, no cheer.

Then run the screen against **Signatures — the tells** above: it should carry the
hard offset shadow, square corners, color-as-state, and two registers at minimum,
or it isn't Control Room yet.

If a decision isn't covered here, it belongs in the token layer or the component
spec — not in improvisation. Add the rule; don't freelance it.
