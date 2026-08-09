#!/usr/bin/env node
/**
 * Bundle the data the MCP server serves into packages/mcp/data/ so `npx
 * @control-room/mcp` is self-contained (no repo checkout needed):
 *
 *   data/catalog.json          the component catalog (from catalog/catalog.json)
 *   data/theme-contract.json   the required theme roles (from @control-room/tokens)
 *   data/references/*.md       the reference docs the server exposes
 *
 * The copies are committed and guarded by `--check` (verify:mcp), so drift from
 * the sources fails CI. Regenerate: pnpm --filter @control-room/mcp run build.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = join(ROOT, "..", "..");
const DATA = join(ROOT, "data");
const CHECK = process.argv.includes("--check");

// reference docs the server serves (slug order = reading order). Internal notes
// (e.g. monorepo-migration) are intentionally excluded.
export const DOCS = [
  "design-language",
  "tokens",
  "theming",
  "responsive",
  "tailwind",
  "motion",
  "accessibility",
  "components",
  "styling-contract",
  "forms",
  "frameworks",
  "seeded-cat",
  "seeded-sigil",
  "decoration",
];

const files = [
  [join(REPO, "catalog", "catalog.json"), join(DATA, "catalog.json")],
  [
    join(REPO, "packages", "tokens", "dist", "theme-contract.json"),
    join(DATA, "theme-contract.json"),
  ],
  ...DOCS.map((s) => [join(REPO, "references", `${s}.md`), join(DATA, "references", `${s}.md`)]),
];

const read = (p) => {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return null;
  }
};

if (CHECK) {
  let stale = false;
  for (const [src, dst] of files) {
    if (read(src) !== read(dst)) {
      stale = true;
      console.error(`✗ ${dst.replace(`${ROOT}/`, "")} is out of date`);
    }
  }
  // also write the manifest of doc slugs and diff it
  const manifest = JSON.stringify({ docs: DOCS }, null, 2) + "\n";
  if (read(join(DATA, "docs.json")) !== manifest) {
    stale = true;
    console.error("✗ data/docs.json is out of date");
  }
  if (stale) {
    console.error("\nRun: pnpm --filter @control-room/mcp run build");
    process.exit(1);
  }
  console.log("✓ MCP data is up to date");
  process.exit(0);
}

mkdirSync(join(DATA, "references"), { recursive: true });
for (const [src, dst] of files) copyFileSync(src, dst);
writeFileSync(join(DATA, "docs.json"), JSON.stringify({ docs: DOCS }, null, 2) + "\n");
console.log(`bundled ${files.length} files + docs.json into packages/mcp/data/`);
