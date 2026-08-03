# Motion

Motion in Control Room follows Law 7: **alive at rest, explosive on event,
always settles.** Readable speed comes from *contrast* — low ambient life against
held compositions, punctuated by a single focal eruption — not from constant
movement. Constant motion everywhere reads as nothing.

Motion is organized into four tiers by cost and scope. The foundation is tiers 0
and 1; tiers 2 and 3 are deliberate, scoped enhancements.

## The four tiers

| Tier | Name | Engine | Budget | Scope | Status |
| --- | --- | --- | --- | --- | --- |
| 0 | press | CSS transition | `<200ms` | everywhere | ship |
| 1 | ambient life | shared `180ms` ticker (~5.5fps) | ~5.5fps | sprites + chrome | ship |
| 2 | choreography | `requestAnimationFrame` + spring | 60fps · **≤1 mount** | focal event only | scoped |
| 3 | shader atmosphere | WebGL fragment shader | bezel overlay | **bezel screen only** | phase 1+ |

**Ruled out:** Rive / Lottie authored assets. The state machine already lives in
the app's session store; sprites are drawn from code, keeping per-session
identity a fixed asset cannot. WebGL shaders may layer *on top* as a hero/bezel
overlay — never as the animation engine.

- **MUST** keep tier-1 ambient motion low and shared through one ticker.
- **MUST** limit tier-2 choreography to one focal event at a time (≤1 concurrent
  mount).
- **MUST** confine tier-3 shader effects to a bezel/screen overlay (Law 6), with a
  CSS fallback.
- **NEVER** run tier-2/3 motion across the whole screen or at rest.

## Tier 0 — press vocabulary

The mechanical feedback that makes the chassis feel physical. All CSS, `<200ms`.

**Snap-press** (the system's signature). On `:active`, the element translates by
the shadow offset while the shadow collapses to 0 — it presses *into* its own
shadow.

```css
.btn { transition: transform .05s, box-shadow .05s; }
.btn:active {
  transform: translate(var(--shadow-off), var(--shadow-off));
  box-shadow: 0 0 0 var(--shadow-col);
}
```

**Stamp-in.** A newly added token (Chip) stamps down.

```css
@keyframes stamp { 0% { transform: scale(1.18); opacity: .4; } 100% { transform: scale(1); opacity: 1; } }
```

**Kick.** A one-shot border flash confirming an action fired.

```css
.btn.kick::after { content: ""; position: absolute; inset: -3px;
  border: 3px solid var(--sig-work); opacity: 0; animation: kick .2s ease-out 1; }
@keyframes kick { 0% { opacity: .9; transform: translate(-2px,0); }
                  100% { opacity: 0; transform: translate(2px,0); } }
```

## Tier 1 — ambient life

One shared timer drives all ambient motion so it stays cheap and in sync
(`--tick-ambient: 180ms`). It powers the pixel-cat frame rig (blink / ear-flick /
tail-sway) and low-probability chrome glitches (brand shimmer, masthead scanline).

```js
let tick = 0;
function rig() {
  if (!reduced) { tick++; /* advance sprite frames + roll chrome glitches */ }
  setTimeout(rig, 180);
}
```

**Scanline** — a slow, low-contrast CRT wash on chrome (masthead / instrument):

```css
.mast::after { content: ""; position: absolute; inset: 0; pointer-events: none;
  background: repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,0,0,.06) 3px 4px);
  animation: scan 7s linear infinite; }
@keyframes scan { to { background-position: 0 120px; } }
```

- **MUST** gate every ambient effect on `prefers-reduced-motion`.
- **SHOULD** keep chrome glitches low-probability and self-clearing.
- **NEVER** ambient-animate a data surface (rows, tables, numerals).

## The glitch vocabulary (Law 3 — severity readout)

Glitch intensity *is* the readout. Three tiers, mapped to severity.

**T1 · split** (nominal): RGB chromatic split via text-shadow.
```css
.g-split.on { text-shadow: -2px 0 var(--sig-accent), 2px 0 var(--sig-work); }
```

**T2 · slice** (degraded): offset clip-path slices in `--drip` + `--sig-accent`.
```css
.g-slice::before, .g-slice::after { content: attr(data-t); position: absolute;
  left: 0; top: 0; width: 100%; opacity: 0; pointer-events: none; }
.g-slice.on::before { opacity: 1; color: var(--drip);
  clip-path: inset(10% 0 60% 0); transform: translateX(-3px); }
.g-slice.on::after  { opacity: 1; color: var(--sig-accent);
  clip-path: inset(64% 0 6% 0); transform: translateX(3px); }
```

**T3 · cursed** (failed): zalgo combining marks. **Max 2 combining marks per
glyph** or it overflows neighbouring lines.

**Drip** — vertical downward bleed in `--drip`, the house glitch for error
surfaces and the masthead only.

- **MUST** scale the tier to the actual severity.
- **MUST**, for cursed text, keep the clean string as the accessible name and
  mark corruption `aria-hidden` (see `references/accessibility.md`).
- **NEVER** glitch numerals, labels, or anything under 18px.
- **NEVER** leave a glitch running ambiently — corruption that is always on
  carries no information.

## The event pattern

Tie tier-2 eruptions to real state transitions, then settle:

1. A session's state changes in the store.
2. The affected row/hero fires a one-shot eruption (`.event` rowglitch, a hero
   glitch, or a spring settle).
3. The animation completes and the surface returns to its calm rest state.

```js
// re-trigger a one-shot animation reliably
row.classList.remove("event");
void row.offsetWidth;      // force reflow
row.classList.add("event");
```

- **MUST** drive eruptions from genuine events, not timers.
- **MUST** ensure every eruption settles back to rest.

## Reduced motion

The system is opt-out at the root — `control-room.css` already disables all
animation and transition under `prefers-reduced-motion: reduce`. Beyond that:

- **MUST** ensure every state remains fully legible with motion off — state is
  carried by color + shape + text, never by motion alone.
- **MUST** check `matchMedia("(prefers-reduced-motion: reduce)")` before starting
  any JS-driven loop (ticker, rAF) and skip it when set.
