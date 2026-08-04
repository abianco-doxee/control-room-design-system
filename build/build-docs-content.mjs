#!/usr/bin/env node
/**
 * Generate the Starlight docs content from the single source of truth.
 *
 * The reference Markdown at the repo root (SKILL.md, references/, templates/,
 * checklists/, CONTRIBUTING, CHANGELOG) stays authoritative; this copies it into
 * src/content/docs/** with Starlight frontmatter, rewrites intra-doc links to
 * site routes, and renders a catalog page from catalog/catalog.json.
 *
 * Generated dirs (guide/, reference/, build/) are git-ignored; index.mdx is not.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = join(ROOT, "src", "content", "docs");
const REPO = "https://github.com/alebianco/control-room-design-system/blob/main";

// source file → { section, slug, title }
const PAGES = [
  ["SKILL.md", "guide", "skill", "What is Control Room"],
  ["CONTRIBUTING.md", "guide", "contributing", "Contributing"],
  ["CHANGELOG.md", "guide", "changelog", "Changelog"],
  ["references/design-language.md", "reference", "design-language", "Design Language — the Nine Laws"],
  ["references/tokens.md", "reference", "tokens", "Tokens"],
  ["references/tailwind.md", "reference", "tailwind", "Tailwind-first"],
  ["references/components.md", "reference", "components", "Component Library"],
  ["references/motion.md", "reference", "motion", "Motion"],
  ["references/accessibility.md", "reference", "accessibility", "Accessibility"],
  ["references/seeded-cat.md", "reference", "seeded-cat", "Seeded Pixel-Cat"],
  ["references/seeded-sigil.md", "reference", "seeded-sigil", "Seeded Pixel-Sigil"],
  ["references/decoration.md", "reference", "decoration", "Decoration — ASCII / Pixel"],
  ["references/frameworks.md", "reference", "frameworks", "Framework Components (Mitosis)"],
  ["templates/component.md", "build", "component-template", "Component Template"],
  ["checklists/component-checklist.md", "build", "component-checklist", "Ship Checklist"],
];

// basename (without .md) → { section, slug } for link rewriting
const BY_BASE = {};
for (const [src, section, slug] of PAGES) BY_BASE[basename(src, ".md")] = { section, slug };
BY_BASE["catalog"] = { section: "reference", slug: "catalog" };

const esc = (s) => s.replace(/"/g, '\\"');

function stripFrontmatter(txt) {
  const m = txt.match(/^---\n[\s\S]*?\n---\n?/);
  return m ? txt.slice(m[0].length) : txt;
}
function stripLeadingH1(txt) {
  return txt.replace(/^\s*#\s+.*\n+/, "");
}

// rewrite markdown links: doc→site route (relative, base-independent); repo asset→GitHub
function rewriteLinks(txt) {
  return txt.replace(/\]\(([^)]+)\)/g, (whole, target) => {
    if (/^(https?:|mailto:|#)/.test(target)) return whole; // external / anchor-only
    const [rawPath, anchor] = target.split("#");
    const clean = rawPath.replace(/^(\.\/|\.\.\/)+/, "");
    if (clean.endsWith(".md")) {
      const hit = BY_BASE[basename(clean, ".md")];
      if (hit) return `](../${hit.section}/${hit.slug}/${anchor ? "#" + anchor : ""})`;
    }
    // repo-relative asset (tokens/, dist/, design-tokens/, build/, scripts/, catalog/)
    if (/^(tokens|dist|design-tokens|build|scripts|catalog|skills|public)\//.test(clean)) {
      return `](${REPO}/${clean})`;
    }
    return whole;
  });
}

function pageFor(src, title) {
  let body = readFileSync(join(ROOT, src), "utf8");
  body = stripLeadingH1(stripFrontmatter(body));
  body = rewriteLinks(body);
  return `---\ntitle: "${esc(title)}"\n---\n\n${body}`;
}

function catalogPage() {
  const cat = JSON.parse(readFileSync(join(ROOT, "catalog", "catalog.json"), "utf8"));
  const byCat = {};
  for (const e of cat.entries) (byCat[e.category] ??= []).push(e);
  const specLink = (e) => {
    const hit = BY_BASE[basename(e.spec.split("#")[0], ".md")];
    const anchor = e.spec.includes("#") ? "#" + e.spec.split("#")[1] : "";
    return hit ? `../${hit.section}/${hit.slug}/${anchor}` : `${REPO}/${e.spec}`;
  };
  let md = `---\ntitle: "Component Catalog"\n---\n\n`;
  md += `Generated from \`catalog/catalog.json\` — **${cat.meta.count}** components across ${Object.keys(byCat).length} categories. `;
  md += `Prose specs live in the [Component Library](../reference/components/). This page is the queryable index (also emitted as machine-readable [\`catalog.json\`](${REPO}/catalog/catalog.json)).\n\n`;
  for (const category of Object.keys(byCat).sort()) {
    md += `## ${category}\n\n| Component | Kind | Lifecycle | What it is |\n| --- | --- | --- | --- |\n`;
    for (const e of byCat[category]) {
      md += `| [${e.name}](${specLink(e)}) | ${e.kind} | ${e.lifecycle} | ${e.description} |\n`;
    }
    md += `\n`;
  }
  return md;
}

// clean generated sections (keep index.mdx)
for (const dir of ["guide", "reference", "build"]) rmSync(join(DOCS, dir), { recursive: true, force: true });

let n = 0;
for (const [src, section, slug, title] of PAGES) {
  const dest = join(DOCS, section, `${slug}.md`);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, pageFor(src, title));
  n++;
}
// catalog page
const catDest = join(DOCS, "reference", "catalog.md");
mkdirSync(dirname(catDest), { recursive: true });
writeFileSync(catDest, catalogPage());
n++;

console.log(`generated ${n} Starlight pages under src/content/docs/{guide,reference,build}`);
