---
"@alebianco/cr-components": major
"@alebianco/cr-tokens": major
"@alebianco/cr-styles": major
"@alebianco/cr-icons": major
"@alebianco/cr-utils": major
"@alebianco/cr-mcp": major
"@alebianco/cr-skill": major
---

Move the npm scope to `@alebianco` and publish privately to GitHub Packages.

**This is a packaging change only.** The product is still **Control Room**, and the `Cr` /
`cr-` / `--cr-` code prefixes, every token value, component API, and all visual design are
unchanged. Only the package coordinates moved.

| Before | After |
| --- | --- |
| `@control-room/tokens` | `@alebianco/cr-tokens` |
| `@control-room/styles` | `@alebianco/cr-styles` |
| `@control-room/components` | `@alebianco/cr-components` |
| `@control-room/icons` | `@alebianco/cr-icons` |
| `@control-room/utils` | `@alebianco/cr-utils` |
| `@control-room/mcp` | `@alebianco/cr-mcp` |
| `@control-room/skill` | `@alebianco/cr-skill` |

Update imports and `dependencies` entries to the new names. Class names, CSS custom
properties, and component names need no changes.

**Why the scope moved.** GitHub Packages ties an npm scope to a GitHub org/user of the same
name, so `@control-room/*` could never publish from a repository owned by the user
`alebianco`. Using `@alebianco` makes the scope match the owner, which unblocks
releasing without creating an org. Packages publish with `access: "restricted"` — private,
visible only to accounts granted access.
