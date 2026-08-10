// Test the @abianco-doxee/cr-skill npx installer: running the bin against a target
// dir must lay down a usable skill (SKILL.md + references + the machine artifacts).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const BIN = fileURLToPath(new URL("../packages/skill/bin/install.mjs", import.meta.url));
const DEST = join(tmpdir(), "cr-skill-install-test");
const SKILL = join(DEST, "control-room-design-system");

after(() => rmSync(DEST, { recursive: true, force: true }));

test("installer lays down a usable skill into --dir", () => {
  rmSync(DEST, { recursive: true, force: true });
  const out = execFileSync("node", [BIN, `--dir=${DEST}`], { encoding: "utf8" });
  assert.match(out, /installed/i);
  for (const f of [
    "SKILL.md",
    "references/design-language.md",
    "references/components.md",
    "catalog/catalog.json",
    "packages/tokens/dist/control-room.css",
  ]) {
    assert.ok(existsSync(join(SKILL, f)), `installed skill is missing ${f}`);
  }
});

test("installer prints the MCP config hint", () => {
  const out = execFileSync("node", [BIN, `--dir=${DEST}`], { encoding: "utf8" });
  assert.match(out, /@abianco-doxee\/cr-mcp/);
});
