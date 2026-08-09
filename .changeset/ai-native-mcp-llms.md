---
"@control-room/mcp": minor
"@control-room/components": minor
---

AI-native surfaces for agentic development. New `@control-room/mcp` — a Model
Context Protocol server (`npx @control-room/mcp`) exposing the catalog, theme
contract, and reference docs as tools/resources. The docs site now emits
`llms.txt` + `llms-full.txt` (llmstxt.org) and serves `catalog.json` /
`theme-contract.json` at the site root. `CrIcon` gains a raw-path escape hatch
(`path`/`filled`) so any Iconify family or hand-drawn glyph can be injected
per-use without a rebuild.
