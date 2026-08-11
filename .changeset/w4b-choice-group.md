---
"@alebianco/cr-components": major
"@alebianco/cr-styles": major
---

**Breaking:** `CrRadioGroup` is removed, replaced by `CrChoiceGroup`, which
handles both radio and checkbox grouping and renders `CrChoice` internally
instead of hand-rolling a second radio implementation.

The two types keep deliberately different keyboard models: radio uses a roving
tabindex where arrows move the selection; checkbox makes every box independently
tabbable with arrows inert. Radio takes `value` + `onChange`; checkbox takes
`values` + `onChangeMany`.

Migration: `<CrRadioGroup options value onChange />` →
`<CrChoiceGroup type="radio" options value onChange />`.
