---
"@control-room/design-system": minor
---

Add an ASCII / pixel **decoration system** for dead space (researched from the
block-elements + Braille + FUI/NERV vocabulary). All decoration is aria-hidden,
non-interactive, whisper-contrast, and mask-faded off content — atmosphere, never
data.

- **CrAscii** — seeded canvas density field (braille / block `░▒▓` / ascii ramp),
  value-noise driven; `.cr-ascii` + `--mask-l/-r/-edge` position/fade helpers.
- **CrTelemetry** + `.cr-telemetry` — seeded NERV-style readout string
  (`SEED 2E7A · 0x4F · 12ms ▮▮▮▯▯`) for a frame corner. Decoration, not data.
- **Telemetry trim** — `.cr-trim` (2 corners) / `.cr-trim--4` (all four brackets)
  and `.cr-ruler` (FUI tick-ruler edge).
- **Drafting field** — `--field` token + `.cr-bg--field` for dead background space.
- **Empty states** — an aria-hidden field behind a mono label (`░ NO SIGNAL ░`).

New `references/decoration.md` (system + the decorative-only contract); composed
masthead now carries a mask-faded braille field + corner telemetry. Catalog +2
(32 components). a11y passes all four themes; baselines refreshed.
