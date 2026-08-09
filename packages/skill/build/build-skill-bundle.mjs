#!/usr/bin/env node
/**
 * Assemble the distributable skill bundle for @control-room/skill.
 *
 * The skill's contents are defined once in skills/manifest.json (include[]). This
 * copies that set into packages/skill/skills/<installAs>/ — the committed bundle
 * that serves BOTH distribution paths:
 *   • the Claude Code plugin (.claude-plugin/plugin.json + this skills/ dir), and
 *   • the npx installer (bin/install.mjs copies this dir into a target).
 *
 * The bundle is committed and drift-gated by `--check` (verify:skill), so it can
 * never fall out of step with the source. Regenerate:
 *   pnpm --filter @control-room/skill run build
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = join(ROOT, "..", "..");
const CHECK = process.argv.includes("--check");

const manifest = JSON.parse(readFileSync(join(REPO, "skills", "manifest.json"), "utf8"));
const skill = manifest.skills[0];
const DEST = join(ROOT, "skills", skill.installAs);

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

// the flat set of files the bundle should contain: { relInsideBundle: absSource }
const want = {};
for (const inc of skill.include) {
  const abs = join(REPO, inc);
  if (!existsSync(abs)) {
    console.error(`✗ include not found: ${inc}`);
    process.exit(1);
  }
  if (statSync(abs).isDirectory()) for (const f of walk(abs)) want[relative(REPO, f)] = f;
  else want[inc] = abs;
}

if (CHECK) {
  let stale = false;
  const have = existsSync(DEST) ? walk(DEST).map((f) => relative(DEST, f)) : [];
  for (const rel of Object.keys(want)) {
    const there = join(DEST, rel);
    if (!existsSync(there)) {
      stale = true;
      console.error(`✗ bundle missing ${rel}`);
    } else if (readFileSync(there, "utf8") !== readFileSync(want[rel], "utf8")) {
      stale = true;
      console.error(`✗ bundle stale ${rel}`);
    }
  }
  for (const rel of have)
    if (!want[rel]) {
      stale = true;
      console.error(`✗ bundle has stray ${rel}`);
    }
  if (stale) {
    console.error("\nRun: pnpm --filter @control-room/skill run build");
    process.exit(1);
  }
  console.log(`✓ skill bundle is in sync (${Object.keys(want).length} files)`);
  process.exit(0);
}

rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST, { recursive: true });
for (const inc of skill.include) cpSync(join(REPO, inc), join(DEST, inc), { recursive: true });
console.log(`bundled ${skill.include.length} includes → packages/skill/skills/${skill.installAs}/`);
