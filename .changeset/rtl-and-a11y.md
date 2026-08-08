---
"@control-room/design-system": minor
---

RTL support + interaction-a11y verification (completing the overlay/a11y gap).

**RTL:** the component stylesheet is now direction-agnostic — 36 physical flow
declarations converted to CSS **logical** properties (`margin-inline-*`,
`padding-inline-*`, `border-inline-*`, `text-align: start/end`), so the system
mirrors under `dir="rtl"`. Pixel-identical in LTR (visual baselines unchanged). A
guard (`test:rtl`) fails the build if a physical flow property returns, and the
responsive gate now also checks no horizontal overflow under RTL.

**Focus & keyboard (verified + documented):** the dialog overlays (Modal, Drawer,
Command palette) use native `<dialog>` + `showModal()`, so focus trap and
focus-return come from the platform; Popover moves focus in on open and returns it
on Esc (the stale-read fix in the previous change restored focus-on-open); roving
focus / `aria-activedescendant` is in place for Tabs, Radio group, Segmented,
Combobox and the palette. Documented in accessibility.md ("Direction (RTL)",
"Focus management & keyboard"). All gates green.
