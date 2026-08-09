#!/usr/bin/env node
/**
 * Generate the AI-native entry points for the docs site (llmstxt.org convention):
 *
 *   public/llms.txt        concise, link-first index an agent reads FIRST —
 *                          summary, install, the nine laws, every reference doc,
 *                          all catalogued components (grouped, described, linked),
 *                          and the machine-readable surfaces.
 *   public/llms-full.txt   the same index followed by the full text of every
 *                          reference doc — one file an agent can ingest whole.
 *   public/catalog.json        copy of the component catalog, fetchable at a stable URL.
 *   public/theme-contract.json copy of the theme contract (required roles).
 *
 * These deploy at the site root (e.g. /control-room-design-system/llms.txt), so a
 * frontier coding agent can discover the whole system from one URL. Regenerate:
 * npm run build:llms  (runs in the docs build chain, after build:catalog + tokens).
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = join(ROOT, "..", "..");
const PUBLIC = join(ROOT, "public");
const CHECK = process.argv.includes("--check");

const SITE = process.env.SITE_URL || "https://abianco-doxee.github.io";
const BASE = process.env.BASE_PATH || "/control-room-design-system/";
const site = (p) => `${SITE}${BASE}${p.replace(/^\//, "")}`;
const REPO_URL = "https://github.com/abianco-doxee/control-room-design-system";
const blob = (p) => `${REPO_URL}/blob/main/${p}`;

// Reference docs → site routes (mirrors build-docs-content.mjs PAGES).
const FOUNDATIONS = [
  [
    "design-language",
    "Design Language — the nine laws",
    "the why + do/don't behind every decision",
  ],
  ["tokens", "Tokens", "the token layer, OKLCH generation, and how to consume it"],
  ["theming", "Theming & Branding", "author a brand without forking; the four built-in themes"],
  ["responsive", "Responsive Architecture", "fluid type + per-container density"],
  ["tailwind", "Tailwind-first", "token-driven utilities (Tailwind v4 @theme)"],
  ["motion", "Motion", "motion tiers, glitch/CRT vocabulary, reduced-motion"],
  ["accessibility", "Accessibility", "the WCAG 2.1 AA contract for the aesthetic"],
];
const BUILDING = [
  ["components", "Component Library", "spec + copy-ready markup for every component"],
  ["styling-contract", "Styling Contract", "the pt / dt / unstyled per-part styling hooks"],
  ["forms", "Forms", "schema-driven validation (ArkType ⇄ JSON Schema)"],
  ["frameworks", "Framework Components", "Mitosis compile-to-six + per-target packages"],
];
const OPTIONAL = [
  ["seeded-cat", "Seeded Pixel-Cat", "the identity+state pixel-cat generator"],
  ["seeded-sigil", "Seeded Pixel-Sigil", "the seeded cyber-sigil glyph"],
  ["decoration", "Decoration — ASCII / Pixel", "the decorative-only contract for dead space"],
];
const link = ([slug, title, note]) => `- [${title}](${site(`reference/${slug}/`)}): ${note}`;

const catalog = JSON.parse(readFileSync(join(REPO, "catalog", "catalog.json"), "utf8"));
const SUMMARY =
  "A neon-noir, neobrutalist design system for dense operational dashboards — " +
  "authored once as Mitosis components and compiled to React, Vue, Svelte, Angular, " +
  "Solid and Qwik, on a four-theme OKLCH token layer with a documented accessibility contract.";

/* Components, grouped by catalog category, each linked to its spec + browser anchor. */
function componentsSection() {
  const byCat = {};
  for (const e of catalog.entries) (byCat[e.category] ||= []).push(e);
  const cats = Object.keys(byCat).sort();
  const out = [];
  for (const cat of cats) {
    out.push(`\n### ${cat[0].toUpperCase() + cat.slice(1)}`);
    for (const e of byCat[cat].sort((a, b) => a.name.localeCompare(b.name))) {
      out.push(`- [${e.name}](${site(`components.html#c-${e.id}`)}): ${e.description}`);
    }
  }
  return out.join("\n");
}

function llmsIndex() {
  return `# Control Room Design System

> ${SUMMARY}

Control Room is both a published component library (\`@control-room/*\` on npm) and a
Claude Code skill. Install one framework build plus the token + style layers:

\`\`\`
npm i @control-room/components @control-room/tokens @control-room/styles
\`\`\`

\`\`\`
import { CrButton } from "@control-room/components/react";  // or /vue /svelte /angular /solid /qwik
import "@control-room/tokens/css";                          // token layer, all four themes
import "@control-room/styles/components";                   // component styles (or per-part parts/*)
\`\`\`

Set the theme on the root: \`<html data-theme="dark|light|extreme|phosphor">\`.

## Foundations
${FOUNDATIONS.map(link).join("\n")}

## Building
${BUILDING.map(link).join("\n")}

## Components
Every component is catalogued with its variants, design tokens, and keywords in
[catalog.json](${site("catalog.json")}) (${catalog.entries.length} entries). Rendered and
exercised in all four themes in the [Component Browser](${site("components.html")}); see them
live in the [Gallery](${site("gallery.html")}).
${componentsSection()}

## Machine-readable
- [catalog.json](${site("catalog.json")}): every component — id, category, lifecycle, variants, tokens, keywords, spec anchor
- [theme-contract.json](${site("theme-contract.json")}): the required theme roles a valid theme/brand must define
- [tokens.json](${blob("packages/tokens/tokens/tokens.json")}): the token source of truth (all themes)
- [llms-full.txt](${site("llms-full.txt")}): this index followed by the full text of every reference doc
- MCP server: \`npx @control-room/mcp\` — exposes the catalog, tokens, theme contract and design laws as tools an agent can query ([docs](${blob("packages/mcp/README.md")}))

## Optional
${OPTIONAL.map(link).join("\n")}
`;
}

/* The full-text bundle: the index, then every reference doc inlined. */
function stripFrontmatter(t) {
  const m = t.match(/^---\n[\s\S]*?\n---\n?/);
  return m ? t.slice(m[0].length) : t;
}
function llmsFull() {
  const docs = [...FOUNDATIONS, ...BUILDING, ...OPTIONAL];
  const parts = [
    llmsIndex(),
    "\n\n---\n\n# Full reference\n",
    "The complete text of every reference document follows.\n",
  ];
  for (const [slug, title] of docs) {
    const md = readFileSync(join(REPO, "references", `${slug}.md`), "utf8");
    parts.push(`\n\n<!-- ==================== ${title} ==================== -->\n`);
    parts.push(stripFrontmatter(md).replace(/^\s*#\s+.*\n/, `# ${title}\n`));
  }
  return parts.join("");
}

const outputs = [
  ["llms.txt", llmsIndex()],
  ["llms-full.txt", llmsFull()],
];
const copies = [
  [join(REPO, "catalog", "catalog.json"), "catalog.json"],
  [join(REPO, "packages", "tokens", "dist", "theme-contract.json"), "theme-contract.json"],
];

if (CHECK) {
  let stale = false;
  for (const [name, content] of outputs) {
    const cur = safeRead(join(PUBLIC, name));
    if (cur !== content) {
      stale = true;
      console.error(`✗ public/${name} is out of date`);
    }
  }
  for (const [src, name] of copies) {
    if (safeRead(join(PUBLIC, name)) !== safeRead(src)) {
      stale = true;
      console.error(`✗ public/${name} is out of date`);
    }
  }
  if (stale) {
    console.error("\nRun: npm run build:llms");
    process.exit(1);
  }
  console.log("✓ llms.txt + machine-readable surfaces are up to date");
  process.exit(0);
}

mkdirSync(PUBLIC, { recursive: true });
for (const [name, content] of outputs) {
  writeFileSync(join(PUBLIC, name), content);
  console.log(`wrote public/${name}  (${content.length} bytes)`);
}
for (const [src, name] of copies) {
  copyFileSync(src, join(PUBLIC, name));
  console.log(`copied public/${name}`);
}

function safeRead(p) {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return null;
  }
}
