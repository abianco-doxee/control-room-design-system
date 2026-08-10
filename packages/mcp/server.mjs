#!/usr/bin/env node
/**
 * Control Room design-system MCP server (stdio).
 *
 * Exposes the design system to a coding agent as Model Context Protocol tools +
 * resources, so it can look up components, tokens, the theme contract, and the
 * design rules while building UI — instead of guessing. Data is bundled under
 * ./data (see build/build-mcp-data.mjs), so `npx @alebianco/cr-mcp` is
 * self-contained.
 *
 * Register in an MCP client, e.g. Claude Code:
 *   { "mcpServers": { "control-room": { "command": "npx", "args": ["-y", "@alebianco/cr-mcp"] } } }
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "data");
const readJson = (p) => JSON.parse(readFileSync(join(DATA, p), "utf8"));

const catalog = readJson("catalog.json");
const contract = readJson("theme-contract.json");
const { docs: DOC_SLUGS } = readJson("docs.json");
const entries = catalog.entries;
const byId = new Map(entries.map((e) => [e.id, e]));

// Human title per doc slug (kept in step with the docs sidebar).
const DOC_TITLES = {
  "design-language": "Design Language — the nine laws",
  tokens: "Tokens",
  theming: "Theming & Branding",
  responsive: "Responsive Architecture",
  tailwind: "Tailwind-first",
  motion: "Motion",
  accessibility: "Accessibility",
  components: "Component Library",
  "styling-contract": "Styling Contract (pt / dt / unstyled)",
  forms: "Forms — validation",
  frameworks: "Framework Components (Mitosis)",
  "seeded-cat": "Seeded Pixel-Cat",
  "seeded-sigil": "Seeded Pixel-Sigil",
  decoration: "Decoration — ASCII / Pixel",
};

const text = (value) => ({
  content: [
    { type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) },
  ],
});

const server = new McpServer({ name: "control-room", version: catalog.meta?.version || "1.0.0" });

/* ── components ────────────────────────────────────────────────────────── */
server.registerTool(
  "list_components",
  {
    title: "List components",
    description:
      "List Control Room components (id · name · category · lifecycle · description). " +
      "Optionally filter by category or lifecycle. Use get_component for the full spec.",
    inputSchema: {
      category: z
        .string()
        .optional()
        .describe("category filter, e.g. action, forms, overlay, chart, layout, navigation, state"),
      lifecycle: z.enum(["stable", "experimental"]).optional().describe("lifecycle filter"),
    },
  },
  async ({ category, lifecycle }) => {
    let list = entries;
    if (category) list = list.filter((e) => e.category === category);
    if (lifecycle) list = list.filter((e) => e.lifecycle === lifecycle);
    return text({
      count: list.length,
      categories: catalog.meta?.categories,
      components: list.map((e) => ({
        id: e.id,
        name: e.name,
        category: e.category,
        lifecycle: e.lifecycle,
        description: e.description,
      })),
    });
  }
);

server.registerTool(
  "search_components",
  {
    title: "Search components",
    description:
      "Free-text search across component name, description, keywords and category. " +
      "Returns ranked matches with their id and description.",
    inputSchema: {
      query: z.string().describe("what you're looking for, e.g. 'date picker', 'toast', 'chart'"),
    },
  },
  async ({ query }) => {
    const q = query.toLowerCase().trim();
    const terms = q.split(/\s+/).filter(Boolean);
    const scored = entries
      .map((e) => {
        const name = e.name.toLowerCase();
        const kw = (e.keywords || []).map((k) => k.toLowerCase());
        const hay = [name, e.id, e.description, e.category, ...kw].join(" ").toLowerCase();
        let score = 0;
        if (name === q || e.id === q) score += 100;
        if (name.includes(q)) score += 20;
        // per-term matching so multi-word queries ("date picker") still hit
        for (const t of terms) {
          if (name.includes(t)) score += 8;
          if (kw.some((k) => k.includes(t))) score += 5;
          if (hay.includes(t)) score += 2;
        }
        return { e, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 25);
    return text({
      query,
      matches: scored.map(({ e }) => ({
        id: e.id,
        name: e.name,
        category: e.category,
        description: e.description,
      })),
    });
  }
);

server.registerTool(
  "get_component",
  {
    title: "Get component",
    description:
      "Full catalog entry for one component: variants, the design tokens it consumes, keywords, " +
      "and the reference doc + anchor for its spec and copy-ready markup.",
    inputSchema: {
      id: z
        .string()
        .describe("component id, e.g. 'button' (see list_components / search_components)"),
    },
  },
  async ({ id }) => {
    const e = byId.get(id);
    if (!e) {
      const near = entries
        .filter((c) => c.id.includes(id) || c.name.toLowerCase().includes(id.toLowerCase()))
        .map((c) => c.id);
      return text(
        `No component "${id}".${near.length ? ` Did you mean: ${near.join(", ")}?` : " Use list_components."}`
      );
    }
    return text({
      ...e,
      spec_doc: "components",
      spec_hint: `use get_reference(doc:"components") and jump to #${e.id}`,
    });
  }
);

/* ── tokens / theme ────────────────────────────────────────────────────── */
server.registerTool(
  "list_theme_roles",
  {
    title: "List theme roles",
    description:
      "The theme contract: every semantic role (CSS custom property) a valid theme or brand must define, " +
      "with its group and meaning. Consume tokens via these roles — never hardcode a colour.",
    inputSchema: {},
  },
  async () =>
    text({
      defaultTheme: contract.defaultTheme,
      selector: contract.selector,
      roles: contract.roles,
      chassisOverridable: contract.chassisOverridable,
      typeOverridable: contract.typeOverridable,
    })
);

/* ── reference docs ────────────────────────────────────────────────────── */
server.registerTool(
  "list_references",
  {
    title: "List reference docs",
    description: "The reference documents available via get_reference (slug + title).",
    inputSchema: {},
  },
  async () => text({ docs: DOC_SLUGS.map((slug) => ({ slug, title: DOC_TITLES[slug] || slug })) })
);

server.registerTool(
  "get_reference",
  {
    title: "Get reference doc",
    description:
      "Return the full Markdown of a reference doc — the authoritative rules and copy-ready examples. " +
      "Start with 'design-language' (the nine laws) and 'styling-contract'.",
    inputSchema: {
      doc: z.enum(DOC_SLUGS).describe("doc slug from list_references, e.g. 'design-language'"),
    },
  },
  async ({ doc }) => {
    try {
      return text(readFileSync(join(DATA, "references", `${doc}.md`), "utf8"));
    } catch {
      return text(`No reference doc "${doc}". Use list_references.`);
    }
  }
);

/* ── resources ─────────────────────────────────────────────────────────── */
server.registerResource(
  "catalog",
  "control-room://catalog",
  {
    title: "Component catalog",
    description: "Every component with variants, tokens, keywords.",
    mimeType: "application/json",
  },
  async (uri) => ({
    contents: [
      { uri: uri.href, mimeType: "application/json", text: JSON.stringify(catalog, null, 2) },
    ],
  })
);
server.registerResource(
  "theme-contract",
  "control-room://theme-contract",
  {
    title: "Theme contract",
    description: "The required theme roles.",
    mimeType: "application/json",
  },
  async (uri) => ({
    contents: [
      { uri: uri.href, mimeType: "application/json", text: JSON.stringify(contract, null, 2) },
    ],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(
  `control-room MCP server ready — ${entries.length} components, ${contract.roles.length} theme roles, ${DOC_SLUGS.length} docs`
);
