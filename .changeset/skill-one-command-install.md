---
"@alebianco/cr-skill": minor
---

New `@alebianco/cr-skill` — one-command install of the Control Room agent skill,
as a Claude Code plugin (`/plugin marketplace add …` + `/plugin install`, which
also registers the MCP server) and an npx installer (`npx @alebianco/cr-skill`,
`--global` / `--provider` / `--dir`) for Claude, Cursor, and opencode. The skill
bundle is generated from `skills/manifest.json` and drift-gated.
