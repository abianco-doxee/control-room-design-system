---
"@alebianco/cr-components": major
---

**Breaking:** overlay placement is now collision-aware and two-axis. `CrPopover`,
`CrMenu` and `CrHoverCard` no longer accept `align?: "left" | "right"` — use
`placement?: string` instead (`"bottom-start"` default, `${side}` or
`${side}-${align}`). `CrTooltip` gains the same `placement` prop.

All four now flip and shift to stay within the viewport. `CrMenu` and
`CrHoverCard` previously had no placement logic at all (alignment was a CSS
modifier); `CrPopover`'s panel no longer flickers on open.

Migration: `align="left"` → `placement="bottom-start"`, `align="right"` →
`placement="bottom-end"`.
