---
"@control-room/design-system": patch
---

Correctness & credibility pass (from the four-critic review):

- **Theme-blind canvases fixed.** CrCat / CrSigil / CrChrome / CrAscii now read
  their palette from the resolved CSS custom properties at paint time instead of
  hardcoding neon hex — so they honour every theme (they no longer render
  full-colour in monochrome phosphor, which the "survives a theme flip / phosphor
  a11y" claim required). The gallery painters do the same and repaint on
  theme-switch.
- **Component bugs.** CrField gains an onChange (was a read-only controlled input
  in React); CrChoice uses event.target.checked (radios no longer toggle off);
  CrModal names the dialog (aria-label fallback, no empty h2); CrToast is
  self-dismissable so a sticky err can always be cleared; CrSessionRow labels the
  dot with the human status, not the raw state code.
- **Contradictions.** Display face reconciled to Saira Condensed everywhere
  (SKILL + tells said Archivo); README law-count fixed to nine + stale file-tree
  rewritten; Figma guide "16 components" → the catalog.
- **Drift gates.** New `verify:palette` (build-palette --check) confirms the
  committed palette AND that tokens.json matches the OKLCH generator — closing the
  orphan-generator drift trap; wired into `verify`. The stale hand-typed per-theme
  hex matrix in tokens.md (every row wrong) is replaced by a pointer to the
  generated tokens.flat.json.

a11y passes all four themes; visual baselines refreshed (canvases changed).
