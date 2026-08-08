---
"@control-room/design-system": minor
---

The calendar time axis (`CrLineChart` with `xTime`) can now be expressed the way a
team reads it, via three optional props (and matching `timeTicks` options):

- **`xLocale`** — month-name language: `"en"` (default) or `"it"` (`gen · feb …`).
- **`xWeek`** — weekly ticks as dates (`3 Mar`, default) or **ISO week numbers**
  (`W10`, still Monday-based).
- **`xFiscalStart`** — fiscal year start month `1–12` (default `1` = calendar). Year
  and quarter ticks then anchor to it and label **`FY`/`Q`** (FY named by the ending
  calendar year), e.g. `xFiscalStart={4}` → `Q1 FY26 · Q2 · Q3 · Q4`, years on 1 Apr.

Defaults reproduce the previous Gregorian output exactly (backward-compatible). The
`time-scale` export gains `locale` / `week` / `fiscalStart` options with unit tests
(Italian labels, ISO weeks on Mondays, April fiscal FY/Q anchoring, backward-compat).
The line-chart showcase gains span / locale / week / fiscal controls.
