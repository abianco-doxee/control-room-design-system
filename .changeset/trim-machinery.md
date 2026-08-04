---
"@control-room/design-system": minor
---

Trim over-built machinery (from the critic review; nothing that carried real
capability was removed):

- **Figma track removed** — `references/figma-bridge.md`, `references/figma-kit-build.md`,
  `scripts/figma-pull.mjs`, `.github/workflows/figma.yml`, `.mcp.json`, the
  `figma:pull` script, the registry `figma` field, and all doc/sidebar/SKILL
  references. It was a code↔design bridge for a Figma file that doesn't exist
  (populated on 1 of 32 entries).
- **Style Dictionary + `tailwind-preset.cjs` dropped** — `build-tokens.mjs` now
  emits the CSS vars with a plain map (SD was used as a glorified `.map()`), and
  the unused Tailwind **v3** preset (which conflicted with the shipped v4
  `dist/tw-theme.css`) is gone, along with the `./tailwind-preset` export and the
  `style-dictionary` dependency. Tailwind v4 `@theme` is the single integration.
- **Skill install → `.claude` only** — dropped the `.cursor` / `.opencode`
  fan-out (solo repo; one provider).

Kept: DTCG export, Astro/Starlight docs, the full Mitosis multi-target compile.
a11y passes all four themes.
