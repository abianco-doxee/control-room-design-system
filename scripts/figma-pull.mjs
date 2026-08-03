#!/usr/bin/env node
/**
 * Figma connectivity + token smoke test (and minimal file pull).
 *
 * Providing the token — pick ONE, no UI hunting, nothing in chat:
 *   1) a git-ignored .env file at the repo root:   FIGMA_TOKEN=figd_xxx
 *   2) an exported shell var:                       export FIGMA_TOKEN=figd_xxx
 *   3) your Claude Code environment settings (env vars) — injected as FIGMA_TOKEN
 *
 * Usage:
 *   npm run figma:pull                 # validate the token (calls /v1/me)
 *   npm run figma:pull -- <fileKey>    # also fetch a file's top-level nodes
 *
 * The token is read from the environment only. It is NEVER printed or logged.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// load .env (simple, dependency-free) without overriding real env vars
if (existsSync(join(ROOT, ".env"))) {
  for (const line of readFileSync(join(ROOT, ".env"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const token = process.env.FIGMA_TOKEN;
if (!token) {
  console.error(
    "✗ FIGMA_TOKEN not set.\n\n" +
      "  Provide it one of these ways (never paste it in chat):\n" +
      "   • cp .env.example .env  then put FIGMA_TOKEN=figd_… in .env  (git-ignored)\n" +
      "   • export FIGMA_TOKEN=figd_…\n" +
      "   • add FIGMA_TOKEN in your Claude Code environment settings\n\n" +
      "  Create a READ-ONLY token at https://www.figma.com/developers/api#access-tokens\n",
  );
  process.exit(1);
}

const fileKey = process.argv[2];
const headers = { "X-Figma-Token": token };

async function figma(path) {
  const res = await fetch(`https://api.figma.com${path}`, { headers });
  if (!res.ok) throw new Error(`Figma API ${res.status} ${res.statusText} for ${path}`);
  return res.json();
}

try {
  const me = await figma("/v1/me");
  console.log(`✓ token valid — authenticated as ${me.handle || me.email || me.id}`);

  if (fileKey) {
    const file = await figma(`/v1/files/${encodeURIComponent(fileKey)}?depth=1`);
    console.log(`✓ file: "${file.name}"  (last modified ${file.lastModified})`);
    const top = (file.document?.children || []).map((n) => `${n.name} [${n.type}]`);
    console.log(`  top-level nodes (${top.length}): ${top.join(", ") || "(none)"}`);
    console.log("\nNext: wire these into the `figma` map in catalog/registry.json (see references/figma-bridge.md).");
  } else {
    console.log("  (pass a file key to also list its top-level nodes: npm run figma:pull -- <fileKey>)");
  }
} catch (err) {
  console.error(`✗ ${err.message}`);
  console.error(
    "  If this is a network/egress error, run it where api.figma.com is reachable\n" +
      "  (your local machine) — some sandboxes block outbound Figma.",
  );
  process.exit(1);
}
