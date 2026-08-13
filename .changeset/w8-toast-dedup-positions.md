---
"@alebianco/cr-components": minor
"@alebianco/cr-styles": minor
---

`CrToastRegion` packs identical toasts and gains five new anchors.

Consecutive toasts sharing the same `message` **and** `signal` now collapse into a
single row carrying a `×N` counter, so a retry storm costs one row instead of ten.
Only *consecutive* runs pack — an unrelated toast in between keeps the occurrences
separate and preserves arrival order.

The new `CrToastGroup` type carries two ids on purpose: `id` is the **oldest**
member's (stable identity, so the row is patched rather than remounted as the run
grows) and `newestId` is the **dismiss target** passed to `onDismiss`, so
dismissing removes the toast the user is actually looking at. Keying the row on
`newestId` would remount it on every duplicate and refire its live region; a
cross-framework gate now enforces that in all six compiled targets.

The counter is `aria-hidden`. It is the only thing that changes when a duplicate
arrives, so the live region's announced text stays byte-identical and a repeat
updates the count instead of re-announcing — important because `err` toasts
announce *assertively*.

`position` grows from four corners to nine anchors: the two horizontal centers
(`tc`, `bc`) and the three vertical middles (`ml`, `mr`, `mc`) join `tr`/`br`/`tl`/`bl`.
Centred anchors use `50%` plus a `translate`, so the region keeps its shrink-to-fit
width. `bc` stacks newest nearest the edge, like the other bottom anchors.

New styling part: `count` (`.cr-toast__count`).
