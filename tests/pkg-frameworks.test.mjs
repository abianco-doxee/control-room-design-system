// Cross-framework RUNTIME gate (node:test). Run: npm run test:frameworks
//
// The library's headline claim is "author once, compile to six frameworks." This
// proves it at runtime for Vue, Svelte and Solid: each compiled component is fed
// through its own compiler + server renderer and must produce real Control Room
// markup, with props driving the output (so the component's logic actually runs on
// that target — not just type-checks). React is covered by react-dom/server in the
// pkg gate; Qwik by its import gate. Together: all six targets verified.
import { test } from "node:test";
import assert from "node:assert/strict";
import { RENDERERS } from "../build/render-fw.mjs";

// components that render cleanly headless (no children needed), with any required props
const BREADTH = [
  ["CrPanel", {}],
  ["CrAlert", {}],
  ["CrChip", {}],
  ["CrTag", {}],
  ["CrProgress", { value: 42 }],
  ["CrStatusDot", { label: "online" }],
  ["CrSwitch", {}],
  ["CrField", { id: "f1", label: "Name" }],
  ["CrDataGrid", { columns: [{ key: "a", label: "A" }, { key: "b", label: "B", sortable: true }], rows: [{ a: 1, b: 2 }, { a: 3, b: 4 }] }],
];

for (const [fw, render] of Object.entries(RENDERERS)) {
  test(`${fw}: CrButton renders and reflects props (component logic runs)`, async () => {
    const html = await render("CrButton", { signal: "accent", emphasis: "outline" });
    assert.match(html, /<button/, `${fw}: renders a <button>`);
    assert.match(html, /cr-btn/, `${fw}: base class`);
    assert.match(html, /cr-btn--outline/, `${fw}: emphasis prop → class`);
    assert.match(html, /cr-btn--sig-accent/, `${fw}: signal prop → class`);
  });

  test(`${fw}: a spread of components compile + SSR-render to cr- markup`, async () => {
    for (const [name, props] of BREADTH) {
      const html = await render(name, props);
      assert.ok(html && html.length > 0, `${fw}: ${name} produced no output`);
      assert.match(html, /class="[^"]*\bcr-[a-z]/, `${fw}: ${name} → a cr- class`);
    }
  });

  test(`${fw}: a value prop drives reactive output (CrProgress)`, async () => {
    const low = await render("CrProgress", { value: 20 });
    const high = await render("CrProgress", { value: 90 });
    assert.notEqual(low, high, `${fw}: different values must produce different markup`);
  });
}
