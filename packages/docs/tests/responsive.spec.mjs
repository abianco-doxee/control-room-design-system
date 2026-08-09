// Responsiveness gate — the gallery and component browser must not force
// horizontal scroll at common breakpoints. Dense dashboards can be desktop-first,
// but "no horizontal overflow" is the floor, verified rather than assumed.

import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";

const PAGES = ["gallery.html", "components.html", "brands.html"];
const WIDTHS = [375, 768, 1024];

for (const file of PAGES) {
  for (const width of WIDTHS) {
    test(`${file} — no horizontal overflow @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(pathToFileURL(join(process.cwd(), "public", file)).href);
      await page.waitForTimeout(300);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      // 1px tolerance for sub-pixel rounding.
      expect(scrollWidth, `overflow ${scrollWidth - clientWidth}px`).toBeLessThanOrEqual(
        clientWidth + 1
      );
    });
  }
  // RTL: the layout mirrors via logical properties and must not overflow either.
  test(`${file} — RTL: no horizontal overflow @ 1024px`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto(pathToFileURL(join(process.cwd(), "public", file)).href);
    await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"));
    await page.waitForTimeout(300);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth, `RTL overflow ${scrollWidth - clientWidth}px`).toBeLessThanOrEqual(
      clientWidth + 1
    );
  });
}
