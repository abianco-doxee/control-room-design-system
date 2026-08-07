---
"@control-room/design-system": minor
---

Theming & branding: a first-class **feature ⇄ appearance** split.

The token layer now ships as two independent layers so a consumer can keep the
system's structure and swap only its look:

- **`dist/structure.css`** — the brand-agnostic *feature* layer (spacing, borders,
  shadows, typography, motion, per-component tokens + the global baseline). Ship it
  once; it never changes with the brand.
- **`dist/themes/<name>.css`** — one file per theme (`dark`/`light`/`extreme`/
  `phosphor`), containing *only* the semantic role values. Swapping the appearance
  is swapping this one file. `dist/control-room.css` stays the all-in-one bundle
  (byte-identical) for back-compat.

**The theme contract** (`dist/theme-contract.json`) is the machine-readable
appearance surface — every semantic role a complete theme must define. Components
reference only these roles, never a colour, so any complete theme reskins the whole
system.

**Author a brand without forking.** New framework-agnostic core at
`@control-room/design-system/theme` (`lib/theme`): `validateTheme`, `mergeTheme`,
`themeCss`, `applyTheme` (runtime inject), `defineTheme`, and a WCAG
`contrastRatio`/`checkThemeContrast`. A brand file (`brands/*.json`) states just an
`$extends` base plus the roles it overrides; `npm run build:theme` validates it
against the contract, contrast-checks it, and emits `dist/themes/<name>.css` through
the same renderer the built-in themes use. Worked example: **`brands/slate.json`**
— a neutral corporate re-skin that touches no component CSS and no structure token.

New exports: `./structure.css`, `./themes/*`, `./theme-contract`, `./theme`. New
`build:theme` + `verify:theme` scripts (verify: wired into `npm run verify` and
CI), and a `test:theme` node suite (9 tests): contract triangulation
(tokens.json ≡ lib ≡ generated), validation, extends/merge, contrast, and the
slate brand. All gates green.
