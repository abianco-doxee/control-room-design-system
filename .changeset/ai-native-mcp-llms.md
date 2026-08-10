---
"@abianco-doxee/cr-mcp": minor
"@abianco-doxee/cr-components": minor
---

AI-native surfaces for agentic development. New `@abianco-doxee/cr-mcp` — a Model
Context Protocol server (`npx @abianco-doxee/cr-mcp`) exposing the catalog, theme
contract, and reference docs as tools/resources. The docs site now emits
`llms.txt` + `llms-full.txt` (llmstxt.org) and serves `catalog.json` /
`theme-contract.json` at the site root. `CrIcon` gains a raw-path escape hatch
(`path`/`filled`) so any Iconify family or hand-drawn glyph can be injected
per-use without a rebuild.
