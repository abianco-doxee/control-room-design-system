---
"@alebianco/cr-components": patch
---

`CrRelativeTime` emits a valid `datetime` attribute on every target.

The source spelled it `dateTime`. React and Vue map that camelCase form onto the
DOM attribute, but **Qwik, Svelte and Solid emit it literally**, so those three
rendered `<time dateTime="…">` — not a valid HTML attribute, which means the
machine-readable instant was silently lost for assistive technology and for
anything parsing the markup.

Found by a consumer app rendering `CrRelativeTime` in Qwik: the served HTML
carried `dateTime=` where `datetime=` was required. jsdom-style attribute lookups
are case-insensitive, which is why component tests could not see it.
