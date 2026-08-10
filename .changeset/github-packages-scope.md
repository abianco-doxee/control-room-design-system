---
"@alebianco/cr-components": major
"@alebianco/cr-tokens": major
"@alebianco/cr-styles": major
"@alebianco/cr-icons": major
"@alebianco/cr-utils": major
"@alebianco/cr-mcp": major
"@alebianco/cr-skill": major
---

First release — `1.0.0`, published privately to GitHub Packages under the
`@alebianco` scope.

Nothing was ever published under the earlier `@control-room` scope, so this is the initial
public surface rather than a migration. GitHub Packages ties an npm scope to a GitHub
org/user of the same name, and `@control-room` had no matching org, so it could never have
published from this repository; `@alebianco` matches the owner.

The product is **Control Room**. The `Cr` / `cr-` / `--cr-` code prefixes, the token values,
the component APIs, and the visual design are unchanged from the pre-release repo — only the
package coordinates differ:

| Pre-release name | Published as |
| --- | --- |
| `@control-room/tokens` | `@alebianco/cr-tokens` |
| `@control-room/styles` | `@alebianco/cr-styles` |
| `@control-room/components` | `@alebianco/cr-components` |
| `@control-room/icons` | `@alebianco/cr-icons` |
| `@control-room/utils` | `@alebianco/cr-utils` |
| `@control-room/mcp` | `@alebianco/cr-mcp` |
| `@control-room/skill` | `@alebianco/cr-skill` |

Packages publish with `access: "restricted"` — private, visible only to accounts granted
access. Installing needs a GitHub token with `read:packages`; see
[Getting Started](../references/getting-started.md).
