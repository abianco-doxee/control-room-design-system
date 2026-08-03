---
name: control-room-design-system
description: >-
  The Control Room design system — a neon-noir, neobrutalist instrument for
  dense operational dashboards (session monitors, sprint boards, agent control
  rooms). Use whenever building, restyling, or reviewing any UI that should
  match Control Room: its design language (the seven laws), design tokens
  (four themes on an intensity dial), component library, motion tiers, the
  seeded pixel-cat, and its accessibility contract. Triggers include "control
  room", "sprint dashboard", "neon-noir dashboard", "the seven laws", building
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
| `references/design-language.md` | The **seven laws** — the *why* and the do/don't for every visual decision. Read this first for any new component. |
| `references/tokens.md` | The full token reference — every variable, every theme, and how to consume them. |
| `references/components.md` | The **component library** — formal spec + API for each component (Panel, Button, Chip, StatusDot, SessionRow, Rail, Hero, Bezel, Table, Tag, diagonal primitives, keyed tiles, drip). |
| `references/motion.md` | The four motion tiers, the glitch/CRT vocabulary, and the reduced-motion contract. |
| `references/accessibility.md` | The accessibility contract — contrast, focus, ARIA, and how the aesthetic and a11y coexist. |
| `references/seeded-cat.md` | The seeded pixel-cat: identity-from-seed, pose-is-state, the `paint()` contract. |
| `references/figma-bridge.md` | Optional, free Figma → code round-trip: the `figma` map, the open-source Figma MCP, secret handling, and the node → component agent workflow. |
| `references/figma-kit-build.md` | How to create the Figma kit from scratch: file setup, near-automatic token import (DTCG → Variables), the component recipe, and closing the loop back to the catalog. |
| `tokens/tokens.json` | Machine-readable token source (parse this to generate CSS/Tailwind/JSON). |
| `dist/control-room.css` | Ready-to-use CSS custom properties for all four themes. Import and go. |
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
  round a corner, blur a shadow, or add a gradient to a content surface.
- **MUST** treat color as state, not decoration. A signal hue on screen asserts
  a real machine state (working / waiting / done / error / idle) or a real
  action (accent). **NEVER** flood a region with a hue that doesn't correspond
  to state.
- **MUST** use exactly two type registers — display (Archivo 900, uppercase,
  tight) and data (JetBrains Mono, 12–13px). **NEVER** introduce 18–24px sans
  body text.
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

## Quick start

```html
<!-- 1. Load the token layer once, at the root. -->
<link rel="stylesheet" href="dist/control-room.css" />

<!-- 2. Set a theme on <html>. Omit for dark. -->
<html data-theme="dark">

<!-- 3. Compose from tokens. This Panel is already correct in all four themes. -->
<section style="
  background: var(--panel);
  border: var(--brd-heavy) solid var(--border);
  box-shadow: var(--shadow-off) var(--shadow-off) 0 var(--shadow-col);
  padding: 16px;">
  <h4 style="
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: var(--type-label-tracking);
    color: var(--ink); margin: 0 0 12px;">Sessions</h4>
  <!-- rows … -->
</section>
```

For the canonical, copy-ready markup of every component, see
`references/components.md`.
