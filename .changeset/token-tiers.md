---
"@control-room/design-system": minor
---

Add the missing token tiers: a **primitive** scale layer (4px-base spacing
`--space-*`, type scale `--text-*`, `--leading-*`, `--radius-none`, `--z-*`) and
a **component** token tier (`--cr-btn-*`, `--cr-panel-*`, …). The component layer
now consumes scales + component tokens instead of hardcoded px, so components are
overridable via their `--cr-*` tokens and the system follows the standard
global → semantic → component model.
