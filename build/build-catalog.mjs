#!/usr/bin/env node
/**
 * Build the component catalog — mirrors the Doxee Design-System-Hub model
 * (a hand-authored registry → a generated, queryable catalog.json).
 *
 * Source of truth: catalog/registry.json   (prose specs: references/components.md)
 * Output:          catalog/catalog.json     (GENERATED — deterministic, no timestamps)
 *
 *   node build/build-catalog.mjs           write catalog.json
 *   node build/build-catalog.mjs --check   fail if catalog.json is stale
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");

const registry = JSON.parse(readFileSync(join(ROOT, "catalog", "registry.json"), "utf8"));
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

const entries = registry.components
  .map((c) => ({
    id: c.id,
    name: c.name,
    kind: c.kind,
    category: c.category,
    lifecycle: c.lifecycle,
    origin: registry.origin,
    description: c.description,
    spec: c.spec,
    variants: c.variants || {},
    tokens: c.tokens || [],
    keywords: c.keywords || [],
  }))
  .sort((a, b) => a.category.localeCompare(b.category) || a.id.localeCompare(b.id));

const byCategory = {};
const byLifecycle = {};
for (const e of entries) {
  byCategory[e.category] = (byCategory[e.category] || 0) + 1;
  byLifecycle[e.lifecycle] = (byLifecycle[e.lifecycle] || 0) + 1;
}

const catalog = {
  $schema: "https://schemas.control-room.dev/catalog/v1",
  $description:
    "Control Room component catalog. GENERATED from catalog/registry.json — do not edit by hand. Deterministic (no timestamps) so it can be drift-checked.",
  meta: {
    name: "Control Room",
    version: pkg.version,
    origin: registry.origin,
    count: entries.length,
    categories: byCategory,
    lifecycles: byLifecycle,
  },
  entries,
};

const content = JSON.stringify(catalog, null, 2) + "\n";
const outPath = join(ROOT, "catalog", "catalog.json");

if (CHECK) {
  const cur = existsSync(outPath) ? readFileSync(outPath, "utf8") : "";
  if (cur !== content) {
    console.error("✗ catalog/catalog.json is out of date. Run: npm run build:catalog");
    process.exit(1);
  }
  console.log(`✓ catalog.json is up to date (${entries.length} components)`);
  process.exit(0);
}

writeFileSync(outPath, content);
console.log(`wrote catalog/catalog.json  (${entries.length} components, ${content.length} bytes)`);
