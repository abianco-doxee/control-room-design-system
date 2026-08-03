#!/usr/bin/env node
/**
 * Skill sync — single source of truth → every agent provider.
 *
 * Adopts the Doxee Design-System-Hub convention: the skill is authored once (at
 * the repo root: SKILL.md + references/ + templates/ + checklists/ + generated
 * token artifacts) and installed into each provider's skills directory. A
 * validity gate keeps the source well-formed and installs in sync.
 *
 *   node scripts/skills-sync.mjs            install into all providers
 *   node scripts/skills-sync.mjs --check    validate source; fail if installs drift
 *   node scripts/skills-sync.mjs --provider=claude   install into one provider
 */
import {
  readFileSync, existsSync, mkdirSync, rmSync, cpSync, statSync, readdirSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(ROOT, "skills", "manifest.json"), "utf8"));
const CHECK = process.argv.includes("--check");
const onlyProvider = (process.argv.find((a) => a.startsWith("--provider=")) || "").split("=")[1];

const errors = [];
const note = (m) => console.log(m);

/* ── validate the source skill ─────────────────────────────────────────── */
function validate(skill) {
  const skillMd = join(ROOT, skill.source, "SKILL.md");
  if (!existsSync(skillMd)) return errors.push(`missing ${skill.source}/SKILL.md`);
  const txt = readFileSync(skillMd, "utf8");
  const fm = txt.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) errors.push("SKILL.md has no YAML frontmatter");
  else {
    if (!/\bname:/.test(fm[1])) errors.push("SKILL.md frontmatter missing `name`");
    if (!/\bdescription:/.test(fm[1])) errors.push("SKILL.md frontmatter missing `description`");
  }
  // every include path must exist
  for (const inc of skill.include) {
    if (!existsSync(join(ROOT, inc))) errors.push(`include not found: ${inc}`);
  }
  // every repo-relative doc link in SKILL.md must resolve
  const linkRe = /\((?:\.\/)?((?:references|templates|checklists|tokens|dist|design-tokens)\/[^)\s#]+)\)/g;
  let m;
  const seen = new Set();
  while ((m = linkRe.exec(txt))) seen.add(m[1]);
  for (const rel of seen) {
    if (!existsSync(join(ROOT, rel))) errors.push(`SKILL.md links a missing file: ${rel}`);
  }
}

/* ── compare a built tree against the source (for --check) ─────────────── */
function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}
function stage(skill) {
  // the set of files this skill would install, as {relInStaged: absSource}
  const files = {};
  for (const inc of skill.include) {
    const abs = join(ROOT, inc);
    if (!existsSync(abs)) continue;
    if (statSync(abs).isDirectory()) {
      for (const f of walk(abs)) files[relative(join(ROOT), f)] = f;
    } else files[inc] = abs;
  }
  return files;
}

/* ── install ───────────────────────────────────────────────────────────── */
function install(skill, providerDir) {
  const dest = join(ROOT, providerDir, skill.installAs);
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  for (const inc of skill.include) {
    const abs = join(ROOT, inc);
    if (!existsSync(abs)) continue;
    cpSync(abs, join(dest, inc), { recursive: true });
  }
  note(`  installed ${skill.id} → ${providerDir}/${skill.installAs}`);
}

function checkInstall(skill, providerDir) {
  const dest = join(ROOT, providerDir, skill.installAs);
  if (!existsSync(dest)) return; // not installed here — nothing to drift-check
  const want = stage(skill);
  for (const [rel, abs] of Object.entries(want)) {
    const there = join(dest, rel);
    if (!existsSync(there)) errors.push(`${providerDir}: missing ${rel}`);
    else if (readFileSync(there, "utf8") !== readFileSync(abs, "utf8"))
      errors.push(`${providerDir}: stale ${rel}`);
  }
}

/* ── run ───────────────────────────────────────────────────────────────── */
const providers = Object.entries(manifest.providers).filter(
  ([name]) => !onlyProvider || name === onlyProvider,
);

for (const skill of manifest.skills) {
  validate(skill);
  if (CHECK) {
    for (const [, dir] of providers) checkInstall(skill, dir);
  } else {
    note(`sync ${skill.id}:`);
    for (const [, dir] of providers) install(skill, dir);
  }
}

if (errors.length) {
  console.error("\n✗ skills check failed:");
  for (const e of errors) console.error("  - " + e);
  if (CHECK) console.error("\nFix the source or run: npm run skills:sync");
  process.exit(1);
}
console.log(CHECK ? "✓ skill source is valid and installs are in sync" : "✓ skill installed to all providers");
