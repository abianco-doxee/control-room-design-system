# Control Room Design System

A formal, AI-native definition of the **Control Room** design language and
component library — the neon-noir, neobrutalist instrument style for dense
operational dashboards (session monitors, sprint boards, agent control rooms).

This package is both **documentation for humans** and a **Claude Code skill** an
agent loads to produce work that reads as part of the system. It formalizes and
extends what was prototyped in the two "Control Room" design artifacts (the *Art
Style Language v2* and the *Design Direction* proposal) and partially
implemented in the `dp-tooling` `sprint-dashboard` skill.

## What's here

```
control-room-design-system/
├── SKILL.md                       # entry point — when to use, index, one-screen ruleset
├── README.md                      # this file
├── references/
│   ├── design-language.md         # the SEVEN LAWS — the why + do/don't for every decision
│   ├── tokens.md                  # full token reference (4 themes) + how to consume
│   ├── components.md              # component library — spec + copy-ready markup per component
│   ├── motion.md                  # four motion tiers, glitch/CRT vocabulary, reduced-motion
│   ├── accessibility.md           # WCAG 2.1 AA contract for the aesthetic
│   └── seeded-cat.md              # the identity+state pixel-cat generator (paint() contract)
├── tokens/
│   ├── tokens.json                # machine-readable token source of truth
│   └── control-room.css           # ready-to-use CSS custom properties, all 4 themes
├── templates/
│   └── component.md               # the spec template every new component follows
└── checklists/
    └── component-checklist.md      # the ship gate
```

## Design approach

Control Room is defined the way the strongest AI-native design systems are —
optimized to be *generable*, not just *readable*:

- **Constraint hierarchy.** Every rule is tagged `MUST` / `SHOULD` / `NEVER`, so
  an agent can obey it mechanically rather than interpreting prose.
- **Research-grounded language.** The seven laws cite what real productions are
  *documented* to do (Redline, Dandadan, Fallout's Pip-Boy, Evangelion/Khara,
  Edgerunners, neobrutalism) — decisions, not vibes.
- **Token-first.** A single token layer (`tokens/`) drives four themes on an
  intensity dial; any component built from tokens survives a theme flip with zero
  per-theme code.
- **Spec'd components.** Each component has a formal anatomy, token list,
  variants, copy-ready markup, motion, and a11y notes — plus a template and a
  ship checklist so new ones stay consistent.

## Quick start

```html
<link rel="stylesheet" href="tokens/control-room.css" />
<html data-theme="dark">   <!-- or light | extreme | phosphor; omit for dark -->
```

Then compose from `references/components.md`. Read `references/design-language.md`
first before building anything new.

## Provenance & scope

- **Source of truth:** the two Control Room artifacts (art style language +
  design direction), transcribed faithfully into `tokens/` and the references.
- **Not yet reconciled:** the live `dp-tooling/skills/sprint-dashboard`
  implementation was private/out of scope for this pass. When integrating,
  reconcile its actual token names against `tokens/tokens.json` and fold any
  divergences back here so this package stays the single source of truth.
- **Themes:** `dark` is authoritative; `light`, `extreme`, and `phosphor` carry
  the full token set. `phosphor` is the extended monochrome CRT theme.
