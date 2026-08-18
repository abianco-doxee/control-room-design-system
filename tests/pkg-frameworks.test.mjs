// Cross-framework RUNTIME gate (node:test). Run: npm run test:frameworks
//
// The library's headline claim is "author once, compile to six frameworks." This
// proves it at runtime for Vue, Svelte and Solid: each compiled component is fed
// through its own compiler + server renderer and must produce real Control Room
// markup, with props driving the output (so the component's logic actually runs on
// that target — not just type-checks). React is covered by react-dom/server in the
// pkg gate; Qwik by its import gate. Together: all six targets verified.

import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { instantiateAngular, RENDERERS } from "../packages/components/build/render-fw.mjs";
import { propsFor } from "./fixtures/component-props.mjs";

/** Every compiled component, from the solid output (all targets emit the same set). */
const ALL = readdirSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "packages",
    "components",
    "dist",
    "frameworks",
    "solid",
    "components"
  )
)
  .filter((f) => f.endsWith(".jsx"))
  .map((f) => f.replace(/\.jsx$/, ""))
  .sort();

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
  [
    "CrDataGrid",
    {
      columns: [
        { key: "a", label: "A" },
        { key: "b", label: "B", sortable: true },
      ],
      rows: [
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ],
    },
  ],
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

  // The BREADTH list above is ~10 components — the ones that render with no props.
  // That gap is why CrCalendar could throw on every Solid render and CrLineChart on
  // every Svelte render with the suite fully green: nothing ever rendered them.
  // This renders EVERY component with a realistic prop set (tests/fixtures).
  test(`${fw}: every component SSR-renders`, async () => {
    const failed = [];
    for (const name of ALL) {
      try {
        const html = await render(name, propsFor(name));
        if (!html || !html.length) failed.push(`${name}: produced no output`);
      } catch (e) {
        failed.push(`${name}: ${String(e.message).split("\n")[0]}`);
      }
    }
    assert.deepEqual(failed, [], `${fw} render failures:\n  ${failed.join("\n  ")}`);
  });
}

// Angular can't be SSR-rendered in plain Node (see the note above), so the
// equivalent floor is that every component INSTANTIATES on the real @angular/core.
test("angular: every component instantiates", async () => {
  const failed = [];
  for (const name of ALL) {
    try {
      await instantiateAngular(name, propsFor(name));
    } catch (e) {
      failed.push(`${name}: ${String(e.message).split("\n")[0]}`);
    }
  }
  assert.deepEqual(failed, [], `angular instantiation failures:\n  ${failed.join("\n  ")}`);
});

// Angular: full SSR needs the Angular build linker (not viable in plain Node), so
// we verify the component's LOGIC executes on the real @angular/core instead.
test("angular: CrButton logic executes on @angular/core (@Input getter + @Output)", async () => {
  const { instance } = await instantiateAngular("CrButton", {
    signal: "accent",
    emphasis: "outline",
    size: "sm",
  });
  assert.equal(
    instance.cls,
    "cr-btn cr-btn--outline cr-btn--sig-accent cr-btn--sm",
    "@Input-driven class getter runs"
  );
  assert.equal(typeof instance.onClick.emit, "function", "@Output is a real EventEmitter");
});

test("angular: a spread instantiates on @angular/core with cr- templates", async () => {
  for (const name of ["CrPanel", "CrChip", "CrAlert", "CrProgress", "CrDataGrid"]) {
    const { instance, source } = await instantiateAngular(name, {});
    assert.ok(instance, `${name} instantiated`);
    assert.match(source, /@Component\(/, `${name} is an Angular component`);
    assert.match(source, /cr-/, `${name} template carries cr- markup`);
  }
});
