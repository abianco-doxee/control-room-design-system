---
"@control-room/design-system": minor
---

Add per-framework package export entries. Apps can now
`import { CrSwitch, CrModal } from "@control-room/design-system/react"` (and
`/vue`, `/svelte`, `/angular`, `/solid`) instead of reaching into
`.../frameworks/<t>/components/<Name>`. A generated barrel per target
(`build/build-barrels.mjs`, chained into `build:components`) re-exports every
compiled component's default (Angular also re-exports each `<Name>Module`); the
deep single-component path still resolves via `./frameworks/*`. Barrels ship as
source under the git-ignored `dist/frameworks/**` and regenerate on every compile.
