# @control-room/mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that exposes the
**Control Room** design system to a coding agent — so it can look up components,
tokens, the theme contract, and the design rules while building UI, instead of
guessing.

It's self-contained: the catalog, theme contract, and reference docs are bundled
under `data/`, so `npx @control-room/mcp` runs with no repo checkout.

## Run it

```jsonc
// Claude Code / any MCP client — mcp config
{
  "mcpServers": {
    "control-room": { "command": "npx", "args": ["-y", "@control-room/mcp"] }
  }
}
```

Or directly: `npx @control-room/mcp` (stdio).

## Tools

| Tool | What it answers |
| --- | --- |
| `list_components` | Every component (id · name · category · lifecycle · description); filter by `category` / `lifecycle`. |
| `search_components` | Free-text search over name, description, keywords, category. |
| `get_component` | Full entry for one `id`: variants, the tokens it consumes, keywords, spec anchor. |
| `list_theme_roles` | The theme contract — every semantic role a valid theme/brand must define. |
| `list_references` | The reference docs available to `get_reference`. |
| `get_reference` | Full Markdown of a reference doc (rules + copy-ready examples). Start with `design-language`. |

## Resources

- `control-room://catalog` — the full component catalog (JSON).
- `control-room://theme-contract` — the required theme roles (JSON).

## Typical agent flow

1. `get_reference(doc: "design-language")` — load the nine laws before writing any UI.
2. `search_components(query: "…")` → `get_component(id: "…")` — find the right component and its variants/tokens.
3. `list_theme_roles()` — style against semantic roles, never hardcoded colours.
4. `get_reference(doc: "styling-contract")` — use the `pt` / `dt` / `unstyled` hooks correctly.

Regenerate the bundled data after changing the catalog, tokens, or docs:
`npm run build -w @control-room/mcp` (guarded by `npm run verify -w @control-room/mcp`).
