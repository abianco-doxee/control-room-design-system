#!/usr/bin/env node
/**
 * control-room-skill — install the Control Room skill into an agent provider.
 *
 *   npx @abianco-doxee/cr-skill                 → ./.claude/skills/control-room-design-system
 *   npx @abianco-doxee/cr-skill --global        → ~/.claude/skills/control-room-design-system
 *   npx @abianco-doxee/cr-skill --provider=cursor   (or opencode)  → .cursor/skills / .opencode/skills
 *   npx @abianco-doxee/cr-skill --dir=path/to/skills
 *
 * Copies the bundled skill (SKILL.md + references + templates + checklists + the
 * machine-readable token/catalog artifacts) into the target skills directory.
 */
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILLS_SRC = join(HERE, "..", "skills");
const NAME = readdirSync(SKILLS_SRC)[0]; // the single bundled skill (control-room-design-system)
const SRC = join(SKILLS_SRC, NAME);

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (k) => (args.find((a) => a.startsWith(`${k}=`)) || "").split("=")[1];

if (has("--help") || has("-h")) {
  console.log(
    [
      "Install the Control Room agent skill.",
      "",
      "  npx @abianco-doxee/cr-skill                install into ./.claude/skills (this project)",
      "  npx @abianco-doxee/cr-skill --global       install into ~/.claude/skills (all projects)",
      "  npx @abianco-doxee/cr-skill --provider=cursor|opencode",
      "  npx @abianco-doxee/cr-skill --dir=<path>   install into a custom skills dir",
      "",
      "Tip: Claude Code users can instead run  /plugin marketplace add abianco-doxee/control-room-design-system",
    ].join("\n")
  );
  process.exit(0);
}

const provider = val("--provider") || "claude";
const providerDir = { claude: ".claude", cursor: ".cursor", opencode: ".opencode" }[provider];
if (!providerDir) {
  console.error(`Unknown --provider "${provider}". Use claude | cursor | opencode.`);
  process.exit(1);
}

let base;
if (val("--dir")) base = resolve(val("--dir"));
else if (has("--global")) base = join(homedir(), providerDir, "skills");
else base = resolve(providerDir, "skills");

const dest = join(base, NAME);
mkdirSync(base, { recursive: true });
if (existsSync(dest)) console.log(`Replacing existing install at ${dest}`);
cpSync(SRC, dest, { recursive: true });

console.log(`✓ installed "${NAME}" → ${dest}`);
console.log("\nStart your agent in this directory and the skill is available.");
console.log("\nFor the live component/token tools, also add the MCP server:");
console.log(
  '  { "mcpServers": { "control-room": { "command": "npx", "args": ["-y", "@abianco-doxee/cr-mcp"] } } }'
);
