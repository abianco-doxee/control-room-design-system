---
"@control-room/design-system": minor
---

Unify the state/signal prop across components on one name + one vocabulary.

The same concept — which signal a component carries — was expressed four ways
(`tone`/`state`/`signal`) with divergent value sets. Standardize on **`signal`** with
the canonical vocabulary **work · wait · done · err · idle · accent**:

- CrTag, CrStatusDot, CrSessionRow, CrMeter, CrProgress now take `signal`. The legacy
  props (`tone`/`state`) still work — they're marked `@deprecated` and resolve as a
  fallback — so existing consumers don't break.
- CrAlert and CrToast already used `signal` (unchanged). CrButton (`kind`) and CrChip
  (`tone`) keep their names: those axes are genuinely structural (button variant /
  chip style), not the signal vocabulary.
- Reference app, playground demos, and the catalog variant descriptors updated to the
  canonical `signal`; the playground code snippets now teach it.

No behavior change — the legacy values still resolve (Tag's now/later/no via the
existing CSS aliases). Type-check, catalog drift, a11y, and islands gates all pass.
