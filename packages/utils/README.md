# @abianco-doxee/cr-utils

Framework-agnostic utilities for the [Control Room design system](https://github.com/abianco-doxee/control-room-design-system) —
pure, dependency-light helpers used by apps, the docs, and the tooling. (The
Mitosis components deliberately inline the small ones so each compiled target
stays self-contained; these are the runtime/host-side copies.)

```bash
npm i @abianco-doxee/cr-utils
```

## Exports

| Subpath | What |
| --- | --- |
| `./cn` | Class merge — `clsx` + `tailwind-merge`. |
| `./href` | `isExternalHref` / `externalAttrs` — safe off-site links (SSR-safe). |
| `./duration` | `humanDuration`, `relativeTime`, `refreshCadence` — clock injected, never read internally. |
| `./position` | Collision-aware anchored positioning (a Floating-UI-lite): `computePosition`, `place`, `autoPlace`. |
| `./time-scale` | `timeTicks` — timezone-aware time-axis ticks (Intl, DST-correct). |
| `./forms` | Schema-driven forms core — ArkType ⇄ JSON Schema. |
| `./theme` | The theme runtime: `validateTheme`, `themeCss`, `deriveOnColors`, `THEME_ROLES`… |

All entry points ship `.d.ts` types. No DOM dependency at import time (the one
browser-only helper, `applyTheme`, is guarded).
