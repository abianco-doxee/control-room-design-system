---
"@abianco-doxee/cr-components": major
"@abianco-doxee/cr-tokens": major
"@abianco-doxee/cr-styles": major
"@abianco-doxee/cr-icons": major
"@abianco-doxee/cr-utils": major
"@abianco-doxee/cr-mcp": major
"@abianco-doxee/cr-skill": major
---

Move the npm scope to `@abianco-doxee` and publish privately to GitHub Packages.

**This is a packaging change only.** The product is still **Control Room**, and the `Cr` /
`cr-` / `--cr-` code prefixes, every token value, component API, and all visual design are
unchanged. Only the package coordinates moved.

| Before | After |
| --- | --- |
| `@control-room/tokens` | `@abianco-doxee/cr-tokens` |
| `@control-room/styles` | `@abianco-doxee/cr-styles` |
| `@control-room/components` | `@abianco-doxee/cr-components` |
| `@control-room/icons` | `@abianco-doxee/cr-icons` |
| `@control-room/utils` | `@abianco-doxee/cr-utils` |
| `@control-room/mcp` | `@abianco-doxee/cr-mcp` |
| `@control-room/skill` | `@abianco-doxee/cr-skill` |

Update imports and `dependencies` entries to the new names. Class names, CSS custom
properties, and component names need no changes.

**Why the scope moved.** GitHub Packages ties an npm scope to a GitHub org/user of the same
name, so `@control-room/*` could never publish from a repository owned by the user
`abianco-doxee`. Using `@abianco-doxee` makes the scope match the owner, which unblocks
releasing without creating an org. Packages publish with `access: "restricted"` — private,
visible only to accounts granted access.
