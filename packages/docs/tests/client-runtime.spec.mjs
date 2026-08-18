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
import { bundleClient } from "../../components/build/bundle-client.mjs";

// Angular is absent from THIS suite — it has its own gate, test:aot.
//
// Running it in a browser means JIT, and JIT needs constructor metadata that
// nothing in this toolchain produces: esbuild does not implement
// emitDecoratorMetadata (documented, verified — it emits no design:paramtypes),
// and TypeScript 7 removed the transpileModule API that could generate it.
// Supplying Angular's own `static ctorParameters` fallback gets past NG0202 —
// DI then resolves both CrContext and Renderer2 — but bootstrap moves on to
// NG0203 on the injectable context, and each layer peeled back reveals the next.
// So Angular is covered the way it is actually consumed instead: packages/angular-aot
// compiles all 81 through the real ngc, which type-checks each component class
// AND its template. That found six defects the instantiate gate could not see.
// What remains uncovered for Angular alone is live DOM interaction — a real click
// on a real element — which needs a browser it cannot be bootstrapped into here.
//
// The three defects found while attempting this DO ship (see
// build-fix-angular.mjs): standalone:false, the typed Renderer2 parameter, and
// the missing CrContext import each broke all 81 components for any consumer on
// Angular >= 19.
const TARGETS = ["react", "vue", "svelte", "solid", "qwik"];

/** A blank page with the bundle inlined, so nothing depends on a dev server. */
async function mount(page, target, component, props = {}) {
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
