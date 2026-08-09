// Visual regression — full-page snapshot of the living gallery per theme.
// Baselines live in tests/visual.spec.mjs-snapshots/ and are platform-suffixed.
// Regenerate after intentional visual changes: npm run test:visual:update

import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";

const GALLERY = pathToFileURL(join(process.cwd(), "public", "gallery.html")).href;
const THEMES = ["dark", "light", "extreme", "phosphor"];

for (const theme of THEMES) {
  test(`gallery visual — ${theme}`, async ({ page }) => {
    await page.goto(GALLERY);
    await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    await page.evaluate(() => document.fonts?.ready);
    await expect(page).toHaveScreenshot(`gallery-${theme}.png`, {
      fullPage: true,
      animations: "disabled",
    });
  });
}
