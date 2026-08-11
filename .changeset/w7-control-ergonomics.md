---
"@alebianco/cr-components": major
"@alebianco/cr-styles": major
---

**Breaking:** `CrToggleChip`'s `count?: number` is replaced by
`badge?: string | number | boolean` (a bare `true` renders a dot).
`CrCalendar`'s `weekStart?: number` is replaced by
`weekStart?: "sunday" | "monday"` — `0`/`1` carried no meaning at the call site.

Also: checkbox and radio are now visually distinct, visible when unchecked in
every theme, and no longer shift the row when toggled; the switch knob tracks
its state instead of always sitting left; `CrToggleChip`'s pressed and hover
states are legible in all four themes; `CrInput` gains `icon`, `clearable` and
`onClear`; the textarea resizes in both directions; and the calendar gains a
month/year switcher (`switcher`, `yearSpan`) plus a readable selected+hovered
day.

The calendar's selected day was unreadable while hovered — `.cr-calendar__day:hover`
is two classes and outranked the single-class `--selected`, dropping the
near-black selected foreground onto the plain hover surface at 1.30:1 (dark),
1.32:1 (extreme) and 1.19:1 (phosphor). Hovering a selected day now keeps the
accent, sunk 15% toward the calendar's own surface: 8.46 · 6.49 · 9.51 · 11.09
across dark/light/extreme/phosphor, all clear of the 4.5:1 small-text bar.

The switcher preserves the SSR contract: `month` and `today` stay injected and
the component still never reads the clock. Its year list is derived from the
*displayed* year, and the month dropdown, year dropdown and the existing
prev/next steppers all emit `onMonthChange` with the new `YYYY-MM`.

Migration: `count={3}` → `badge={3}`; `weekStart={1}` → `weekStart="monday"`,
`weekStart={0}` → `weekStart="sunday"` (or omit — sunday is the default).
