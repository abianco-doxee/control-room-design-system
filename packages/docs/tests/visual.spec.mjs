// Visual regression — full-page snapshot of the component browser per theme.
// Baselines live in tests/visual.spec.mjs-snapshots/ and are platform-suffixed.
// Regenerate after intentional visual changes: npm run test:visual:update

import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";

const SHOWCASE = pathToFileURL(join(process.cwd(), "public", "components.html")).href;
const THEMES = ["dark", "light", "extreme", "phosphor"];

for (const theme of THEMES) {
  test(`component browser visual — ${theme}`, async ({ page }) => {
    await page.goto(SHOWCASE);
    await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    await page.evaluate(() => document.fonts?.ready);
    await expect(page).toHaveScreenshot(`components-${theme}.png`, {
      fullPage: true,
      animations: "disabled",
    });
  });
}
