// The Component Browser's live islands are the REAL compiled React components
// (dist/frameworks/react), mounted client-side. This gate proves they actually
// mount, error-free, and stay interactive — so the browser can't silently
// regress to dead markup.
import { test, expect } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const SHOWCASE = pathToFileURL(join(process.cwd(), "public", "components.html")).href;

test.describe("component browser — live islands", () => {
  test("every island mounts the real component with no errors", async ({ page }) => {
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));

    // registry (DEMOS keys) and the mount points the generator emitted must match —
    // this is the drift guard between build-showcase.mjs's ISLAND_IDS and the entry.
    const registry = await page.evaluate(() => window.__CR_ISLANDS__.slice().sort());
    const mounts = await page.$$eval("[data-island]", (els) =>
      els.map((e) => e.getAttribute("data-island")).sort());
    expect(mounts).toEqual(registry);
    expect(mounts.length).toBeGreaterThanOrEqual(22);

    // each mount hydrated (ready flag set, no error flag)
    await expect(page.locator("[data-island]:not([data-island-ready])")).toHaveCount(0);
    const failed = await page.$$eval("[data-island][data-island-error]", (els) =>
      els.map((e) => `${e.getAttribute("data-island")}: ${e.getAttribute("data-island-error")}`));
    expect(failed, failed.join(", ") || "none").toEqual([]);

    expect(errors, errors.join("\n") || "none").toEqual([]);
  });

  test("islands are interactive, not static markup", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const scope = (id) => page.locator(`[data-island="${id}"]`);

    // tabs: selecting a tab updates the controlled panel + aria-selected
    const tabs = scope("tabs");
    await tabs.getByRole("tab").nth(2).click();
    await expect(tabs.getByRole("tab").nth(2)).toHaveAttribute("aria-selected", "true");
    await expect(tabs.locator("p")).toContainText("panel 3");

    // switch: toggles its controlled state
    const sw = scope("switch").getByRole("switch");
    const before = await sw.getAttribute("aria-checked");
    await sw.click();
    await expect(sw).not.toHaveAttribute("aria-checked", before || "");

    // accordion: header toggles aria-expanded
    const hdr = scope("accordion").getByRole("button").nth(1);
    const wasOpen = (await hdr.getAttribute("aria-expanded")) === "true";
    await hdr.click();
    await expect(hdr).toHaveAttribute("aria-expanded", wasOpen ? "false" : "true");
  });

  test("editing a control prop re-renders the live component", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    const seg = page.locator('[data-island="segmented"]');

    // change the `value` enum control in the panel → the live segmented updates
    await seg.locator(".pg__controls select").selectOption("24h");
    await expect(seg.locator('.pg__live [aria-checked="true"]')).toHaveText("24h");

    // toggle the slider's `disabled` boolean control → the live input disables
    const slider = page.locator('[data-island="slider"]');
    await slider.locator('.pg__controls input[type="checkbox"]').check();
    await expect(slider.locator('.pg__live input[type="range"]')).toBeDisabled();

    // the code snippet reflects the current props
    await expect(slider.locator(".pg__code")).toContainText("disabled");
  });

  test("keyboard focus shows a visible ring", async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.waitForFunction(() => Array.isArray(window.__CR_ISLANDS__));
    // Tab into the page (keyboard focus → :focus-visible applies) and confirm the
    // tokenized global focus ring actually renders on the focused control.
    await page.keyboard.press("Tab");
    const ring = await page.evaluate(() => {
      const el = document.activeElement;
      const s = getComputedStyle(el);
      return { tag: el && el.tagName, style: s.outlineStyle, width: parseFloat(s.outlineWidth) || 0 };
    });
    expect(ring.tag, "something is focused").toBeTruthy();
    expect(ring.style, "outline style").not.toBe("none");
    expect(ring.width, "outline width > 0").toBeGreaterThan(0);
  });
});
