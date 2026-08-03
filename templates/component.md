# Component Spec Template

Copy this template to define a new Control Room component. A component is not part
of the system until it has a spec in this shape and passes
`checklists/component-checklist.md`. Fill every section; delete none.

---

## <ComponentName>

**Purpose.** One sentence: what it is and the single job it does.

**When to use / not use.** The decision boundary against neighbouring components.

**Anatomy.** The parts, back to front (container → sub-regions → content).

**Tokens.** Every token consumed, grouped: surface · text · line · signal ·
motion. (If you reach for a value with no token, stop — add the token first, per
`references/tokens.md`.)

**Variants.** The named axes and their allowed values (e.g. `weight:
default|major`, `state: work|wait|done|err|idle`). Variants map 1:1 to props when
ported to a framework.

**States.** rest · hover · focus · active/press · disabled · loading · error —
whichever apply. Note the tier-0 press behavior.

**Props / API** (when implemented as a framework component).

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| … | … | … | … |

**Markup (copy-ready).**

```html
<!-- canonical HTML -->
```
```css
/* uses only var(--…) tokens; radius 0; hard shadow; no gradient/blur */
```

**Motion.** Which tier(s) it uses and the exact effect (`references/motion.md`).

**Accessibility.** Roles, labels, keyboard, contrast, reduced-motion, and any
`aria-hidden` on decorative layers (`references/accessibility.md`).

**Law check.** One line per relevant law confirming compliance:

- L1 mass/border — …
- L2 color = state — …
- L4 diagonals (if any) — …
- L5 two registers — …
- L6 texture (bezel only) — …
- L3/L7 glitch & motion — …

**Do / Don't.** Two or three `MUST` / `NEVER` bullets specific to this component.
