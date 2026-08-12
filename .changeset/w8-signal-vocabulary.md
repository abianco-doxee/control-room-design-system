---
"@alebianco/cr-components": major
"@alebianco/cr-tokens": minor
"@alebianco/cr-styles": minor
---

One canonical signal vocabulary, and two token splits that stop a colour meaning
two different things.

**`signal` is the only name for the state channel.** Every component that keys to
Law 2's state ramp now spells the prop `signal` and draws its members from one
list — `work · wait · done · err · idle · accent · accent2` — recorded in Law 2 of
`references/design-language.md`. A component may still ship a *subset*, but only
by dropping members from the tail, never by renaming one: `idle` is dropped where
the component only exists while something is happening (Toast, Alert, Timeline),
and `accent`/`accent2` are dropped from pure state readouts (StatusDot,
SessionRow, Spinner, Progress) where an action key would be a category error.

Two divergences turned out to be the same channel wearing a different name, so
both are **breaking**:

- `CrChip`'s `tone?: "done" | "alt"` is now
  `signal?: "work" | "wait" | "done" | "err" | "idle" | "accent"`. `alt` was never
  a separate concept — `.cr-chip--alt` resolved to `var(--sig-work)`, i.e.
  `signal="work"`. `done` stays the default and needs no modifier. Migrate
  `tone="done"` → `signal="done"` and `tone="alt"` → `signal="work"`. Chip gains
  the four members it was missing; all six variants clear 4.5:1 for their
  `--text-xs` label in all four themes.
- `CrAlert`'s `signal="info"` is now `signal="work"` (and `.cr-alert--info` is
  `.cr-alert--work`). `info` already resolved to `var(--sig-work)`; it was the
  working state under a non-canonical name.

**`--focus` is now its own token, separate from `--sig-work`.** WCAG 2.4.11 wants
a focus indicator at 3:1 against the surfaces it touches, and the light theme's
working cyan `#0891b2` reached only **2.86:1** against `--board`. The ring now
draws in `--focus`, which tracks `--sig-work` exactly in dark, extreme and
phosphor and darkens to `#00627a` in light — same hue, **5.38:1** at its worst
surface (was 2.86). `--sig-work` itself is unchanged in every theme, so progress
fills, spinners and status dots keep their existing colour and their `--on-sig`
pairing. A brand that re-keys `--sig-work` can no longer silently break its own
focus ring. This also fixes a latent bug: `.cr-chart__key:focus-visible` already
referenced `var(--focus)`, which had never been defined.

**`--seam` splits the chassis edge from the internal seam.** `--border` is
near-black, so inside a panel it measured **1.21 / 1.21 / 1.01** on dark /
extreme / phosphor — correct as an outer contour against the lighter board,
invisible as a divider drawn within a panel. The new `--seam` role brackets
between surface and ink in every theme (**5.19 / 7.02 / 7.45 / 6.26** against
`--panel`), and three internal rules move onto it:

| Rule | before | after |
| --- | --- | --- |
| `.cr-accordion__item + .cr-accordion__item` | 1.21 / 20.34 / 1.21 / 1.01 | 5.19 / 7.02 / 7.45 / 6.26 |
| `.cr-resizable__handle::before` | 1.21 / 20.34 / 1.21 / 1.01 | 5.19 / 7.02 / 7.45 / 6.26 |
| `.cr-grid__row` bottom rule | 1.07 / 4.46 / 1.07 / 1.03 | 5.19 / 7.02 / 7.45 / 6.26 |

The grid row rule had been `color-mix(--cr-datagrid-border 55%, transparent)`,
which was diluting a line that already sat below the floor — mixing a colour
toward the background it matches lowers the ratio rather than raising it. Outer
edges keep `--border`: `--cr-accordion-border` and `--cr-datagrid-border` still
mean *chassis edge*, and the new `--cr-accordion-seam` / `--cr-datagrid-seam`
mean *internal divider*. Both are per-component overridable as usual.

`--seam` and `--focus` are theme values, not new required roles, so existing
brands stay valid without changes.

**`CrPagination` uses the house direction glyphs.** Its prev/next controls were
`‹ ›`, the only place in the library those appeared; they are now `◂ ▸`, the same
solid triangles `CrCalendar` and `CrCarousel` already use for the identical
control, each `aria-hidden` behind the button's `aria-label`. The marker-versus-
control distinction is carried by the element, not by a second glyph shape — now
recorded under Law 4.
