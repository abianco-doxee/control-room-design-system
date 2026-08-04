---
name: control-room-design-system
description: >-
  The Control Room design system — a neon-noir, neobrutalist instrument for
  dense operational dashboards (session monitors, sprint boards, agent control
  rooms). Use whenever building, restyling, or reviewing any UI that should
  match Control Room: its design language (the nine laws), design tokens
  (four themes on an intensity dial), component library, motion tiers, the
  seeded pixel-cat, and its accessibility contract. Triggers include "control
  room", "sprint dashboard", "neon-noir dashboard", "the nine laws", building
  a Panel/Chip/Button/StatusDot/SessionRow/Bezel in this style, adding a theme,
  or generating a component that must read as part of this system.
metadata:
  version: "1.0.0"
  license: proprietary
  bundle: control-room
---

# Control Room Design System

An operator's instrument, not an admin template. Control Room is a **neon-noir,
neobrutalist** design language for dense dashboards that get scanned under
pressure. Black is a mass; one hue keys the scene and it *means* something;
decay carries information. Everything is grounded in documented references
(Redline, Dandadan, Fallout's Pip-Boy, Evangelion/Khara, Edgerunners,
neobrutalism) rather than in a taste debate — see `references/design-language.md`.

This skill is the formal, extended definition of that system: the language, the
tokens, the component library, and the rules an agent must follow to produce
work that reads as part of the whole.

## When to use this skill

- Building any Control Room / sprint-dashboard / agent-monitor UI or component.
- Restyling an existing surface to match, or reviewing whether it matches.
- Adding or adjusting tokens, themes, components, or motion.
- Deciding a visual question ("should this corner round?", "can I glitch this?")
  — the answer is in the laws, not in preference.

If the task is a generic marketing site, a document, or a UI in someone else's
brand, this is the wrong skill. Control Room is opinionated on purpose.

## How to read this skill

Detail lives in `references/`. Load only what the task needs.

| File | Read it when you need… |
| --- | --- |
| `references/design-language.md` | The **nine laws** — the *why* and the do/don't for every visual decision. Read this first for any new component. |
| `references/tokens.md` | The full token reference — every variable, every theme, and how to consume them. |
| `references/components.md` | The **component library** — formal spec + API for each component (Panel, Button, Chip, StatusDot, SessionRow, Rail, Hero, Bezel, Table, Tag, diagonal primitives, keyed tiles, drip, form controls, instrument shell, and the overlays — Modal / Toast / Tooltip). |
| `references/motion.md` | The four motion tiers, the glitch/CRT vocabulary, and the reduced-motion contract. |
| `references/accessibility.md` | The accessibility contract — contrast, focus, ARIA, and how the aesthetic and a11y coexist. |
| `references/seeded-cat.md` | The seeded pixel-cat: identity-from-seed, pose-is-state, the `paint()` contract. |
| `references/seeded-sigil.md` | The seeded cyber-sigil: identity-from-seed pixel glyph (cyber-sigilism), state-keyed hue, the drip vocabulary. |
| `references/decoration.md` | ASCII/pixel decoration for **dead space** — seeded density fields (Braille/block), telemetry frame trim, drafting grids, empty-states; the decorative-only contract (aria-hidden, whisper, mask-faded). |
| `tokens/tokens.json` | Machine-readable token source (parse this to generate CSS/Tailwind/JSON). |
| `dist/control-room.css` | Ready-to-use CSS custom properties for all four themes. Import first. |
| `styles/components.css` | The shipped component layer — `cr-`prefixed classes (`.cr-panel`, `.cr-btn`, …) built on the tokens. Import after the tokens. |
| `references/tailwind.md` | Tailwind-first authoring — the token-driven Tailwind v4 `@theme`, utility→token map, and theme-reactive utilities. |
| `references/frameworks.md` | Author-once interactive components (Mitosis) compiled to idiomatic React/Vue/Svelte/Angular/Solid; styling stays in the `cr-` classes. |
| `templates/component.md` | The authoring template every new component follows. |
| `checklists/component-checklist.md` | The ship gate. A component is not done until it passes. |

## Constraint hierarchy

Every rule in this skill is tagged so an agent can obey it mechanically. This
convention (borrowed from constraint-based design skills) is what makes the
system *generable* rather than merely described.

- **MUST** — absolute requirement. Violating it produces something that is not
  Control Room.
- **SHOULD** — strong default. Deviate only with a stated reason.
- **NEVER** — explicit prohibition. No exceptions without changing the system.

## The system in one screen

The irreducible rules. Each expands in the references.

- **MUST** build on the token layer (`dist/control-room.css`). Never hardcode a
  hex, a border width, or a shadow that a token already names.
- **MUST** keep every corner square. `--radius` is `0` and stays `0`. **NEVER**
  round a corner, blur a shadow, or add a gradient to a content surface — with
  exactly one exception: the Law 9 **breach** (see below).
- **MUST** treat color as state, not decoration. A signal hue on screen asserts
  a real machine state (working / waiting / done / error / idle) or a real
  action (accent). **NEVER** flood a region with a hue that doesn't correspond
  to state.
- **MUST** use exactly two type registers — display (`--font-display`: a condensed
  heavy grotesque, Saira Condensed 900, uppercase, tight) and data (JetBrains
  Mono, 12–13px). **NEVER** introduce 18–24px sans body text.
- **MUST** keep texture (halftone, scanlines, grain) on hardware only — inside a
  bezel. **NEVER** put texture on a flat content field.
- **MUST** keep glitch/decay proportional to severity and off of data. **NEVER**
  glitch numerals, labels, or anything under 18px; **NEVER** ambient-glitch a
  whole screen.
- **MUST** survive a theme flip. Any component built only from tokens works in
  dark / light / extreme / phosphor with zero per-theme code.
- **MUST** meet the accessibility contract (`references/accessibility.md`):
  visible focus, reduced-motion honored, decorative corruption `aria-hidden`
  with the clean string owning the accessible name.
- **MUST** write in the machine voice (Law 8): present tense, datum first, one
  line, no apology, no cheer, no emoji (`2 failing`, not "Oops — something went
  wrong!"). **NEVER** address the operator in the first person.
- **MAY** break one law, once, on purpose (Law 9 — the **breach**): the single
  most exceptional item on a screen may use a glow / gradient / soft corner / blob
  (`.cr-breach`) to stand apart. **NEVER** more than one per screen, and **NEVER**
  on data or routine chrome — the breach only reads because everything else obeys.

The **tells** — the marks that make a screen unmistakably Control Room: the one
hard offset shadow (and press-into-shadow `:active`), absolute-square corners,
color-as-state, two type registers, texture only on bezel hardware,
geometric-glyph icons (no icon font), the `.cr-mark` registration ticks, the drip
+ arrow-rail, and the seeded cat. See `references/design-language.md#signatures`.

## Quick start

```html
<!-- 1. Load the token layer, then the component layer (order matters). -->
<link rel="stylesheet" href="dist/control-room.css" />
<link rel="stylesheet" href="styles/components.css" />

<!-- 2. Set a theme on <html>. Omit for dark. -->
<html data-theme="dark">

<!-- 3. Use the shipped classes — correct in all four themes, zero inline CSS. -->
<section class="cr-panel cr-panel--major">
  <h4 class="cr-panel__title">Sessions</h4>
  <div class="cr-row">
    <span class="cr-dot" style="background: var(--sig-work)"></span>
    <span class="cr-row__name">PTL-757 chat-turn</span>
    <span class="cr-row__status">streaming</span>
  </div>
</section>
```

For the full anatomy, variants, and token bindings of every component, see
`references/components.md`; the class list lives in `styles/components.css`.
