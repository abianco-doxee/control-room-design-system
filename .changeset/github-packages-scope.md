---
"@abianco-doxee/cr-components": major
"@abianco-doxee/cr-tokens": major
"@abianco-doxee/cr-styles": major
"@abianco-doxee/cr-icons": major
"@abianco-doxee/cr-utils": major
"@abianco-doxee/cr-mcp": major
"@abianco-doxee/cr-skill": major
---

First release — `1.0.0`, published privately to GitHub Packages under the
`@abianco-doxee` scope.

Nothing was ever published under the earlier `@control-room` scope, so this is the initial
public surface rather than a migration. GitHub Packages ties an npm scope to a GitHub
org/user of the same name, and `@control-room` had no matching org, so it could never have
published from this repository; `@abianco-doxee` matches the owner.

The product is **Control Room**. The `Cr` / `cr-` / `--cr-` code prefixes, the token values,
the component APIs, and the visual design are unchanged from the pre-release repo — only the
package coordinates differ:

| Pre-release name | Published as |
| --- | --- |
| `@control-room/tokens` | `@abianco-doxee/cr-tokens` |
| `@control-room/styles` | `@abianco-doxee/cr-styles` |
| `@control-room/components` | `@abianco-doxee/cr-components` |
| `@control-room/icons` | `@abianco-doxee/cr-icons` |
| `@control-room/utils` | `@abianco-doxee/cr-utils` |
| `@control-room/mcp` | `@abianco-doxee/cr-mcp` |
| `@control-room/skill` | `@abianco-doxee/cr-skill` |

Packages publish with `access: "restricted"` — private, visible only to accounts granted
access. Installing needs a GitHub token with `read:packages`; see
[Getting Started](../references/getting-started.md).
