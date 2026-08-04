// Responsiveness gate — the gallery and component browser must not force
// horizontal scroll at common breakpoints. Dense dashboards can be desktop-first,
// but "no horizontal overflow" is the floor, verified rather than assumed.
import { test, expect } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const PAGES = ["gallery.html", "components.html"];
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
      expect(scrollWidth, `overflow ${scrollWidth - clientWidth}px`).toBeLessThanOrEqual(clientWidth + 1);
    });
  }
}
