# Accessibility Contract

Control Room is high-contrast and loud by nature, but loud is not the same as
accessible. The aesthetic and WCAG **2.1 AA** coexist by design; where they would
conflict, accessibility wins. These are hard requirements, not suggestions.

## Contrast

- **MUST** meet WCAG 2.1 AA: **4.5:1** for text under 18px (or under 14px bold),
  **3:1** for large text and for meaningful UI/graphic boundaries.
- **MUST** pair every signal fill with `--on-sig` for text/icons placed on it —
  except **error** fills (`--sig-err`), which use `--on-err` (white in light, dark
  elsewhere). Both are tuned per theme to clear AA; when you add a signal hue,
  re-verify the pair in **all four** themes before shipping.
- **MUST** keep the near-black `--border` as the boundary between adjacent signal
  fills — it is what keeps a keyed contact sheet legible.
- **SHOULD** treat the mono `--muted` label color as the floor for secondary
  text; do not introduce a fainter grey.

## Color is never the only channel

Color carries state (Law 2), so it must be backed up:

- **MUST** pair every StatusDot / keyed region with a text or shape equivalent —
  an `aria-label`, a visible label, or one of the Law 4 diagonal primitives.
- **SHOULD** reach for the **severity shape** (`.cr-sev--*`, Law 4) when a state
  needs a non-colour reading: the polygon's side-count encodes danger independent
  of hue, so it is the built-in backup for the `phosphor` (monochrome) theme and
  for colour-blind operators.
- **MUST** keep the system fully usable in the `phosphor` theme, which is
  effectively monochrome — if a screen only works because of hue, it is broken.

## Focus

- **MUST** keep a visible focus indicator. The system default is already set in
  `control-room.css`:
  ```css
  *:focus-visible { outline: 3px solid var(--sig-work); outline-offset: 2px; }
  ```
- **NEVER** remove focus outlines. If a component needs a custom focus style, it
  must be at least as visible as the default and use a signal hue.
- **MUST** keep a logical tab order and standard keyboard operation for all
  interactive components (Button, Nav links, controls). Native elements
  (`<button>`, `<a>`) are strongly preferred over `div`s with handlers.

## Motion

- **MUST** honor `prefers-reduced-motion: reduce` — enforced globally, but every
  component must also remain fully legible with motion off (state via color +
  shape + text, never motion alone; see `references/motion.md`).

## Glitch, decay, and cursed text (Law 3)

Corruption is decorative; it must never reach assistive tech.

- **MUST** let the **clean** string own the accessible name (`aria-label` or the
  real text node), and mark the corrupted/zalgo layer `aria-hidden="true"`.
- **NEVER** apply glitch to numerals, labels, or anything under 18px — this is
  both a design law and an a11y rule (it destroys legibility).
- **MUST** cap combining marks at 2 per glyph so corrupted text cannot overflow
  and cover adjacent content.

## Canvas sprites (the pixel-cat)

- **MUST** give each cat a text equivalent naming the session and its state
  (e.g. `aria-label="nova — waiting"`) or mark it `aria-hidden` when an adjacent
  text label already carries that information.
- **NEVER** rely on the sprite pose as the only indication of state.

## Automated gate

Accessibility is enforced by CI, not just documented. `npm run test:a11y`
(Playwright + axe-core) loads the living gallery in **all four themes** and fails
on any **serious/critical** WCAG 2.1 A/AA violation (scoped to the component
region). It runs on every push (`.github/workflows/deploy.yml`) and blocks the
deploy. A companion visual-regression check (`npm run test:visual`) snapshots the
gallery per theme; run `npm run test:visual:update` after intentional changes.

## Component acceptance (a11y slice)

Before shipping, confirm:

- [ ] Text and UI boundaries meet AA contrast in dark / light / extreme / phosphor.
- [ ] Every signal use has a non-color backup (label / shape / aria).
- [ ] Focus is visible and keyboard operation works.
- [ ] Reduced-motion leaves the component fully legible.
- [ ] Decorative glitch/canvas is `aria-hidden`; the clean string is the name.
