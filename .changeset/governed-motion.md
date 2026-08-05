---
"@control-room/design-system": minor
---

Governed motion: glitch, idle attention, keyed interaction, and a sanctioned 3D break.

Fills the gap between the "keyed motion" law and the implementation. New tokens
(`--dur-fast|med|ambient`, `--ease-snap|step`) and four opt-in utilities, all
transform/opacity/shadow-only (60fps) and silenced by both `prefers-reduced-motion`
and the `calm` intensity profile (idle loops stop; interaction feedback stays):

- **`.cr-glitch`** (`data-text`) — RGB-split datamosh on hover; `--on` for continuous alerts.
- **`.cr-attention`** — a slow breathing glow to pull the eye to the one primary/"needs you"
  action (keys to `--cr-attn`).
- **`.cr-keyed`** — a keyed edge-sweep on hover/focus for interactive rows/cards/nav.
- **`.cr-tilt` / `--live`** — a perspective hover tilt (with optional idle float): a
  sanctioned break of the flat plane, used sparingly like the Law-9 breach.

Demoed in the gallery (four themes) and documented in `references/motion.md` with the
governance + restraint rules. verify, verify:types, a11y (gallery + showcase), and
responsive pass; visual baselines refreshed.
