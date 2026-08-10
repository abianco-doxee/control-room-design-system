// Smoke test for @alebianco/cr-mcp — spins up the stdio server via an MCP client
// and asserts the tools, resources, and a few representative calls work against
// the bundled data. Guards against a broken data bundle or a tool regression.
import assert from "node:assert/strict";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const SERVER = fileURLToPath(new URL("../packages/mcp/server.mjs", import.meta.url));
let client;

before(async () => {
  client = new Client({ name: "mcp-test", version: "1.0.0" });
  await client.connect(new StdioClientTransport({ command: "node", args: [SERVER] }));
});
after(async () => {
  await client?.close();
});

test("exposes the expected tools", async () => {
  const names = (await client.listTools()).tools.map((t) => t.name).sort();
  assert.deepEqual(names, [
    "get_component",
    "get_reference",
    "list_components",
    "list_references",
    "list_theme_roles",
    "search_components",
  ]);
});

test("exposes the catalog + theme-contract resources", async () => {
  const uris = (await client.listResources()).resources.map((r) => r.uri).sort();
  assert.deepEqual(uris, ["control-room://catalog", "control-room://theme-contract"]);
});

test("get_component returns a full entry", async () => {
  const res = await client.callTool({ name: "get_component", arguments: { id: "button" } });
  const e = JSON.parse(res.content[0].text);
  assert.equal(e.id, "button");
  assert.ok(e.variants && Object.keys(e.variants).length, "has variants");
  assert.ok(Array.isArray(e.tokens) && e.tokens.length, "has tokens");
});

test("search_components handles multi-word queries", async () => {
  const res = await client.callTool({
    name: "search_components",
    arguments: { query: "date picker" },
  });
  const ids = JSON.parse(res.content[0].text).matches.map((m) => m.id);
  assert.ok(ids.includes("datetime"), `expected datetime in ${ids.join(",")}`);
});

test("list_theme_roles returns the contract roles", async () => {
  const res = await client.callTool({ name: "list_theme_roles", arguments: {} });
  const out = JSON.parse(res.content[0].text);
  assert.ok(out.roles.length >= 20, "has theme roles");
  assert.ok(
    out.roles.every((r) => r.cssVar),
    "roles carry cssVar"
  );
});

test("get_reference returns doc markdown", async () => {
  const res = await client.callTool({
    name: "get_reference",
    arguments: { doc: "design-language" },
  });
  assert.match(res.content[0].text, /law/i);
});
