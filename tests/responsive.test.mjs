// Guards the responsive architecture: fluid type + per-container density.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(ROOT, "dist", "control-room.css"), "utf8");
const comp = readFileSync(join(ROOT, "styles", "components.css"), "utf8");

test("the text scale is fluid + container-relative (cqi), floored at legacy px", () => {
  for (const [v, floor] of [["--text-base", "13px"], ["--text-sm", "12px"], ["--text-xs", "11px"]]) {
    const m = css.match(new RegExp(v + ":\\s*([^;]+);"));
    assert.ok(m, `${v} defined`);
    assert.match(m[1], /clamp\(/, `${v} is a clamp`);
    assert.match(m[1], /cqi/, `${v} scales on cqi`);
    assert.ok(m[1].includes(floor), `${v} floor = legacy ${floor} (no shrink / no new overflow)`);
  }
});

test("panel surfaces are query containers (type sizes to the panel)", () => {
  assert.match(comp, /\.cr-panel[^{]*\{[^}]*container-type:\s*inline-size/s, "panel declares inline-size container");
});

test("all 8 type roles are emitted", () => {
  for (const r of ["display", "h1", "h2", "body", "data", "label", "meta", "chrome"]) {
    // each role exposes at least a size token (data uses --type-data-size-fluid)
    const sizeVar = r === "data" ? "--type-data-size-fluid" : `--type-${r}-size`;
    assert.match(css, new RegExp(sizeVar + "\\s*:"), `${r} role has a size token`);
  }
});

test("container-query layout: an @container rule + a responsive grid exist", () => {
  assert.match(comp, /@container\s*\([^)]*max-width:\s*22rem\)/, "a panel-width @container rule exists");
  assert.match(comp, /\.cr-grid-auto[^{]*\{[^}]*repeat\(auto-fill/s, "container-reflowing grid utility");
});

test("density is per-container: compact remaps the spacing aliases", () => {
  assert.match(comp, /\[data-density="compact"\]\s*\{[^}]*--pad:/s, "compact remaps --pad");
  assert.match(comp, /\[data-density="compact"\]\s*\{[^}]*--gap:/s, "compact remaps --gap");
  // comfortable defaults exist in the shipped stylesheet
  assert.match(css, /--pad:\s*var\(--space-3\)/, "comfortable --pad = space-3");
  // a component token routes through the density alias (so it responds to compact)
  assert.match(css, /--cr-panel-pad:\s*var\(--pad\)/, "panel pad routes through --pad");
});
