// Client-runtime gate — the six targets in a real browser.
//
// Every other runtime gate is SSR: it proves a component produces the right
// markup once. This proves the part that makes them components at all — that a
// click reaches the handler, and that internal state re-renders the DOM. A
// component can SSR perfectly and still be inert in the browser (a dropped
// listener, a handler bound to a dead attribute, a reactive read that never
// tracks), and nothing outside React's islands suite would have caught it.
//
// Each target is compiled by its own real toolchain (build/bundle-client.mjs),
// served as an IIFE that defines `window.__mount(el, props)`, and driven with
// actual Playwright clicks and keypresses.
//
// Deliberately NOT part of `test:*` on every push: six browser bundles (Angular
// alone is ~3MB with the JIT compiler) cost far more than the SSR gates. It runs
// on the `Client runtime` workflow — manual dispatch, plus a weekly schedule.
import { expect, test } from "@playwright/test";
import { bundleAngular } from "../../angular-aot/build/bundle-aot.mjs";
import { bundleClient } from "../../components/build/bundle-client.mjs";

// Angular gets here through AOT, not the shared bundler.
//
// A browser mount normally means JIT, and JIT kept failing with NG0203: the
// injector could not construct a generated component even though every piece of
// metadata was present and the same context injected fine into a hand-written
// one. AOT sidesteps the question — ngc bakes the factory into a `ɵcmp`
// definition, so nothing reflects over a constructor at runtime — and it is what
// `ng build` does anyway, so this exercises the path consumers actually take.
//
// Two things that path needs and JIT did not: a standalone host (BrowserModule
// drags in Angular internals that are still JIT-compiled), and the Angular build
// LINKER over @angular/* — the published packages are partially compiled, and
// without linking the browser reports "_PlatformLocation needs to be compiled
// using the JIT compiler".
const TARGETS = ["react", "vue", "svelte", "solid", "qwik", "angular"];

/** A blank page with the bundle inlined, so nothing depends on a dev server. */
async function mount(page, target, component, props = {}) {
  if (target === "angular") return mountAngular(page, component, props);
  const code = await bundleClient(target, component);
  await page.setContent('<!doctype html><html><body><div id="app"></div></body></html>');
  if (target === "qwik") {
    // Qwik binds `onClick$` as a QRL attribute, not a DOM listener — the
    // qwikloader is what delegates real events to it. Client render() alone
    // produces correct markup that is completely inert, which is precisely the
    // failure mode this suite exists to catch, so the loader has to be present
    // for the test to be measuring the component rather than its absence.
    const { readFileSync } = await import("node:fs");
    const { createRequire } = await import("node:module");
    const req = createRequire(import.meta.url);
    await page.addScriptTag({
      content: readFileSync(req.resolve("@builder.io/qwik/qwikloader.js"), "utf8"),
    });
  }
  await page.addScriptTag({ content: code });
  await page.evaluate(
    ([p]) => {
      window.__calls = [];
      const el = document.getElementById("app");
      // Handlers are installed here rather than serialised into props: functions
      // do not survive the boundary, so each target gets a real callback that
      // records into window.__calls.
      const withHandlers = { ...p };
      for (const key of ["onChange", "onClick", "onSelect"]) {
        withHandlers[key] = (value) => window.__calls.push([key, value]);
      }
      return window.__mount(el, withHandlers);
    },
    [props]
  );
  // Qwik and Angular bootstrap asynchronously.
  await page.waitForFunction(() => document.querySelector("#app *") !== null, null, {
    timeout: 15000,
  });
}

/** Angular's mount: the host template is generated at BUILD time (AOT needs real
 *  source to compile), so inputs/outputs are passed to the bundler rather than
 *  applied afterwards. */
async function mountAngular(page, component, props) {
  const inputs = Object.keys(props).filter((k) => typeof props[k] !== "function");
  const outputs = ["onChange", "onClick", "onSelect"];
  const code = await bundleAngular(component, inputs, outputs);
  await page.setContent(
    '<!doctype html><html><body><div id="app"><app-root></app-root></div></body></html>'
  );
  await page.evaluate(
    ([p]) => {
      window.__props = p;
      window.__calls = [];
    },
    [props]
  );
  await page.addScriptTag({ content: code });
  await page.evaluate(() => window.__bootstrap());
  await page.waitForFunction(() => document.querySelector("#app app-root *") !== null, null, {
    timeout: 15000,
  });
}

for (const target of TARGETS) {
  test.describe(`${target} client runtime`, () => {
    test("renders a component into the DOM", async ({ page }) => {
      await mount(page, target, "CrButton", { signal: "accent", emphasis: "outline" });
      const btn = page.locator("#app button, #app a").first();
      await expect(btn).toBeVisible();
      await expect(btn).toHaveClass(/cr-btn/);
      // props must drive the output, not just render a default
      await expect(btn).toHaveClass(/cr-btn--outline/);
      await expect(btn).toHaveClass(/cr-btn--sig-accent/);
    });

    test("a click reaches the consumer's handler", async ({ page }) => {
      await mount(page, target, "CrSwitch", { checked: false, label: "Live" });
      await page.locator('#app [role="switch"]').first().click();
      const calls = await page.evaluate(() => window.__calls);
      expect(calls.length, `${target}: onChange never fired`).toBeGreaterThan(0);
      // CrSwitch toggles: false → true
      expect(calls[0][1]).toBe(true);
    });

    test("internal state re-renders the DOM", async ({ page }) => {
      // CrTabs owns its selected index, so clicking tab 3 must update
      // aria-selected without the caller passing anything back in. This is the
      // assertion SSR structurally cannot make.
      await mount(page, target, "CrTabs", { tabs: ["One", "Two", "Three"] });
      const tabs = page.locator('#app [role="tab"]');
      await expect(tabs).toHaveCount(3);
      await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
      await tabs.nth(2).click();
      await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
      await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "false");
    });
  });
}
