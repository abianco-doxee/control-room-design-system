---
"@control-room/design-system": minor
---

Loudness dials — a `calm` operations profile alongside the default showcase look.

The system is deliberately loud (texture, per-row decoration, keyed motion). That's
right for a showcase and can be a notch much for 8-hour operational use. Make loudness
a **product setting**, not a global redesign:

- New tokens `--motion-intensity` and `--decoration-intensity` (both `1` by default).
- Set `data-intensity="calm"` on `<html>` for the ops profile: non-essential animation
  is dialed to a reduced-motion equivalent and decorative texture layers (`.cr-tex--*`,
  which follow `--decoration-intensity`) are toned down. The default (no attribute) is
  the unchanged loud/showcase profile, so nothing regresses.

Verified: the default gallery is byte-identical in visual regression (all four themes);
a new gate confirms the `calm` profile flips both tokens.
