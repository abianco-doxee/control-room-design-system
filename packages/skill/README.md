# @control-room/skill

One-command install of the [Control Room design system](https://github.com/abianco-doxee/control-room-design-system)
as an **agent skill** — plus the Claude Code **plugin** bundle. Both carry the same
skill content (SKILL.md, the reference docs, and the machine-readable token /
catalog artifacts) and wire up the `@control-room/mcp` server.

## Claude Code — plugin (recommended)

```
/plugin marketplace add abianco-doxee/control-room-design-system
/plugin install control-room-design-system@control-room
```

Installs the skill and registers the `control-room` MCP server in one step.

## Any project — npx installer

```bash
npx @control-room/skill              # → ./.claude/skills/control-room-design-system (this project)
npx @control-room/skill --global     # → ~/.claude/skills/control-room-design-system (all projects)
npx @control-room/skill --provider=cursor    # or opencode
npx @control-room/skill --dir=path/to/skills
```

Then add the MCP server to your agent config for live component/token lookup:

```jsonc
{ "mcpServers": { "control-room": { "command": "npx", "args": ["-y", "@control-room/mcp"] } } }
```

## Repo contributors

Working inside the monorepo, `npm run skills:sync` installs the skill into the
repo's own `.claude` / `.cursor` / `.opencode` for local development. The bundle
this package ships is generated from the same `skills/manifest.json` and
drift-gated (`npm run verify -w @control-room/skill`).
