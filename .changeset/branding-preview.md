---
"@control-room/design-system": minor
---

Branding: a brand preview proof-sheet. `npm run build:brand-preview` →
`public/brands.html` renders **every** theme (built-in + brand, including `$modes`
variants) from its shipped appearance file: the surface ladder, the signal ramp
with its on-colour text and **measured WCAG contrast** (green = ok, red = below
target), and a strip of live components — each theme scoped to its own container so
they all render on one page. It reads only the built `dist/themes/*.css`, so it
always reflects exactly what ships.

Wired into `build` and `pretest:e2e`; the responsive gate now covers `brands.html`.
The component browser's theme switch also wraps now (it had grown past one row).
Docs: theming.md "Preview (proof sheet)". All gates green.
