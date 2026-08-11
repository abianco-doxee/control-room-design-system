---
"@alebianco/cr-styles": minor
---

`CrStepper`, `CrTabs` and `CrAvatar` now use the Law 4 diagonal primitives
(chevron · direction, notch · state, wedge · focus, arrow-rail · sequence). The
shapes previously existed in the stylesheet but no component used them, so the
design language defined a vocabulary nothing spoke.

`CrAvatar`'s presence dot takes the **notch**, the primitive Law 4 assigns to
state — it matters most on the phosphor theme, where every signal colour
collapses into one green/yellow band and the geometry becomes the only reading
that separates online from busy.

`CrHero` and `CrMasthead` were evaluated and deliberately left unshaped: they are
display surfaces with no direction to point at and no sibling panel to be the
active one, and Law 4 says a diagonal that does not encode direction, state,
focus or sequence must be deleted rather than added.

Semantic state (`role="img"` + `aria-label`, `aria-current`, `aria-selected`) is
unchanged — the shapes reinforce it visually rather than replacing it.
