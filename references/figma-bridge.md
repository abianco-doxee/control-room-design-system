# Figma Bridge — free design↔code round-trip

Control Room is **code-first**: the token layer, the component library, the
catalog, and this skill are the source of truth, and an agent can already
generate on-system UI from them with **no Figma involved**. This bridge is
*optional* — it exists for when you want the **Figma → code** direction
(designers working in Figma, or generating code from mocks) without paying for
Figma Code Connect.

It reproduces Code Connect's two jobs with free tooling:

1. **Get the design into the agent** — an open-source Figma MCP reading the REST
   API with your own token.
2. **Resolve a design node to *your* component** — a repo-local map
   (`catalog/registry.json` `figma` field), not a paid Figma feature.

## Do you even need Figma files?

| You want… | Need Figma files? |
| --- | --- |
| Agents to generate Control Room UI from the code/skill/catalog | **No.** This is the default; the bridge is irrelevant. |
| Designers to lay out screens using the system | Yes — a Figma **UI kit** (library) of the components. |
| Generate code from existing Figma mocks | Yes — the mocks, plus the `figma` map so nodes resolve to components. |

If you do build a kit, create it in this order — cheapest first:

1. **Tokens → Figma Variables (near-automatic).** Import
   `design-tokens/control-room.tokens.json` (DTCG) into Figma with **Tokens
   Studio** (free tier). This gives you the four themes as Variable
   collections with almost no manual work.
2. **Components (manual, once).** Build a Figma component per catalog entry,
   styled from those Variables. There is no good code→Figma component
   generator; the write-to-Figma MCP path is beta and limited, so treat this as
   a one-time design task that mirrors `catalog/catalog.json`.
3. **Map as you go.** Each time you create a Figma component, add its key to that
   component's `figma` field in the registry (below). The map fills incrementally
   — an empty map just means "no kit yet," and everything else still works.

## Secret handling (read this first)

The token is always the env var **`FIGMA_TOKEN`** — never pasted in chat, a
commit, or a tracked file. There are exactly two runtimes here, so provide it in
one (or both) of these places:

1. **Claude Code environment** — add `FIGMA_TOKEN` in your environment's
   variables/secrets settings; it is injected into the session and never shown in
   chat. `api.figma.com` is reachable from the environment, so the pull runs
   here directly. (Docs: https://code.claude.com/docs/en/claude-code-on-the-web)
2. **GitHub Actions** — repo **Settings → Secrets and variables → Actions → New
   repository secret**, name `FIGMA_TOKEN`. The `Figma check` workflow
   (`.github/workflows/figma.yml`, manual `workflow_dispatch`) reads it via
   `${{ secrets.FIGMA_TOKEN }}`.

A local `.env` also works if you ever run outside those, but no laptop is
required.

- Use a **read-only, short-lived** token (`file_content:read`,
  `file_dev_resources:read`) and revoke it when done.
- `.gitignore` excludes `.env*` / `*.pat` / `*.secret` (kept specific so it never
  matches the `*.tokens.json` design tokens). Keep it that way.
- The design content still reaches whatever LLM the agent uses — fine for
  company-provided models, but don't point this at a public model for a
  confidential file.

## Setup — open-source Figma MCP (Framelink)

`.mcp.json` (repo root) registers the community server, reading the token from
env so it never appears in config:

```jsonc
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--stdio"],
      "env": { "FIGMA_API_KEY": "${FIGMA_TOKEN}" }
    }
  }
}
```

- `GLips/Figma-Context-MCP` ("Framelink") reads files via the REST API with your
  personal token — works on any plan/seat, including private files and drafts
  **your account can see**.
- Tools: `get_figma_data` (structure/styling/layout, preserves component
  nesting) and `download_figma_images` (assets).
- **Network:** the pull needs egress to `api.figma.com`. Some sandboxes block it
  — run the pull where Figma is reachable (your machine, or a suitably
  configured environment).

### Verify the token (no secret in chat)

Provide `FIGMA_TOKEN` via a git-ignored `.env` (copy `.env.example`), an exported
shell var, or your Claude Code environment settings — then:

```bash
npm run figma:pull                 # validates the token via /v1/me (never prints it)
npm run figma:pull -- <fileKey>    # also lists a file's top-level nodes
```

The `<fileKey>` is the segment in a file URL: `figma.com/file/<fileKey>/…`. A
read-only token can read any file your account can open, including private
drafts.

## The `figma` map (in `catalog/registry.json`)

Optional per component. Absent = not yet mapped. Shape:

```jsonc
{
  "id": "button",
  // …existing fields…
  "figma": {
    "fileKey": "abc123…",          // the Figma file the component lives in
    "componentKey": "def456…",     // Figma component (main) key or node id
    "props": {                      // Figma prop/variant name → code variant
      "Kind": "kind",              //   Figma "Kind" variant → registry variants.kind
      "State": "state"
    }
  }
}
```

`npm run build:catalog` passes `figma` through into `catalog/catalog.json` when
present, so the agent gets the mapping alongside the component's tokens and
variants.

## The agent workflow (Figma node → Control Room component)

When asked to build from a Figma design:

1. **Pull** the node with `get_figma_data` (Framelink MCP).
2. **Resolve** it to a component: match the node's Figma `componentKey`/name
   against `catalog/catalog.json` `figma.componentKey`. If no map exists, fall
   back to matching by name/`keywords`.
3. **Emit** using the copy-ready markup in `references/components.md` for that
   component, mapping Figma variant values through `figma.props` to the
   registry's `variants`.
4. **Enforce the laws.** The generated output must still pass
   `checklists/component-checklist.md` — tokens only, radius 0, hard shadow, two
   type registers, color = state. The design is an input; the seven laws win.
5. **Tokens.** Prefer resolving colors/spacing to Control Room CSS variables
   (via `dist/tokens.flat.json`), not the raw hexes Figma reports.

**MUST** ground output in the catalog + laws, not in the raw Figma CSS dump.
**NEVER** commit anything containing the token, and **NEVER** hand a confidential
file to a non-approved model.
